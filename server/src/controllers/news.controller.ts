import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";
import slugify from "slugify";

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

function toArticleTypeEnum(type?: string) {
  const map: Record<string, "STANDARD" | "BREAKING" | "LIVE" | "VIDEO"> = {
    STANDARD: "STANDARD", BREAKING: "BREAKING", LIVE: "LIVE", VIDEO: "VIDEO",
    "Standard Article": "STANDARD", "Breaking News": "BREAKING",
    "Live Updates": "LIVE", "Video Story": "VIDEO",
  };
  return map[type ?? ""] ?? "STANDARD";
}

function normalisePriority(raw: unknown): string | null {
  if (!raw) return null;
  const u = String(raw).toUpperCase();
  return ["CRITICAL", "HIGH", "MEDIUM"].includes(u) ? u : null;
}

function parseVideoDuration(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.round(raw) : null;
  const str = String(raw).trim();
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  const parts = str.split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

/**
 * Resolve categoryId from the request body.
 * Accepts either:
 *  - `categoryId`  — UUID sent directly from the new CreateNewArticle UI
 *  - `category`    — legacy plain-string name (looks up by name, creates if missing)
 */
async function resolveCategoryId(body: any): Promise<string> {
  // Prefer explicit UUID
  if (body.categoryId?.trim()) return String(body.categoryId.trim());

  // Fallback: look up by name
  const name = String(body.category ?? "").trim();
  if (!name) throw new Error("Category is required");

  let cat = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  if (!cat) {
    // Auto-create so old clients don't break
    const slug = slugify(name, { lower: true, strict: true });
    cat = await prisma.category.create({
      data: { name, slug: `${slug}-${Math.random().toString(36).slice(2, 5)}` },
    });
  }

  return cat.id;
}

// ─── CREATE ────────────────────────────────────────────────────────────────────
export const createNews = async (req: AuthRequest, res: Response) => {
  try {
    const {
      headline, shortTitle, content, language, location, tags, articleType,
      breakingNewsTicker, breakingPushNotif, breakingHomepageAlert,
      priority, statusType, expiryTime,
      liveUpdates, videoUrl, videoDuration, videoQuality,
      featuredImage, imageCaption, photoCredit,
      metaTitle, metaDescription, keywords, focusKeywords, canonicalUrl,
      status, publishAt,
    } = req.body;

    if (!headline?.trim()) return res.status(400).json({ message: "Headline is required." });

    let categoryId: string;
    try { categoryId = await resolveCategoryId(req.body); }
    catch (e: any) { return res.status(400).json({ message: e.message }); }

    const slug     = await buildUniqueSlug(headline);
    const typeEnum = toArticleTypeEnum(articleType);

    let publishedAt: Date | null = null;
    let scheduledAt: Date | null = null;
    if (status === "PUBLISHED")               publishedAt = new Date();
    else if (status === "SCHEDULED" && publishAt) scheduledAt = new Date(publishAt);
let tagConnections: string[] = [];

if (Array.isArray(tags)) {
  for (let tagName of tags) {

    const normalized = tagName
      .trim()
      .toLowerCase()
      .split(" ")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const slug = slugify(normalized, { lower: true, strict: true });

    let tag = await prisma.tag.findFirst({
      where: { slug }
    });

    if (!tag) {
  tag = await prisma.tag.create({
    data: { 
      name: normalized, 
      slug,
      usageCount: 1   // 🔥 NEW TAG
    }
  });
} else {
  await prisma.tag.update({
    where: { id: tag.id },
    data: {
      usageCount: { increment: 1 } // 🔥 EXISTING TAG
    }
  });
}

    tagConnections.push(tag.id);
  }
}
    const news = await prisma.news.create({
      data: {
        headline:  headline.trim(),
        shortTitle: shortTitle?.trim() || null,
        content:   content || "",
        categoryId,
        language:  language || "English",
        location:  location?.trim() || null,
tags: {
  create: tagConnections.map(tagId => ({
    tag: {
      connect: { id: tagId }
    }
  }))
},        articleType: typeEnum,

        breakingNewsTicker:    typeEnum === "BREAKING" ? Boolean(breakingNewsTicker)    : false,
        breakingPushNotif:     typeEnum === "BREAKING" ? Boolean(breakingPushNotif)     : false,
        breakingHomepageAlert: typeEnum === "BREAKING" ? Boolean(breakingHomepageAlert) : false,      

        liveUpdates: typeEnum === "LIVE" && Array.isArray(liveUpdates) ? liveUpdates : undefined,

        videoUrl:      typeEnum === "VIDEO" ? (videoUrl?.trim() || null) : null,
        videoDuration: typeEnum === "VIDEO" ? parseVideoDuration(videoDuration) : null,
        videoQuality:  typeEnum === "VIDEO" ? (videoQuality || null) : null,

        featuredImage: featuredImage?.trim() || null,
        imageCaption:  imageCaption?.trim()  || null,
        photoCredit:   photoCredit?.trim()   || null,

        metaTitle:       metaTitle?.trim()       || null,
        metaDescription: metaDescription?.trim() || null,
        slug,
        keywords:      Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []),
        focusKeywords: focusKeywords?.trim() || null,
        canonicalUrl:  canonicalUrl?.trim()  || null,

        status:      status || "DRAFT",
        publishedAt,
        scheduledAt,

        authorId: req.user?.id || "8b4536fe-d2c4-4383-b025-a8c2c5b3ad6f",
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    });

    res.status(201).json({ success: true, news });
  } catch (error) {
    console.error("createNews error:", error);
    res.status(500).json({ message: "Error creating news" });
  }
};

// ─── GET ALL ───────────────────────────────────────────────────────────────────
export const getAllNews = async (req: Request, res: Response) => {
  try {
    const { category, categoryId, search, articleType, status, priority, page, limit } = req.query;

    const pageNum  = Math.max(1, parseInt(String(page  || "1")));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || "20"))));
    const skip     = (pageNum - 1) * limitNum;

    // Support filtering by categoryId (UUID) OR category name
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
          { tags:     { has: String(search) } },
        ],
      }),
    };

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: {
          author:   { select: { id: true, name: true, email: true, role: true } },
          category: { select: { id: true, name: true, color: true } },
          tags: {
    include: {
      tag: true
    }
  },
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
        tags: {
    include: {
      tag: true
    }
  },
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
        tags: {
    include: {
      tag: true
    }
  },
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
      headline, shortTitle, content, language, location, tags, articleType,
      breakingNewsTicker, breakingPushNotif, breakingHomepageAlert,
      priority, statusType, expiryTime,
      liveUpdates, videoUrl, videoDuration, videoQuality,
      featuredImage, imageCaption, photoCredit,
      metaTitle, metaDescription, keywords, focusKeywords, canonicalUrl,
      status, publishAt,
    } = req.body;

    const typeEnum = articleType ? toArticleTypeEnum(articleType) : existing.articleType;

    // Resolve new categoryId if provided
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

    if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      publishedAt = new Date(); scheduledAt = null;
    } else if (status === "SCHEDULED" && publishAt) {
      scheduledAt = new Date(publishAt); publishedAt = null;
    } else if (status === "DRAFT") {
      scheduledAt = null;
    }
