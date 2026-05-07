import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";
import { extractImagesFromContent } from "../utils/extractImages";
import slugify from "slugify";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase (for deleting images from storage) ──────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const BUCKET = "news-images";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function normalizeTagName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function buildUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const raw = slugify(base, { lower: true, strict: true });
  const existing = await prisma.news.findFirst({
    where: { slug: raw, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (!existing) return raw;
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${raw}-${suffix}`;
}

function toArticleTypeEnum(type?: string): "STANDARD" | "BREAKING" | "LIVE" {
  const map: Record<string, "STANDARD" | "BREAKING" | "LIVE"> = {
    STANDARD: "STANDARD", BREAKING: "BREAKING", LIVE: "LIVE",
    "Standard Article": "STANDARD", "Breaking News": "BREAKING", "Live Updates": "LIVE",
  };
  return map[type ?? ""] ?? "STANDARD";
}

function normalisePriority(raw: unknown): string | null {
  if (!raw) return null;
  const u = String(raw).toUpperCase();
  return ["CRITICAL", "HIGH", "MEDIUM"].includes(u) ? u : null;
}

async function resolveCategoryId(body: any): Promise<string> {
  if (body.categoryId?.trim()) return String(body.categoryId.trim());

  const name = String(body.category ?? "").trim();
  if (!name) throw new Error("Category is required");

  let cat = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  if (!cat) {
    const slug = slugify(name, { lower: true, strict: true });
    cat = await prisma.category.create({
      data: { name, slug: `${slug}-${Math.random().toString(36).slice(2, 5)}` },
    });
  }

  return cat.id;
}

// ─── Shared tag upsert helper ──────────────────────────────────────────────────
async function upsertTags(tags: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const tagName of tags) {
    const normalized = normalizeTagName(tagName);
    const tagSlug    = slugify(normalized, { lower: true, strict: true });

    let tag = await prisma.tag.findFirst({ where: { slug: tagSlug } });

    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: normalized, slug: tagSlug, usageCount: 1 },
      });
    } else {
      await prisma.tag.update({
        where: { id: tag.id },
        data:  { usageCount: { increment: 1 } },
      });
    }
    ids.push(tag.id);
  }
  return ids;
}

// ─── CREATE ────────────────────────────────────────────────────────────────────
export const createNews = async (req: AuthRequest, res: Response) => {
  console.log("FILE:", req.file);
  console.log("BODY keys:", Object.keys(req.body));
  try {
    const {
      headline, shortTitle, excerpt, content, language, location, tags, articleType,
      breakingNewsTicker, breakingPushNotif, breakingHomepageAlert,
      priority, statusType, expiryTime,
      liveUpdates,
      featuredImage, imageCaption, photoCredit,
      metaTitle, metaDescription, keywords, focusKeywords, canonicalUrl,
      status, publishAt,
      deleteMode,
      deleteIntervalDays,
    } = req.body;

    if (!headline?.trim()) return res.status(400).json({ message: "Headline is required." });

    let categoryId: string;
    try { categoryId = await resolveCategoryId(req.body); }
    catch (e: any) { return res.status(400).json({ message: e.message }); }

    const slug     = await buildUniqueSlug(headline);
    const typeEnum = toArticleTypeEnum(articleType);

    // ── Status / dates ────────────────────────────────────────────────────────
    let publishedAt: Date | null  = null;
    let scheduledAt: Date | null  = null;
    let deletedAt:   Date | null  = null;
    let deleteAfter: Date | null  = null;
    let resolvedStatus            = status || "DRAFT";

    if (resolvedStatus === "PUBLISHED") {
      publishedAt = new Date();
    } else if (resolvedStatus === "SCHEDULED") {
      if (!publishAt) return res.status(400).json({ message: "publishAt is required for scheduled articles." });
      scheduledAt = new Date(publishAt);
    } else if (resolvedStatus === "DELETED") {
      deletedAt = new Date();
      if (deleteMode === "interval") {
        const days = parseInt(String(deleteIntervalDays ?? 14));
        deleteAfter = new Date(Date.now() + days * 86_400_000);
      }
      if (deleteMode === "instant") {
        return res.status(200).json({ success: true, message: "Article instantly deleted (not stored)." });
      }
    }

    // ── Tags ──────────────────────────────────────────────────────────────────
    let rawTags: string[] = [];
    if (Array.isArray(req.body["tags[]"])) {
      rawTags = req.body["tags[]"];
    } else if (req.body["tags[]"]) {
      rawTags = [req.body["tags[]"]];
    } else if (Array.isArray(tags)) {
      rawTags = tags;
    } else if (typeof tags === "string" && tags.trim()) {
      rawTags = tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
    const tagConnections = rawTags.length ? await upsertTags(rawTags) : [];

    // ── Image URL ─────────────────────────────────────────────────────────────
    // uploadToSupabase middleware sets req.uploadedImageUrl with the Supabase
    // public URL. Fall back to a plain https URL from the body if provided.
    // Never store blob: URLs.
    let imageUrl: string | null = null;
    if ((req as any).uploadedImageUrl) {
      imageUrl = (req as any).uploadedImageUrl;
    } else if (featuredImage?.trim() && !featuredImage.startsWith("blob:")) {
      imageUrl = featuredImage.trim();
    }

    // ── Keywords ──────────────────────────────────────────────────────────────
    let resolvedKeywords: string[] = [];
    if (Array.isArray(req.body["keywords[]"])) {
      resolvedKeywords = req.body["keywords[]"];
    } else if (req.body["keywords[]"]) {
      resolvedKeywords = [req.body["keywords[]"]];
    } else if (Array.isArray(keywords)) {
      resolvedKeywords = keywords;
    } else if (typeof keywords === "string" && keywords.trim()) {
      resolvedKeywords = keywords.split(",").map((k: string) => k.trim()).filter(Boolean);
    }

    // ── Author ────────────────────────────────────────────────────────────────
    let resolvedAuthorId: string;
    if (req.user?.id) {
      resolvedAuthorId = req.user.id;
    } else {
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      if (!firstUser) return res.status(500).json({ message: "No users found in DB. Please create an admin user first." });
      resolvedAuthorId = firstUser.id;
    }

    const news = await prisma.news.create({
      data: {
        headline:  headline.trim(),
        shortTitle: shortTitle?.trim() || null,
        excerpt:    excerpt?.trim()    || null,
        content:   content || "",
        categoryId,
        language:  language || "English",
        location:  location?.trim() || null,
        tags: {
          create: tagConnections.map(tagId => ({ tag: { connect: { id: tagId } } })),
        },
        articleType: typeEnum,

        breakingNewsTicker:    typeEnum === "BREAKING" ? Boolean(breakingNewsTicker)    : false,
        breakingPushNotif:     typeEnum === "BREAKING" ? Boolean(breakingPushNotif)     : false,
        breakingHomepageAlert: typeEnum === "BREAKING" ? Boolean(breakingHomepageAlert) : false,

        priority: normalisePriority(priority),
        statusType: statusType || (resolvedStatus === "SCHEDULED" ? "scheduled" : "published"),
        expiryTime: expiryTime ? new Date(expiryTime) : null,

        liveUpdates: typeEnum === "LIVE" && Array.isArray(liveUpdates) ? liveUpdates : undefined,

        featuredImage: imageUrl,
        imageCaption:  imageCaption?.trim()  || null,
        photoCredit:   photoCredit?.trim()   || null,

        metaTitle:       metaTitle?.trim()       || null,
        metaDescription: metaDescription?.trim() || null,
        slug,
        keywords:      resolvedKeywords,
        focusKeywords: focusKeywords?.trim() || null,
        canonicalUrl:  canonicalUrl?.trim()  || null,

        status: resolvedStatus as any,
        publishedAt,
        scheduledAt,
        deletedAt,
        deleteAfter,

        authorId: resolvedAuthorId,
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    });

    res.status(201).json({ success: true, news });
  } catch (error: any) {
    console.error("createNews error:", error);
    const msg = error?.meta?.cause ?? error?.message ?? "Error creating news";
    console.error("createNews FULL error:", JSON.stringify(error, null, 2));
    res.status(500).json({ message: msg });
  }
};

// ─── GET ALL ───────────────────────────────────────────────────────────────────
export const getAllNews = async (req: Request, res: Response) => {
  try {
    const { category, categoryId, search, articleType, status, priority, page, limit } = req.query;

    const pageNum  = Math.max(1, parseInt(String(page  || "1")));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || "20"))));
    const skip     = (pageNum - 1) * limitNum;

    let catIdFilter: string | undefined;
    if (categoryId) {
      catIdFilter = String(categoryId);
    } else if (category) {
      const cat = await prisma.category.findFirst({
        where: { name: { equals: String(category), mode: "insensitive" } },
      });
      catIdFilter = cat?.id;
    }

    const where: Record<string, unknown> = {
      ...(catIdFilter && { categoryId: catIdFilter }),
      ...(articleType && { articleType: String(articleType) }),
      ...(status      && { status:      String(status) }),
      ...(priority && priority !== "All Priority" && { priority: normalisePriority(String(priority)) }),
      ...(search && {
        OR: [
          { headline: { contains: String(search), mode: "insensitive" } },
          { content:  { contains: String(search), mode: "insensitive" } },
        ],
      }),
      NOT: [{ status: "DELETED" as any, deleteAfter: null }],
    };

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: {
          author:   { select: { id: true, name: true, email: true, role: true } },
          category: { select: { id: true, name: true, color: true } },
          tags:     { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.news.count({ where }),
    ]);

    res.json({ news, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("getAllNews error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── GET BY SLUG ───────────────────────────────────────────────────────────────
export const getNewsBySlug = async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug);

    const news = await prisma.news.findUnique({
      where: { slug },
      include: {
        author:   { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true, color: true } },
        tags:     { include: { tag: true } },
      },
    });

    if (!news) return res.status(404).json({ message: "News not found" });

    prisma.news.update({ where: { slug }, data: { views: { increment: 1 } } }).catch(() => {});

    res.json(news);
  } catch (error) {
    console.error("getNewsBySlug error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── GET BY ID ─────────────────────────────────────────────────────────────────
export const getNewsById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        author:   { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true, color: true } },
        tags:     { include: { tag: true } },
      },
    });

    if (!news) return res.status(404).json({ message: "News not found" });
    res.json(news);
  } catch (error) {
    console.error("getNewsById error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── UPDATE ────────────────────────────────────────────────────────────────────
export const updateNews = async (req: AuthRequest, res: Response) => {
  try {
    const id       = String(req.params.id);
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "News not found" });

    const {
      headline, shortTitle, excerpt, content, language, location, tags, articleType,
      breakingNewsTicker, breakingPushNotif, breakingHomepageAlert,
      priority, statusType, expiryTime,
      liveUpdates,
      featuredImage, imageCaption, photoCredit,
      metaTitle, metaDescription, keywords, focusKeywords, canonicalUrl,
      status, publishAt,
      deleteMode,
      deleteIntervalDays,
    } = req.body;

    const typeEnum = articleType ? toArticleTypeEnum(articleType) : existing.articleType;

    let categoryId = existing.categoryId;
    if (req.body.categoryId || req.body.category) {
      try { categoryId = await resolveCategoryId(req.body); } catch (_) {}
    }

    let slug = existing.slug;
    if (headline && headline.trim() !== existing.headline) {
      slug = await buildUniqueSlug(headline.trim(), id);
    }

    const existingAny = existing as any;
    let publishedAt: Date | null = existing.publishedAt;
    let scheduledAt: Date | null = existingAny.scheduledAt ?? null;
    let deletedAt:   Date | null = existingAny.deletedAt   ?? null;
    let deleteAfter: Date | null = existingAny.deleteAfter ?? null;

    if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      publishedAt = new Date(); scheduledAt = null;
    } else if (status === "SCHEDULED" && publishAt) {
      scheduledAt = new Date(publishAt); publishedAt = null;
    } else if (status === "DRAFT") {
      scheduledAt = null;
    } else if (status === "DELETED") {
      deletedAt = new Date();
      if (deleteMode === "instant") {
        await prisma.news.delete({ where: { id } });
        return res.json({ success: true, message: "Article permanently deleted." });
      } else {
        const days = parseInt(String(deleteIntervalDays ?? 14));
        deleteAfter = new Date(Date.now() + days * 86_400_000);
      }
    }

    const tagConnections = Array.isArray(tags) ? await upsertTags(tags) : null;

    const updated = await prisma.news.update({
      where: { id },
      data: {
        ...(headline    !== undefined && { headline:  headline.trim() }),
        ...(shortTitle  !== undefined && { shortTitle: shortTitle?.trim() || null }),
        ...(excerpt     !== undefined && { excerpt:    excerpt?.trim()    || null }),
        ...(content     !== undefined && { content }),
        categoryId,
        ...(language    !== undefined && { language }),
        ...(location    !== undefined && { location:  location?.trim() || null }),
        ...(tagConnections !== null && {
          tags: {
            deleteMany: {},
            create: tagConnections.map(tagId => ({ tag: { connect: { id: tagId } } })),
          },
        }),
        articleType: typeEnum,
        slug,

        ...(typeEnum === "BREAKING" && {
          breakingNewsTicker:    Boolean(breakingNewsTicker),
          breakingPushNotif:     Boolean(breakingPushNotif),
          breakingHomepageAlert: Boolean(breakingHomepageAlert),
        }),
        ...(priority   !== undefined && { priority:   normalisePriority(priority) }),
        ...(statusType !== undefined && { statusType }),
        ...(expiryTime !== undefined && { expiryTime: expiryTime ? new Date(expiryTime) : null }),

        ...(typeEnum === "LIVE" && liveUpdates !== undefined && {
          liveUpdates: Array.isArray(liveUpdates) ? liveUpdates : undefined,
        }),

        ...(featuredImage !== undefined && !featuredImage?.startsWith("blob:") && {
          featuredImage: featuredImage?.trim() || null,
        }),
        ...(imageCaption  !== undefined && { imageCaption:  imageCaption?.trim()  || null }),
        ...(photoCredit   !== undefined && { photoCredit:   photoCredit?.trim()   || null }),
        ...(metaTitle       !== undefined && { metaTitle:       metaTitle?.trim()       || null }),
        ...(metaDescription !== undefined && { metaDescription: metaDescription?.trim() || null }),
        ...(keywords        !== undefined && { keywords: Array.isArray(keywords) ? keywords : [] }),
        ...(focusKeywords   !== undefined && { focusKeywords: focusKeywords?.trim() || null }),
        ...(canonicalUrl    !== undefined && { canonicalUrl:  canonicalUrl?.trim()  || null }),
        ...(status          !== undefined && { status }),
        publishedAt,
        scheduledAt,
        deletedAt,
        deleteAfter,
      },
      include: {
        author:   { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        tags:     { include: { tag: true } },
      },
    });

    res.json({ success: true, updated });
  } catch (error) {
    console.error("updateNews error:", error);
    res.status(500).json({ message: "Error updating news" });
  }
};

// ─── DELETE ────────────────────────────────────────────────────────────────────
export const deleteNews = async (req: AuthRequest, res: Response) => {
  try {
    const id       = String(req.params.id);
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "News not found" });

    const { deleteMode, deleteIntervalDays } = req.body ?? {};

    if (deleteMode === "interval") {
      const days = parseInt(String(deleteIntervalDays ?? 14));
      await prisma.news.update({
        where: { id },
        data: {
          status:      "DELETED" as any,
          deletedAt:   new Date(),
          deleteAfter: new Date(Date.now() + days * 86_400_000),
        },
      });
      return res.json({ success: true, message: `Article will be permanently deleted in ${days} days.` });
    }

    await prisma.news.delete({ where: { id } });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("deleteNews error:", error);
    res.status(500).json({ message: "Error deleting news" });
  }
};

// ─── PURGE EXPIRED DELETED ARTICLES ───────────────────────────────────────────
export const purgeDeletedNews = async (req: Request, res: Response) => {
  try {
    const result = await prisma.news.deleteMany({
      where: {
        status:      "DELETED" as any,
        deleteAfter: { lte: new Date() },
      },
    });
    res.json({ success: true, purged: result.count });
  } catch (error) {
    console.error("purgeDeletedNews error:", error);
    res.status(500).json({ message: "Error purging deleted news" });
  }
};

// ─── PAUSE / RESUME ────────────────────────────────────────────────────────────
export const togglePauseBreaking = async (req: AuthRequest, res: Response) => {
  try {
    const id       = String(req.params.id);
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing)                           return res.status(404).json({ message: "News not found" });
    if (existing.articleType !== "BREAKING") return res.status(400).json({ message: "Not a breaking news article" });

    const current   = (existing as any).statusType as string | null;
    const newStatus = current === "paused" ? "published" : "paused";

    const updated = await prisma.news.update({
      where: { id },
      data:  { statusType: newStatus } as any,
    });

    res.json({ success: true, statusType: newStatus, updated });
  } catch (error) {
    console.error("togglePauseBreaking error:", error);
    res.status(500).json({ message: "Error toggling pause state" });
  }
};

// ─── LIVE UPDATE ───────────────────────────────────────────────────────────────
export const addLiveUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const id       = String(req.params.id);
    const { text } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: "Update text is required" });

    const news = await prisma.news.findUnique({ where: { id } });
    if (!news)                       return res.status(404).json({ message: "News not found" });
    if (news.articleType !== "LIVE") return res.status(400).json({ message: "Not a live article" });

    const existing  = Array.isArray((news as any).liveUpdates) ? ((news as any).liveUpdates as object[]) : [];
    const newUpdate = {
      id:        Date.now(),
      time:      new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      text:      text.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = await prisma.news.update({
      where: { id },
      data:  { liveUpdates: [...existing, newUpdate] } as any,
    });

    res.json({ success: true, updated });
  } catch (error) {
    console.error("addLiveUpdate error:", error);
    res.status(500).json({ message: "Error adding live update" });
  }
};

// ─── GET MEDIA LIBRARY ─────────────────────────────────────────────────────────
export const getMediaLibrary = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;

    const pageNum  = Math.max(1, parseInt(String(page  || "1")));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || "50"))));
    const skip     = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      prisma.news.findMany({
        where: {
          OR: [
            { featuredImage: { not: null } },
            { content: { contains: "<img" } },
          ],
          NOT: { featuredImage: { startsWith: "blob:" } },
        },
        select: {
          id:            true,
          headline:      true,
          featuredImage: true,
          content:       true,
          imageCaption:  true,
          photoCredit:   true,
          createdAt:     true,
          status:        true,
          views:         true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.news.count({
        where: {
          OR: [
            { featuredImage: { not: null } },
            { content: { contains: "<img" } },
          ],
          NOT: { featuredImage: { startsWith: "blob:" } },
        },
      }),
    ]);

    const formatted = items.flatMap(item => {
      const contentImages = extractImagesFromContent(item.content || "");

      return [
        ...(item.featuredImage && !item.featuredImage.startsWith("blob:")
          ? [{
              newsId:    item.id,
              url:       item.featuredImage,
              headline:  item.headline,
              caption:   item.imageCaption,
              credit:    item.photoCredit,
              createdAt: item.createdAt,
              status:    item.status,
              views:     item.views,
              type:      "featured" as const,
            }]
          : []),

        ...contentImages
          .filter(url => !url.startsWith("blob:"))
          .map(url => ({
            newsId:    item.id,
            url,
            headline:  item.headline,
            caption:   null,
            credit:    null,
            createdAt: item.createdAt,
            status:    item.status,
            views:     item.views,
            type:      "content" as const,
          })),
      ];
    });

    res.json({ items: formatted, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error("getMediaLibrary error:", error);
    res.status(500).json({ message: "Error fetching media library" });
  }
};

// ─── DELETE MEDIA IMAGE ────────────────────────────────────────────────────────
// Removes featuredImage from DB and deletes the file from Supabase Storage
export const deleteMediaImage = async (req: AuthRequest, res: Response) => {
  try {
    const newsId = String(req.params.newsId);

    const article = await prisma.news.findUnique({ where: { id: newsId } });
    if (!article) return res.status(404).json({ message: "Article not found" });

    const imageUrl = article.featuredImage;

    // ── Remove from DB first ─────────────────────────────────────────────────
    await prisma.news.update({
      where: { id: newsId },
      data:  { featuredImage: null, imageCaption: null, photoCredit: null },
    });

    // ── Delete from Supabase Storage ─────────────────────────────────────────
    // Public URL pattern:
    // https://<project>.supabase.co/storage/v1/object/public/news-images/filename.jpg
    if (imageUrl) {
      try {
        const filename = imageUrl.split(`/${BUCKET}/`).pop();
        if (filename) {
          const { error } = await supabase.storage.from(BUCKET).remove([filename]);
          if (error) console.warn("Supabase storage delete warning:", error.message);
        }
      } catch (storageErr) {
        // Non-fatal — DB is already cleaned up
        console.warn("Could not delete file from Supabase Storage:", storageErr);
      }
    }

    res.json({ success: true, message: "Image removed successfully" });
  } catch (error) {
    console.error("deleteMediaImage error:", error);
    res.status(500).json({ message: "Error deleting image" });
  }
};