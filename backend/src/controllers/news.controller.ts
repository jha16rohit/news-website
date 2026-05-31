// server/src/controllers/news.controller.ts
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import News from "../models/News";
import Category from "../models/Category";
import Tag from "../models/Tag";
import User from "../models/user";
import TopicProfile from "../models/TopicProfile";
import { extractImagesFromContent } from "../utils/Extractimages";
import slugify from "slugify";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase (for deleting images from storage) ─────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const BUCKET = "news-images";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTagName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function buildUniqueSlug(
  base: string,
  excludeId?: string
): Promise<string> {
  const raw = slugify(base, { lower: true, strict: true });
  const query: any = { slug: raw };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await News.findOne(query);
  if (!existing) return raw;
  return `${raw}-${Math.random().toString(36).slice(2, 7)}`;
}

function toArticleTypeEnum(type?: string): "STANDARD" | "BREAKING" | "LIVE" {
  const map: Record<string, "STANDARD" | "BREAKING" | "LIVE"> = {
    STANDARD: "STANDARD",
    BREAKING: "BREAKING",
    LIVE: "LIVE",
    "Standard Article": "STANDARD",
    "Breaking News": "BREAKING",
    "Live Updates": "LIVE",
  };
  return map[type ?? ""] ?? "STANDARD";
}

function normalisePriority(
  raw: unknown
): "CRITICAL" | "HIGH" | "MEDIUM" | null {
  if (!raw) return null;
  const u = String(raw).toUpperCase();
  if (u === "CRITICAL") return "CRITICAL";
  if (u === "HIGH") return "HIGH";
  if (u === "MEDIUM") return "MEDIUM";
  return null;
}

async function resolveCategoryId(body: any): Promise<string> {
  if (body.categoryId?.trim()) return String(body.categoryId.trim());

  const name = String(body.category ?? "").trim();
  if (!name) throw new Error("Category is required");

  let cat = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });

  if (!cat) {
    const slug = slugify(name, { lower: true, strict: true });
    cat = await Category.create({
      name,
      slug: `${slug}-${Math.random().toString(36).slice(2, 5)}`,
    });
  }

  return String(cat._id);
}