let tagConnections: string[] = [];
if (Array.isArray(tags)) {
  for (let tagName of tags) {

    const normalized = tagName
      .trim()
      .toLowerCase()
      .split(" ")
.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const slug = slugify(normalized, { lower: true, strict: true });

    let tag = await prisma.tag.findFirst({
      where: { slug }
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: normalized, slug }
      });
    }

    tagConnections.push(tag.id);
  }
}
    const updated = await prisma.news.update({
      where: { id },
      data: {
        ...(headline    !== undefined && { headline:  headline.trim() }),
        ...(shortTitle  !== undefined && { shortTitle: shortTitle?.trim() || null }),
        ...(content     !== undefined && { content }),
        categoryId,
        ...(language    !== undefined && { language }),
        ...(location    !== undefined && { location:  location?.trim() || null }),
  ...(tags !== undefined && {
  tags: {
    deleteMany: {}, // remove old tags
    create: tagConnections.map(tagId => ({
      tag: {
        connect: { id: tagId }
      }
    }))
  }
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
        ...(typeEnum === "VIDEO" && {
          videoUrl:      videoUrl?.trim() || null,
          videoDuration: parseVideoDuration(videoDuration),
          videoQuality:  videoQuality || null,
        }),

        ...(featuredImage !== undefined && { featuredImage: featuredImage?.trim() || null }),
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
      },
      include: {
        author:   { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        tags: {
    include: {
      tag: true
    }
  },
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

    await prisma.news.delete({ where: { id } });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("deleteNews error:", error);
    res.status(500).json({ message: "Error deleting news" });
  }
};

// ─── PAUSE / RESUME ────────────────────────────────────────────────────────────
export const togglePauseBreaking = async (req: AuthRequest, res: Response) => {
  try {
    const id       = String(req.params.id);
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing)                           return res.status(404).json({ message: "News not found" });
    if (existing.articleType !== "BREAKING") return res.status(400).json({ message: "Not a breaking news article" });

    const current    = (existing as any).statusType as string | null;
    const newStatus  = current === "paused" ? "published" : "paused";

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