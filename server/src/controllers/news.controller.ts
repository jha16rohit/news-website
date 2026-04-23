import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";
import slugify from "slugify";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Build a unique slug — appends a short cuid suffix if slug is taken */
async function buildUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const raw = slugify(base, { lower: true, strict: true });
  const existing = await prisma.news.findFirst({
    where: { slug: raw, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (!existing) return raw;
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${raw}-${suffix}`;
}

/** Map UI string to Prisma enum */
function toArticleTypeEnum(type?: string) {
  const map: Record<string, "STANDARD" | "BREAKING" | "LIVE" | "VIDEO"> = {
    STANDARD: "STANDARD",
    BREAKING: "BREAKING",
    LIVE:     "LIVE",
    VIDEO:    "VIDEO",
    "Standard Article": "STANDARD",
    "Breaking News":    "BREAKING",
    "Live Updates":     "LIVE",
    "Video Story":      "VIDEO",
  };
  return map[type ?? ""] ?? "STANDARD";
}

/**
 * Parse videoDuration to an integer (seconds).
 * Accepts:
 *   - number  → used as-is
 *   - "845"   → 845
 *   - "14:05" → 14*60 + 5 = 845
 *   - "1:14:05" → 1*3600 + 14*60 + 5 = 4445
 *   - anything else / falsy → null
 */
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

// ─── CREATE NEWS ───────────────────────────────────────────────────────────────
export const createNews = async (req: AuthRequest, res: Response) => {
  try {
    const {
      headline,
      shortTitle,
      content,
      category,
      language,
      location,
      tags,
      articleType,
      // Breaking extras
      breakingNewsTicker,
      breakingPushNotif,
      breakingHomepageAlert,
      // Live extras
      liveUpdates,
      // Video extras
      videoUrl,
      videoDuration,
      videoQuality,
      // Media
      featuredImage,
      imageCaption,
      photoCredit,
      // SEO
      metaTitle,
      metaDescription,
      keywords,
      focusKeywords,
      canonicalUrl,
      // Publishing
      status,
      publishAt,
    } = req.body;

    if (!headline?.trim()) {
      return res.status(400).json({ message: "Headline is required." });
    }
    if (!category?.trim()) {
      return res.status(400).json({ message: "Category is required." });
    }

    const slug = await buildUniqueSlug(headline);
    const typeEnum = toArticleTypeEnum(articleType);

    let publishedAt: Date | null = null;
    let scheduledAt: Date | null = null;
    if (status === "PUBLISHED") {
      publishedAt = new Date();
    } else if (status === "SCHEDULED" && publishAt) {
      scheduledAt = new Date(publishAt);
    }

    const news = await prisma.news.create({
      data: {
        headline: headline.trim(),
        shortTitle: shortTitle?.trim() || null,
        content: content || "",
        category: category.trim(),
        language: language || "English",
        location: location?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        articleType: typeEnum,

        // Breaking
        breakingNewsTicker:    typeEnum === "BREAKING" ? Boolean(breakingNewsTicker)    : false,
        breakingPushNotif:     typeEnum === "BREAKING" ? Boolean(breakingPushNotif)     : false,
        breakingHomepageAlert: typeEnum === "BREAKING" ? Boolean(breakingHomepageAlert) : false,

        // Live
        liveUpdates: typeEnum === "LIVE" && Array.isArray(liveUpdates) ? liveUpdates : undefined,

        // Video
        videoUrl:      typeEnum === "VIDEO" ? (videoUrl?.trim() || null) : null,
        videoDuration: typeEnum === "VIDEO" ? parseVideoDuration(videoDuration) : null,
        videoQuality:  typeEnum === "VIDEO" ? (videoQuality || null) : null,

        // Media
        featuredImage: featuredImage?.trim() || null,
        imageCaption:  imageCaption?.trim() || null,
        photoCredit:   photoCredit?.trim() || null,

        // SEO
        metaTitle:       metaTitle?.trim() || null,
        metaDescription: metaDescription?.trim() || null,
        slug,
        keywords:      Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []),
        focusKeywords: focusKeywords?.trim() || null,
        canonicalUrl:  canonicalUrl?.trim() || null,

        // Publishing
        status:      status || "DRAFT",
        publishedAt,
        scheduledAt,

        authorId: req.user?.id || "b1ac800b-525b-4bb3-9f71-64997eeb578f",
      },
    });

    res.status(201).json({ success: true, news });
  } catch (error) {
    console.error("createNews error:", error);
    res.status(500).json({ message: "Error creating news" });
  }
};

// ─── GET ALL NEWS ──────────────────────────────────────────────────────────────
export const getAllNews = async (req: Request, res: Response) => {
  try {
    const { category, search, articleType, status, page, limit } = req.query;

    const pageNum  = Math.max(1, parseInt(String(page || "1")));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || "20"))));
    const skip     = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {
      ...(category    && { category:    String(category) }),
      ...(articleType && { articleType: String(articleType) }),
      ...(status      && { status:      String(status) }),
      ...(search && {
        OR: [
          { headline:  { contains: String(search), mode: "insensitive" } },
          { content:   { contains: String(search), mode: "insensitive" } },
          { tags:      { has: String(search) } },
        ],
      }),
    };

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
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

// ─── GET SINGLE NEWS BY SLUG ───────────────────────────────────────────────────
export const getNewsBySlug = async (req: Request, res: Response) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;

    const news = await prisma.news.findUnique({
      where: { slug },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    if (!news) return res.status(404).json({ message: "News not found" });

    prisma.news.update({ where: { slug }, data: { views: { increment: 1 } } }).catch(() => {});

    res.json(news);
  } catch (error) {
    console.error("getNewsBySlug error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── GET SINGLE NEWS BY ID ─────────────────────────────────────────────────────
export const getNewsById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const news = await prisma.news.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    if (!news) return res.status(404).json({ message: "News not found" });
    res.json(news);
  } catch (error) {
    console.error("getNewsById error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── UPDATE NEWS ───────────────────────────────────────────────────────────────
export const updateNews = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "News not found" });

    const {
      headline, shortTitle, content, category, language, location, tags,
      articleType,
      breakingNewsTicker, breakingPushNotif, breakingHomepageAlert,
      liveUpdates,
      videoUrl, videoDuration, videoQuality,
      featuredImage, imageCaption, photoCredit,
      metaTitle, metaDescription, keywords, focusKeywords, canonicalUrl,
      status, publishAt,
    } = req.body;

    const typeEnum = articleType ? toArticleTypeEnum(articleType) : existing.articleType;

    let slug = existing.slug;
    if (headline && headline.trim() !== existing.headline) {
      slug = await buildUniqueSlug(headline.trim(), id);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingAny = existing as any;
    let publishedAt: Date | null = existing.publishedAt;
    let scheduledAt: Date | null = existingAny.scheduledAt ?? null;
    if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      publishedAt = new Date();
      scheduledAt = null;
    } else if (status === "SCHEDULED" && publishAt) {
      scheduledAt = new Date(publishAt);
      publishedAt = null;
    } else if (status === "DRAFT") {
      scheduledAt = null;
    }

    const updated = await prisma.news.update({
      where: { id },
      data: {
        ...(headline    !== undefined && { headline: headline.trim() }),
        ...(shortTitle  !== undefined && { shortTitle: shortTitle?.trim() || null }),
        ...(content     !== undefined && { content }),
        ...(category    !== undefined && { category: category.trim() }),
        ...(language    !== undefined && { language }),
        ...(location    !== undefined && { location: location?.trim() || null }),
        ...(tags        !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
        articleType: typeEnum,
        slug,

        // Breaking
        ...(typeEnum === "BREAKING" && {
          breakingNewsTicker:    Boolean(breakingNewsTicker),
          breakingPushNotif:     Boolean(breakingPushNotif),
          breakingHomepageAlert: Boolean(breakingHomepageAlert),
        }),

        // Live
        ...(typeEnum === "LIVE" && liveUpdates !== undefined && {
          liveUpdates: Array.isArray(liveUpdates) ? liveUpdates : undefined,
        }),

        // Video — parse duration to Int
        ...(typeEnum === "VIDEO" && {
          videoUrl:      videoUrl?.trim() || null,
          videoDuration: parseVideoDuration(videoDuration),
          videoQuality:  videoQuality || null,
        }),

        // Media
        ...(featuredImage !== undefined && { featuredImage: featuredImage?.trim() || null }),
        ...(imageCaption  !== undefined && { imageCaption:  imageCaption?.trim()  || null }),
        ...(photoCredit   !== undefined && { photoCredit:   photoCredit?.trim()   || null }),

        // SEO
        ...(metaTitle       !== undefined && { metaTitle:       metaTitle?.trim()       || null }),
        ...(metaDescription !== undefined && { metaDescription: metaDescription?.trim() || null }),
        ...(keywords        !== undefined && { keywords: Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []) }),
        ...(focusKeywords   !== undefined && { focusKeywords: focusKeywords?.trim() || null }),
        ...(canonicalUrl    !== undefined && { canonicalUrl:  canonicalUrl?.trim()  || null }),

        // Publishing
        ...(status !== undefined && { status }),
        publishedAt,
        scheduledAt,
      },
    });

    res.json({ success: true, updated });
  } catch (error) {
    console.error("updateNews error:", error);
    res.status(500).json({ message: "Error updating news" });
  }
};

// ─── DELETE NEWS ───────────────────────────────────────────────────────────────
export const deleteNews = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "News not found" });

    await prisma.news.delete({ where: { id } });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("deleteNews error:", error);
    res.status(500).json({ message: "Error deleting news" });
  }
};

// ─── ADD LIVE UPDATE (append to existing live article) ─────────────────────────
export const addLiveUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const id   = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { text } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: "Update text is required" });

    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) return res.status(404).json({ message: "News not found" });
    if (news.articleType !== "LIVE") return res.status(400).json({ message: "Not a live article" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newsAny = news as any;
    const existing = Array.isArray(newsAny.liveUpdates) ? newsAny.liveUpdates as object[] : [];
    const newUpdate = {
      id:        Date.now(),
      time:      new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      text:      text.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = await prisma.news.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data:  { liveUpdates: [...existing, newUpdate] } as any,
    });

    res.json({ success: true, updated });
  } catch (error) {
    console.error("addLiveUpdate error:", error);
    res.status(500).json({ message: "Error adding live update" });
  }
};