async function upsertTags(tags: string[]): Promise<string[]> {
  const names: string[] = [];
  for (const tagName of tags) {
    const normalized = normalizeTagName(tagName);
    const tagSlug = slugify(normalized, { lower: true, strict: true });

    let tag = await Tag.findOne({ slug: tagSlug });
    if (!tag) {
      tag = await Tag.create({ name: normalized, slug: tagSlug, usageCount: 1 });
    } else {
      await Tag.findByIdAndUpdate(tag._id, { $inc: { usageCount: 1 } });
    }
    names.push(normalized);
  }
  return names;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createNews = async (req: AuthRequest, res: Response) => {
  try {
    const {
      headline,
      shortTitle,
      excerpt,
      content,
      language,
      location,
      tags,
      articleType,
      breakingNewsTicker,
      breakingPushNotif,
      breakingHomepageAlert,
      priority,
      statusType,
      expiryTime,
      liveUpdates,
      featuredImage,
      imageCaption,
      photoCredit,
      metaTitle,
      metaDescription,
      keywords,
      focusKeywords,
      canonicalUrl,
      status,
      publishAt,
      deleteMode,
      deleteIntervalDays,
    } = req.body;

    if (!headline?.trim())
      return res.status(400).json({ message: "Headline is required." });

    let categoryId: string;
    try {
      categoryId = await resolveCategoryId(req.body);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }

    const slug = await buildUniqueSlug(headline);
    const typeEnum = toArticleTypeEnum(articleType);

    // ── Status / dates ────────────────────────────────────────────────────────
    let publishedAt: Date | null = null;
    let scheduledAt: Date | null = null;
    let deletedAt: Date | null = null;
    let deleteAfter: Date | null = null;
    let resolvedStatus = status || "DRAFT";

    if (resolvedStatus === "PUBLISHED") {
      publishedAt = new Date();
    } else if (resolvedStatus === "SCHEDULED") {
      if (!publishAt)
        return res
          .status(400)
          .json({ message: "publishAt is required for scheduled articles." });
      scheduledAt = new Date(publishAt);
    } else if (resolvedStatus === "DELETED") {
      deletedAt = new Date();
      if (deleteMode === "interval") {
        const days = parseInt(String(deleteIntervalDays ?? 14));
        deleteAfter = new Date(Date.now() + days * 86_400_000);
      }
      if (deleteMode === "instant") {
        return res
          .status(200)
          .json({ success: true, message: "Article instantly deleted (not stored)." });
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
    const resolvedTags = rawTags.length ? await upsertTags(rawTags) : [];

    // ── Image URL ─────────────────────────────────────────────────────────────
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
      const firstUser = await User.findOne().select("_id");
      if (!firstUser)
        return res.status(500).json({
          message: "No users found in DB. Please create an admin user first.",
        });
      resolvedAuthorId = String(firstUser._id);
    }

    const news = await News.create({
      headline: headline.trim(),
      shortTitle: shortTitle?.trim() || null,
      excerpt: excerpt?.trim() || null,
      content: content || "",
      categoryId,
      language: language || "English",
      location: location?.trim() || null,
      tags: resolvedTags,
      articleType: typeEnum,

      breakingNewsTicker:    typeEnum === "BREAKING" ? Boolean(breakingNewsTicker) : false,
      breakingPushNotif:     typeEnum === "BREAKING" ? Boolean(breakingPushNotif) : false,
      breakingHomepageAlert: typeEnum === "BREAKING" ? Boolean(breakingHomepageAlert) : false,

      priority: normalisePriority(priority) ?? undefined,
      // FIX: default statusType to "published" only when article is PUBLISHED,
      // otherwise "paused" avoids accidentally surfacing DRAFT/SCHEDULED articles.
      statusType:
        statusType ||
        (resolvedStatus === "PUBLISHED" ? "published" : "paused"),
      expiryTime: expiryTime ? new Date(expiryTime) : undefined,

      liveUpdates:
        typeEnum === "LIVE" && Array.isArray(liveUpdates) ? liveUpdates : undefined,

      featuredImage:   imageUrl ?? undefined,
      imageCaption:    imageCaption?.trim() || undefined,
      photoCredit:     photoCredit?.trim() || undefined,

      metaTitle:        metaTitle?.trim() || undefined,
      metaDescription:  metaDescription?.trim() || undefined,
      slug,
      keywords:         resolvedKeywords,
      focusKeywords:    focusKeywords?.trim() || undefined,
      canonicalUrl:     canonicalUrl?.trim() || undefined,

      status:      resolvedStatus,
      publishedAt: publishedAt ?? undefined,
      scheduledAt: scheduledAt ?? undefined,
      deletedAt:   deletedAt ?? undefined,
      deleteAfter: deleteAfter ?? undefined,

      authorId: resolvedAuthorId,
    });

    const populated = await News.findById((news as any)._id)
      .populate("categoryId", "name color")
      .populate("authorId", "name role");

    res.status(201).json({ success: true, news: populated });
  } catch (error: any) {
    console.error("createNews error:", error);
    res.status(500).json({ message: error?.message ?? "Error creating news" });
  }
};

// ─── GET ALL (admin — no status default filter) ────────────────────────────────
export const getAllNews = async (req: Request, res: Response) => {
  try {
    const { category, categoryId, search, articleType, status, priority, page, limit } =
      req.query;

    const pageNum  = Math.max(1, parseInt(String(page  || "1")));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || "20"))));
    const skip     = (pageNum - 1) * limitNum;

    let catIdFilter: string | undefined;
    if (categoryId) {
      catIdFilter = String(categoryId);
    } else if (category) {
      const cat = await Category.findOne({
        name: { $regex: new RegExp(`^${String(category)}$`, "i") },
      });
      catIdFilter = cat ? String(cat._id) : undefined;
    }

    const filter: Record<string, any> = {};
    if (catIdFilter)  filter.categoryId  = catIdFilter;
    if (articleType)  filter.articleType = String(articleType);
    if (status)       filter.status      = String(status);

    const normPriority =
      priority && priority !== "All Priority"
        ? normalisePriority(String(priority))
        : null;
    if (normPriority) filter.priority = normPriority;

    if (search) {
      filter.$or = [
        { headline: { $regex: String(search), $options: "i" } },
        { content:  { $regex: String(search), $options: "i" } },
      ];
    }

    // FIX: exclude only truly hard-deleted docs (status=DELETED with no scheduled
    // purge date). Docs in DRAFT / SCHEDULED should still appear in admin list.
    filter.$nor = [{ status: "DELETED", deleteAfter: null }];

    const [newsDocs2, total] = await Promise.all([
      News.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      News.countDocuments(filter),
    ]);

    const cIds2 = [...new Set(newsDocs2.map((n: any) => n.categoryId).filter(Boolean))];
    const aIds2 = [...new Set(newsDocs2.map((n: any) => n.authorId).filter(Boolean))];
    const [cats2, auths2] = await Promise.all([
      Category.find({ _id: { $in: cIds2 } }).select("_id name color").lean(),
      User.find({ _id: { $in: aIds2 } }).select("_id name email role").lean(),
    ]);
    const cMap2 = Object.fromEntries((cats2 as any[]).map((c: any) => [String(c._id), c]));
    const aMap2 = Object.fromEntries((auths2 as any[]).map((a: any) => [String(a._id), a]));
    const news = newsDocs2.map((n: any) => ({
      ...n,
      id:         String(n._id),
      categoryId: cMap2[n.categoryId] ?? n.categoryId,
      authorId:   aMap2[n.authorId]   ?? n.authorId,
    }));

    res.json({ news, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("getAllNews error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── GET ALL (public/user-facing — only PUBLISHED) ────────────────────────────
// Use this handler for /api/news (public) instead of the admin one.
export const getPublishedNews = async (req: Request, res: Response) => {
  try {
    const { category, categoryId, search, articleType, page, limit } = req.query;

    const pageNum  = Math.max(1, parseInt(String(page  || "1")));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || "20"))));
    const skip     = (pageNum - 1) * limitNum;

    let catIdFilter: string | undefined;
    if (categoryId) {
      catIdFilter = String(categoryId);
    } else if (category) {
      const cat = await Category.findOne({
        name: { $regex: new RegExp(`^${String(category)}$`, "i") },
      });
      catIdFilter = cat ? String(cat._id) : undefined;
    }

    const filter: Record<string, any> = { status: "PUBLISHED" };
    if (catIdFilter)  filter.categoryId  = catIdFilter;
    if (articleType)  filter.articleType = String(articleType);

    if (search) {
      filter.$or = [
        { headline: { $regex: String(search), $options: "i" } },
        { excerpt:  { $regex: String(search), $options: "i" } },
      ];
    }

    const [newsDocs, total] = await Promise.all([
      News.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      News.countDocuments(filter),
    ]);

    // Manually enrich category + author (String fields — Mongoose populate requires ObjectId refs)
    const categoryIds = [...new Set(newsDocs.map((n: any) => n.categoryId).filter(Boolean))];
    const authorIds   = [...new Set(newsDocs.map((n: any) => n.authorId).filter(Boolean))];

    const [categories, authors] = await Promise.all([
      Category.find({ _id: { $in: categoryIds } }).select("_id name color").lean(),
      User.find({ _id: { $in: authorIds } }).select("_id name role").lean(),
    ]);

    const catMap    = Object.fromEntries((categories as any[]).map((c: any) => [String(c._id), c]));
    const authorMap = Object.fromEntries((authors as any[]).map((a: any) => [String(a._id), a]));

    const news = newsDocs.map((n: any) => ({
      ...n,
      id:         String(n._id),
      categoryId: catMap[n.categoryId]  ?? n.categoryId,
      authorId:   authorMap[n.authorId] ?? n.authorId,
    }));

    res.json({ news, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("getPublishedNews error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── GET BY SLUG ──────────────────────────────────────────────────────────────
export const getNewsBySlug = async (req: Request, res: Response) => {
  try {
    const news = await News.findOne({ slug: String(req.params.slug) })
      .populate("authorId",   "name role")
      .populate("categoryId", "name color");

    if (!news) return res.status(404).json({ message: "News not found" });

    // Increment view count asynchronously — don't await
    News.findByIdAndUpdate(news._id, { $inc: { views: 1 } }).catch(() => {});

    res.json(news);
  } catch (error) {
    console.error("getNewsBySlug error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getNewsById = async (req: Request, res: Response) => {
  try {
    const newsDoc = await News.findById(String(req.params.id)).lean();

    if (!newsDoc) return res.status(404).json({ message: "News not found" });

    const [catDoc, authorDoc] = await Promise.all([
      (newsDoc as any).categoryId ? Category.findById((newsDoc as any).categoryId).select("_id name color").lean() : null,
      (newsDoc as any).authorId   ? User.findById((newsDoc as any).authorId).select("_id name email role").lean()  : null,
    ]);

    const news = {
      ...newsDoc,
      id:         String((newsDoc as any)._id),
      categoryId: catDoc    ?? (newsDoc as any).categoryId,
      authorId:   authorDoc ?? (newsDoc as any).authorId,
    };

    res.json(news);
  } catch (error) {
    console.error("getNewsById error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateNews = async (req: AuthRequest, res: Response) => {
  try {
    const id       = String(req.params.id);
    const existing = await News.findById(id);
    if (!existing) return res.status(404).json({ message: "News not found" });

    const {
      headline, shortTitle, excerpt, content, language, location, tags,
      articleType, breakingNewsTicker, breakingPushNotif, breakingHomepageAlert,
      priority, statusType, expiryTime, liveUpdates, featuredImage, imageCaption,
      photoCredit, metaTitle, metaDescription, keywords, focusKeywords,
      canonicalUrl, status, publishAt, deleteMode, deleteIntervalDays,
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

    let publishedAt: Date | null = existing.publishedAt ?? null;
    let scheduledAt: Date | null = (existing as any).scheduledAt ?? null;
    let deletedAt:   Date | null = (existing as any).deletedAt   ?? null;
    let deleteAfter: Date | null = (existing as any).deleteAfter ?? null;

    if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      publishedAt = new Date();
      scheduledAt = null;
    } else if (status === "SCHEDULED" && publishAt) {
      scheduledAt = new Date(publishAt);
      publishedAt = null;
    } else if (status === "DRAFT") {
      scheduledAt = null;
    } else if (status === "DELETED") {
      deletedAt = new Date();
      if (deleteMode === "instant") {
        await News.findByIdAndDelete(id);
        return res.json({ success: true, message: "Article permanently deleted." });
      }
      const days = parseInt(String(deleteIntervalDays ?? 14));
      deleteAfter = new Date(Date.now() + days * 86_400_000);
    }

    const resolvedTags = Array.isArray(tags) ? await upsertTags(tags) : null;

    const updateData: Record<string, any> = {
      categoryId, articleType: typeEnum, slug,
      publishedAt, scheduledAt, deletedAt, deleteAfter,
    };

    if (headline     !== undefined) updateData.headline    = headline.trim();
    if (shortTitle   !== undefined) updateData.shortTitle  = shortTitle?.trim()  || null;
    if (excerpt      !== undefined) updateData.excerpt     = excerpt?.trim()      || null;
    if (content      !== undefined) updateData.content     = content;
    if (language     !== undefined) updateData.language    = language;
    if (location     !== undefined) updateData.location    = location?.trim()     || null;
    if (resolvedTags !== null)      updateData.tags        = resolvedTags;

    if (typeEnum === "BREAKING") {
      updateData.breakingNewsTicker    = Boolean(breakingNewsTicker);
      updateData.breakingPushNotif     = Boolean(breakingPushNotif);
      updateData.breakingHomepageAlert = Boolean(breakingHomepageAlert);
    }

    if (priority     !== undefined) updateData.priority    = normalisePriority(priority);
    if (statusType   !== undefined) updateData.statusType  = statusType;
    if (expiryTime   !== undefined) updateData.expiryTime  = expiryTime ? new Date(expiryTime) : null;

    if (typeEnum === "LIVE" && liveUpdates !== undefined) {
      updateData.liveUpdates = Array.isArray(liveUpdates) ? liveUpdates : undefined;
    }

    if (featuredImage !== undefined && !featuredImage?.startsWith("blob:")) {
      updateData.featuredImage = featuredImage?.trim() || null;
    }
    if (imageCaption    !== undefined) updateData.imageCaption    = imageCaption?.trim()    || null;
    if (photoCredit     !== undefined) updateData.photoCredit     = photoCredit?.trim()     || null;
    if (metaTitle       !== undefined) updateData.metaTitle       = metaTitle?.trim()       || null;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription?.trim() || null;
    if (keywords        !== undefined) updateData.keywords        = Array.isArray(keywords) ? keywords : [];
    if (focusKeywords   !== undefined) updateData.focusKeywords   = focusKeywords?.trim()   || null;
    if (canonicalUrl    !== undefined) updateData.canonicalUrl    = canonicalUrl?.trim()    || null;
    if (status          !== undefined) updateData.status          = status;

    const updated = await News.findByIdAndUpdate(id, updateData, { new: true })
      .populate("authorId",   "name")
      .populate("categoryId", "name color");

    res.json({ success: true, updated });
  } catch (error) {
    console.error("updateNews error:", error);
    res.status(500).json({ message: "Error updating news" });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteNews = async (req: AuthRequest, res: Response) => {
  try {
    const id       = String(req.params.id);
    const existing = await News.findById(id);
    if (!existing) return res.status(404).json({ message: "News not found" });

    const { deleteMode, deleteIntervalDays } = req.body ?? {};

    if (deleteMode === "interval") {
      const days = parseInt(String(deleteIntervalDays ?? 14));
      await News.findByIdAndUpdate(id, {
        status:      "DELETED",
        deletedAt:   new Date(),
        deleteAfter: new Date(Date.now() + days * 86_400_000),
      });
      return res.json({
        success: true,
        message: `Article will be permanently deleted in ${days} days.`,
      });
    }

    await News.findByIdAndDelete(id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("deleteNews error:", error);
    res.status(500).json({ message: "Error deleting news" });
  }
};

// ─── PURGE EXPIRED DELETED ARTICLES ──────────────────────────────────────────
export const purgeDeletedNews = async (_req: Request, res: Response) => {
  try {
    const result = await News.deleteMany({
      status:      "DELETED",
      deleteAfter: { $lte: new Date() },
    });
    res.json({ success: true, purged: result.deletedCount });
  } catch (error) {
    console.error("purgeDeletedNews error:", error);
    res.status(500).json({ message: "Error purging deleted news" });
  }
};

// ─── PAUSE / RESUME BREAKING ─────────────────────────────────────────────────
export const togglePauseBreaking = async (req: AuthRequest, res: Response) => {
  try {
    const id       = String(req.params.id);
    const existing = await News.findById(id);
    if (!existing) return res.status(404).json({ message: "News not found" });
    if (existing.articleType !== "BREAKING")
      return res.status(400).json({ message: "Not a breaking news article" });

    const current   = (existing as any).statusType as string | null;
    const newStatus = current === "paused" ? "published" : "paused";

    const updated = await News.findByIdAndUpdate(
      id,
      { statusType: newStatus },
      { new: true }
    );

    res.json({ success: true, statusType: newStatus, updated });
  } catch (error) {
    console.error("togglePauseBreaking error:", error);
    res.status(500).json({ message: "Error toggling pause state" });
  }
};

// ─── ADD LIVE UPDATE ──────────────────────────────────────────────────────────
export const addLiveUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const id   = String(req.params.id);
    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "News not found" });
    if (news.articleType !== "LIVE")
      return res.status(400).json({ message: "Not a live article" });

    const {
      text, title, imageUrl, imageCaption, imageCredit, tweetUrl,
      poll, sourceUrl, sourceLabel, tags, isHighlight, isBreaking,
    } = req.body;

    const hasContent =
      text?.trim() || title?.trim() || imageUrl?.trim() ||
      tweetUrl?.trim() || sourceUrl?.trim() ||
      (poll && poll.question?.trim()) ||
      (Array.isArray(tags) && tags.length > 0);

    if (!hasContent) {
      return res.status(400).json({
        message:
          "Update must have at least one field (text, title, image, tweet, poll, source, or tags).",
      });
    }

    const now = new Date();
    const newUpdate: Record<string, unknown> = {
      id:        Date.now(),
      time:      now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      timestamp: now.toISOString(),
      ...(text?.trim()                              && { text:         text.trim() }),
      ...(title?.trim()                             && { title:        title.trim() }),
      ...(imageUrl?.trim() && !imageUrl.startsWith("blob:") && { imageUrl: imageUrl.trim() }),
      ...(imageCaption?.trim()                      && { imageCaption: imageCaption.trim() }),
      ...(imageCredit?.trim()                       && { imageCredit:  imageCredit.trim() }),
      ...(tweetUrl?.trim()                          && { tweetUrl:     tweetUrl.trim() }),
      ...(sourceUrl?.trim()                         && { sourceUrl:    sourceUrl.trim() }),
      ...(sourceLabel?.trim()                       && { sourceLabel:  sourceLabel.trim() }),
      ...(Array.isArray(tags) && tags.length > 0   && { tags }),
      ...(isHighlight !== undefined                 && { isHighlight:  Boolean(isHighlight) }),
      ...(isBreaking  !== undefined                 && { isBreaking:   Boolean(isBreaking) }),
      ...(poll &&
        typeof poll.question === "string" &&
        poll.question.trim() &&
        Array.isArray(poll.options) &&
        poll.options.length >= 2 && {
          poll: {
            question: poll.question.trim(),
            options:  poll.options
              .filter((o: any) => o && (o.label || o).toString().trim())
              .map((o: any) => ({
                label: typeof o === "string" ? o : o.label,
                votes: typeof o === "object" ? (o.votes ?? 0) : 0,
              })),
          },
        }),
    };

    const existing = Array.isArray((news as any).liveUpdates)
      ? ((news as any).liveUpdates as object[])
      : [];

    const updated = await News.findByIdAndUpdate(
      id,
      { liveUpdates: [newUpdate, ...existing] },
      { new: true }
    );

    res.json({ success: true, update: newUpdate, news: updated });
  } catch (error) {
    console.error("addLiveUpdate error:", error);
    res.status(500).json({ message: "Error adding live update" });
  }
};

// ─── GET MEDIA LIBRARY ────────────────────────────────────────────────────────
export const getMediaLibrary = async (req: Request, res: Response) => {
  try {
    const pageNum  = Math.max(1, parseInt(String(req.query.page  || "1")));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "50"))));
    const skip     = (pageNum - 1) * limitNum;

    const filter = {
      $or: [
        { featuredImage: { $exists: true, $ne: null } },
        { content: { $regex: "<img" } },
      ],
      featuredImage: { $not: /^blob:/ },
    };

    const [items, total] = await Promise.all([
      News.find(filter)
        .select("_id headline featuredImage content imageCaption photoCredit createdAt status views")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      News.countDocuments(filter),
    ]);

    const formatted = items.flatMap((item) => {
      const contentImages = extractImagesFromContent(item.content || "");
      return [
        ...(item.featuredImage && !item.featuredImage.startsWith("blob:")
          ? [{
              newsId:    String(item._id),
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
          .filter((url) => !url.startsWith("blob:"))
          .map((url) => ({
            newsId:    String(item._id),
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

// ─── DELETE MEDIA IMAGE ───────────────────────────────────────────────────────
export const deleteMediaImage = async (req: AuthRequest, res: Response) => {
  try {
    const newsId  = String(req.params.newsId);
    const article = await News.findById(newsId);
    if (!article) return res.status(404).json({ message: "Article not found" });

    const imageUrl = article.featuredImage;

    await News.findByIdAndUpdate(newsId, {
      featuredImage: null,
      imageCaption:  null,
      photoCredit:   null,
    });

    if (imageUrl) {
      try {
        const filename = imageUrl.split(`/${BUCKET}/`).pop();
        if (filename) {
          const { error } = await supabase.storage.from(BUCKET).remove([filename]);
          if (error) console.warn("Supabase storage delete warning:", error.message);
        }
      } catch (storageErr) {
        console.warn("Could not delete file from Supabase Storage:", storageErr);
      }
    }

    res.json({ success: true, message: "Image removed successfully" });
  } catch (error) {
    console.error("deleteMediaImage error:", error);
    res.status(500).json({ message: "Error deleting image" });
  }
};
// ─── GET TAGS IN USE (tags that appear in published articles) ─────────────────
export const getTagsInPublishedNews = async (req: Request, res: Response) => {
  try {
    // Collect all distinct tag name strings from published articles
    const tagNames: string[] = await News.distinct("tags", { status: "PUBLISHED" });

    if (!tagNames.length) {
      return res.json([]);
    }

    // Return matching Tag documents (so frontend gets id, name, slug, isTrending, etc.)
    const tags = await Tag.find({
      name: { $in: tagNames.map((n: string) => new RegExp(`^${n}$`, "i")) },
    }).sort({ usageCount: -1 });

    // Map to ensure id field is present
    const result = tags.map((t: any) => ({
      ...t.toObject(),
      id: String(t._id),
    }));

    res.json(result);
  } catch (error) {
    console.error("getTagsInPublishedNews error:", error);
    res.status(500).json({ message: "Error fetching tags in use" });
  }
};

export const getRecentNews = async (
  req: Request,
  res: Response
) => {
  try {

    const news = await News.find({
      status: "PUBLISHED",
    })
      .sort({
        createdAt: -1,
      })
      .limit(10);

    const formattedNews =
      await Promise.all(
        news.map(async (item) => {

          const category =
            await Category.findById(
              item.categoryId
            );

          return {
            ...item.toObject(),

            categoryName:
              category?.name || "News",
          };
        })
      );

    res.json({
      success: true,
      news: formattedNews,
    });

  } catch (error) {

    console.error(
      "getRecentNews error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Error fetching recent news",
    });
  }
};

export const getBreakingTickerNews = async (
  req: Request,
  res: Response
) => {
  try {

    const news = await News.find({
      status: "PUBLISHED",

      shortTitle: {
        $exists: true,
        $ne: "",
      },
    })
      .sort({
        createdAt: -1,
      })
      .limit(15)
      .select("shortTitle headline");

    const headlines = news.map(
      (item: any) =>
        item.shortTitle?.trim()
          ? item.shortTitle
          : item.headline
    );

    res.json({
      success: true,
      headlines,
    });

  } catch (error) {

    console.error(
      "getBreakingTickerNews error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Error fetching ticker news",
    });
  }
};

export const getNewsByTag = async (
  req: Request,
  res: Response
) => {
  try {
    const { slug } = req.params;

    const tag = await Tag.findOne({
      slug,
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    const news = await News.find({
      status: "PUBLISHED",
      tags: tag.name,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      news,
    });

  } catch (error) {

    console.error(
      "getNewsByTag error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Error fetching tag news",
    });
  }
};


export const getTrendingNews = async (
  req: Request,
  res: Response
) => {
  try {
    // Get all trending tags
    const trendingTags = await Tag.find({
      isTrending: true,
    });

    const tagNames = trendingTags.map(
      (tag) => tag.name
    );

    // Get all news matching trending tags
    const news = await News.find({
      status: "PUBLISHED",
      tags: {
        $in: tagNames,
      },
    }).sort({
      createdAt: -1,
    });

    // Random shuffle
    const shuffled = [...news].sort(
      () => Math.random() - 0.5
    );

    // Get category names
    const newsWithCategory =
      await Promise.all(
        shuffled.map(async (article) => {
          const category =
            await Category.findById(
              article.categoryId
            );

          return {
            ...article.toObject(),
            category:
              category?.name ||
              "News",
          };
        })
      );

    res.json({
      success: true,
      news: newsWithCategory,
    });

  } catch (error) {
    console.error(
      "getTrendingNews error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch trending news",
    });
  }
};

export const getNewsByTopicSlug = async (
  req: Request,
  res: Response
) => {
  try {

    const { slug } = req.params;

    const topic =
      await TopicProfile.findOne({
        slug,
      });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    const news = await News.find({
      status: "PUBLISHED",
      tags: topic.name,
    })
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      topic: topic.name,
      total: news.length,
      news,
    });

  } catch (error) {

    console.error(
      "getNewsByTopicSlug error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch topic news",
    });
  }
};