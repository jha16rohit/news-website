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
import { randomUUID } from "crypto";
import cloudinary from "../config/cloudinary";
import { notifySubscribersOfNewArticle } from "./newsletter.controller";
import { notifyUsersOfNewArticle } from "./userNotification.controller";


// ─── Helpers ──────────────────────────────────────────────────────────────────

function canModifyNews(req: AuthRequest, article: any): boolean {
  if (req.user?.role === "ADMIN") {
    return true;
  }

  return String(article.authorId) === String(req.user?.id);
}

function normalizeTagName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Devanagari (Hindi) → Latin transliteration ────────────────────────────
// `slugify(..., { strict: true })` drops every non a-z/0-9 character, so a
// Hindi headline had nothing left to build a slug from and always fell back
// to a random "samachar-xxxxx" string with no relation to the article.
// Transliterating Devanagari to Latin first means slugify has real words to
// work with, e.g. "भारत और उज्बेकिस्तान" -> "bharat-aur-ujbekistan".
const DEVANAGARI_VOWELS: Record<string, string> = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo",
  "ऋ": "ri", "ॠ": "ri", "ऌ": "lu", "ॡ": "lu",
  "ऍ": "e", "ऎ": "e", "ए": "e", "ऐ": "ai",
  "ऑ": "o", "ऒ": "o", "ओ": "o", "औ": "au",
  "ॲ": "a",
};

const DEVANAGARI_MATRAS: Record<string, string> = {
  "\u093E": "a", "\u093F": "i", "\u0940": "ee", "\u0941": "u", "\u0942": "oo",
  "\u0943": "ri", "\u0944": "ri", "\u0945": "e", "\u0946": "e", "\u0947": "e",
  "\u0948": "ai", "\u0949": "o", "\u094A": "o", "\u094B": "o", "\u094C": "au",
  "\u0962": "l", "\u0963": "l",
};

const DEVANAGARI_CONSONANTS: Record<string, string> = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "v",
  "श": "sh", "ष": "sh", "स": "s", "ह": "h", "ळ": "l",
  "क़": "q", "ख़": "kh", "ग़": "gh", "ज़": "z", "ड़": "r", "ढ़": "rh", "फ़": "f", "य़": "y",
};

const DEVANAGARI_DIGITS: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

function devanagariToRoman(input: string): string {
  const chars = Array.from(input);
  let out = "";

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];

    if (DEVANAGARI_VOWELS[c]) { out += DEVANAGARI_VOWELS[c]; continue; }
    if (DEVANAGARI_DIGITS[c]) { out += DEVANAGARI_DIGITS[c]; continue; }

    if (c === "\u0902" || c === "\u0901") { out += "n"; continue; }
    if (c === "\u0903") { out += "h"; continue; }
    if (c === "\u093D") { continue; }
    if (c === "\u0950") { out += "om"; continue; }
    if (c === "\u094D") { continue; }

    if (DEVANAGARI_CONSONANTS[c]) {
      out += DEVANAGARI_CONSONANTS[c];
      if (next === "\u094D") { i++; }
      else if (next === "\u093C") { i++; out += "a"; }
      else if (next && DEVANAGARI_MATRAS[next]) { out += DEVANAGARI_MATRAS[next]; i++; }
      else { out += "a"; }
      continue;
    }

    if (c === "।" || c === "॥") continue;
    if (/[a-zA-Z0-9\s-]/.test(c)) { out += c; continue; }
  }

  return out;
}

// Transliterates Devanagari (if present) before handing off to `slugify`,
// so Hindi text produces a readable slug instead of an empty string.
function slugifyAny(text: string): string {
  const source = (text || "").trim();
  if (!source) return "";
  const romanised = /[\u0900-\u097F]/.test(source) ? devanagariToRoman(source) : source;
  return slugify(romanised, { lower: true, strict: true });
}

// Look for your "buildUniqueSlug" method around line 33 and swap it out with this one:

async function buildUniqueSlug(
  base: string,
  excludeId?: string,
  preferredSlug?: string,
): Promise<string> {
  // If the client already sent a slug (auto-generated from a transliterated
  // headline, or hand-edited by the admin in the URL Slug field), reuse it
  // instead of discarding it and re-deriving a meaningless one from scratch.
  let raw = preferredSlug ? slugifyAny(preferredSlug) : "";
  if (!raw) raw = slugifyAny(base);

  if (!raw) {
    // Only reached for a genuinely empty/emoji-only headline.
    raw = "samachar-" + Math.random().toString(36).slice(2, 7);
  }

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
  raw: unknown,
): "CRITICAL" | "HIGH" | "MEDIUM" | null {
  if (!raw) return null;
  const u = String(raw).toUpperCase();
  if (u === "CRITICAL") return "CRITICAL";
  if (u === "HIGH") return "HIGH";
  if (u === "MEDIUM") return "MEDIUM";
  return null;
}

async function resolveCategoryId(body: any): Promise<string> {
  if (body.categoryId?.trim()) {
    const category = await Category.findById(body.categoryId.trim());

    if (!category) {
      throw new Error("Selected category does not exist.");
    }

    return String(category._id);
  }

  const name = String(body.category ?? "").trim();

  if (!name) {
    throw new Error("Category is required");
  }

  const cat = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });

  if (!cat) {
    throw new Error(
      "Category does not exist. Please ask an Admin to create it or get Categories permission."
    );
  }

  return String(cat._id);
}

async function upsertTags(tags: string[]): Promise<string[]> {
  const names: string[] = [];

  for (const tagName of tags) {
    const normalized = normalizeTagName(tagName);

    if (!normalized.trim()) {
      continue;
    }

    let tagSlug = slugify(normalized, {
      lower: true,
      strict: true,
    });

    // Fallback logic for Hindi/Devanagari tags
    if (!tagSlug) {
      let hash = 0;

      for (let i = 0; i < normalized.length; i++) {
        hash =
          (Math.imul(31, hash) + normalized.charCodeAt(i)) | 0;
      }

      tagSlug = "tag-" + Math.abs(hash).toString(36);
    }

    let tag = await Tag.findOne({
      slug: tagSlug,
    });

    if (!tag) {
      tag = await Tag.create({
        name: normalized,
        slug: tagSlug,
        usageCount: 1,
      });
    } else {
      await Tag.findByIdAndUpdate(tag._id, {
        $inc: { usageCount: 1 },
      });
    }

    names.push(normalized);
  }

  return names;
}
// ─── AUTO-PUBLISH SCHEDULED ARTICLES ───────────────────────────────────────────
// There was previously NO mechanism that ever moved a "SCHEDULED" article to
// "PUBLISHED" once its scheduledAt time arrived — the status just sat at
// SCHEDULED forever unless someone manually hit "Publish Now". This helper
// finds every SCHEDULED article whose scheduledAt is now in the past and
// flips it to PUBLISHED (publishedAt = the original scheduledAt, so "Published
// X ago" labels stay accurate). It's called defensively at the top of every
// read endpoint (so data is always correct at request time) AND on a
// background timer (so articles go live on time even with zero traffic).
let autoPublishRunning = false;
export async function autoPublishDueScheduled(): Promise<void> {
  if (autoPublishRunning) return; // avoid overlapping runs
  autoPublishRunning = true;
  try {
    const now = new Date();
    const due = await News.find({
      status: "SCHEDULED",
      scheduledAt: { $lte: now },
    }).select("_id headline slug excerpt featuredImage scheduledAt");

    if (due.length === 0) return;

    const ids = due.map((d) => d._id);

    await News.updateMany({ _id: { $in: ids } }, [
      {
        $set: {
          status: "PUBLISHED",
          publishedAt: "$scheduledAt",
          scheduledAt: null,
        },
      },
    ]);

    for (const article of due) {
      notifySubscribersOfNewArticle({
        headline: article.headline,
        slug: article.slug,
        shortDescription: article.excerpt ?? undefined,
        coverImage: article.featuredImage ?? undefined,
      }).catch((err) => console.error("[Newsletter] Notify failed:", err));

      notifyUsersOfNewArticle({
        headline: article.headline,
        slug: article.slug,
      }).catch((err) => console.error("[UserNotification] Notify failed:", err));
    }
  } catch (error) {
    console.error("autoPublishDueScheduled error:", error);
  } finally {
    autoPublishRunning = false;
  }
}

// Background safety net: even if nobody hits the API, due articles still
// flip to PUBLISHED within 30s of their scheduled time.
setInterval(() => {
  autoPublishDueScheduled().catch((err) =>
    console.error("[Scheduler] autoPublishDueScheduled failed:", err),
  );
}, 30_000);

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

    const slug = await buildUniqueSlug(headline, undefined, req.body.slug);
    const typeEnum = toArticleTypeEnum(articleType);

    // ── Status / dates ────────────────────────────────────────────────────────
    let publishedAt: Date | null = null;
    let scheduledAt: Date | null = null;
    let deletedAt: Date | null = null;
    let deleteAfter: Date | null = null;
    let resolvedStatus = status || "DRAFT";

    // ── Editor capability checks ──────────────────────────────────────────────
if (req.user?.role === "EDITOR") {
  const editor = await User.findById(req.user.id).select("permissions");

  if (!editor) {
    return res.status(401).json({
      message: "User not found.",
    });
  }

  const permissions = editor.permissions || [];

  // Standard Article only needs create-news.
  // Breaking News additionally needs breaking-news.
  if (
    typeEnum === "BREAKING" &&
    !permissions.includes("breaking-news")
  ) {
    return res.status(403).json({
      message: "Breaking News permission is required.",
    });
  }

  // Live Article additionally needs live-news.
  if (
    typeEnum === "LIVE" &&
    !permissions.includes("live-news")
  ) {
    return res.status(403).json({
      message: "Live News permission is required.",
    });
  }

  // Scheduled Article additionally needs scheduled.
  if (
    resolvedStatus === "SCHEDULED" &&
    !permissions.includes("scheduled")
  ) {
    return res.status(403).json({
      message: "Scheduled News permission is required.",
    });
  }
}

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
          .json({
            success: true,
            message: "Article instantly deleted (not stored).",
          });
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
      rawTags = tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
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
      resolvedKeywords = keywords
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean);
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

      breakingNewsTicker:
        typeEnum === "BREAKING" ? Boolean(breakingNewsTicker) : false,
      breakingPushNotif:
        typeEnum === "BREAKING" ? Boolean(breakingPushNotif) : false,
      breakingHomepageAlert:
        typeEnum === "BREAKING" ? Boolean(breakingHomepageAlert) : false,

      priority: normalisePriority(priority) ?? undefined,
      // FIX: default statusType to "published" only when article is PUBLISHED,
      // otherwise "paused" avoids accidentally surfacing DRAFT/SCHEDULED articles.
      statusType:
        statusType || (resolvedStatus === "PUBLISHED" ? "published" : "paused"),
      expiryTime: expiryTime ? new Date(expiryTime) : undefined,

      liveUpdates: (() => {
        if (typeEnum !== "LIVE") return undefined;
        // May arrive as parsed array (JSON body) or JSON string (FormData)
        let lu = liveUpdates;
        if (typeof lu === "string") { try { lu = JSON.parse(lu); } catch { lu = undefined; } }
        return Array.isArray(lu) ? lu : undefined;
      })(),

      featuredImage: imageUrl ?? undefined,
      imageCaption: imageCaption?.trim() || undefined,
      photoCredit: photoCredit?.trim() || undefined,

      metaTitle: metaTitle?.trim() || undefined,
      metaDescription: metaDescription?.trim() || undefined,
      slug,
      keywords: resolvedKeywords,
      focusKeywords: focusKeywords?.trim() || undefined,
      canonicalUrl: canonicalUrl?.trim() || undefined,

      status: resolvedStatus,
      publishedAt: publishedAt ?? undefined,
      scheduledAt: scheduledAt ?? undefined,
      deletedAt: deletedAt ?? undefined,
      deleteAfter: deleteAfter ?? undefined,

      authorId: resolvedAuthorId,
    });

    const populated = await News.findById((news as any)._id)
      .populate("categoryId", "name color")
      .populate("authorId", "name role");

    if (resolvedStatus === "PUBLISHED") {
      notifySubscribersOfNewArticle({
        headline: news.headline,
        slug: news.slug,
        shortDescription: news.excerpt ?? undefined,
        coverImage: news.featuredImage ?? undefined,
      }).catch((err) => console.error("[Newsletter] Notify failed:", err));

      // TEMP DEBUG: await + rethrow so the real error shows up in the API
      // response instead of only (maybe) in server logs. Revert to the
      // fire-and-forget .catch() version once root cause is found.
      await notifyUsersOfNewArticle({
        headline: news.headline,
        slug: news.slug,
      });
    }

    res.status(201).json({ success: true, news: populated });
  } catch (error: any) {
    console.error("createNews error:", error);
    res.status(500).json({ message: error?.message ?? "Error creating news" });
  }
};

// ─── GET ALL (admin — no status default filter) ────────────────────────────────
export const getAllNews = async (req: Request, res: Response) => {
  try {
    await autoPublishDueScheduled();

    const {
      category,
      categoryId,
      search,
      articleType,
      status,
      priority,
      page,
      limit,
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page || "1")));
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(String(limit || "20"))),
    );
    const skip = (pageNum - 1) * limitNum;

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
    if (catIdFilter) filter.categoryId = catIdFilter;
    if (articleType) filter.articleType = String(articleType);
    if (status) filter.status = String(status);

    const normPriority =
      priority && priority !== "All Priority"
        ? normalisePriority(String(priority))
        : null;
    if (normPriority) filter.priority = normPriority;

    if (search) {
      filter.$or = [
        { headline: { $regex: String(search), $options: "i" } },
        { content: { $regex: String(search), $options: "i" } },
      ];
    }

    // FIX: exclude only truly hard-deleted docs (status=DELETED with no scheduled
    // purge date). Docs in DRAFT / SCHEDULED should still appear in admin list.
    filter.$nor = [{ status: "DELETED", deleteAfter: null }];

    const [newsDocs2, total] = await Promise.all([
      News.find(filter)
        .sort({
  displayOrder: 1,
  createdAt: -1,
})
        .skip(skip)
        .limit(limitNum)
        .lean(),
      News.countDocuments(filter),
    ]);

    const cIds2 = [
      ...new Set(newsDocs2.map((n: any) => n.categoryId).filter(Boolean)),
    ];
    const aIds2 = [
      ...new Set(newsDocs2.map((n: any) => n.authorId).filter(Boolean)),
    ];
    const [cats2, auths2] = await Promise.all([
      Category.find({ _id: { $in: cIds2 } })
        .select("_id name color")
        .lean(),
      User.find({ _id: { $in: aIds2 } })
        .select("_id name email role")
        .lean(),
    ]);
    const cMap2 = Object.fromEntries(
      (cats2 as any[]).map((c: any) => [String(c._id), c]),
    );
    const aMap2 = Object.fromEntries(
      (auths2 as any[]).map((a: any) => [String(a._id), a]),
    );
    const news = newsDocs2.map((n: any) => ({
      ...n,
      id: String(n._id),
      categoryId: cMap2[n.categoryId] ?? n.categoryId,
      authorId: aMap2[n.authorId] ?? n.authorId,
    }));

    res.json({
      news,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("getAllNews error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── GET ALL (public/user-facing — only PUBLISHED) ────────────────────────────
// Use this handler for /api/news (public) instead of the admin one.
export const getPublishedNews = async (req: Request, res: Response) => {
  try {
    await autoPublishDueScheduled();

    const { category, categoryId, search, articleType, page, limit } =
      req.query;

    const pageNum = Math.max(1, parseInt(String(page || "1")));
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(String(limit || "20"))),
    );
    const skip = (pageNum - 1) * limitNum;

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
    if (catIdFilter) filter.categoryId = catIdFilter;
    if (articleType) filter.articleType = String(articleType);

    if (search) {
      filter.$or = [
        { headline: { $regex: String(search), $options: "i" } },
        { excerpt: { $regex: String(search), $options: "i" } },
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
    const categoryIds = [
      ...new Set(newsDocs.map((n: any) => n.categoryId).filter(Boolean)),
    ];
    const authorIds = [
      ...new Set(newsDocs.map((n: any) => n.authorId).filter(Boolean)),
    ];

    const [categories, authors] = await Promise.all([
      Category.find({ _id: { $in: categoryIds } })
        .select("_id name color")
        .lean(),
      User.find({ _id: { $in: authorIds } })
        .select("_id name role")
        .lean(),
    ]);

    const catMap = Object.fromEntries(
      (categories as any[]).map((c: any) => [String(c._id), c]),
    );
    const authorMap = Object.fromEntries(
      (authors as any[]).map((a: any) => [String(a._id), a]),
    );

    const news = newsDocs.map((n: any) => ({
      ...n,
      id: String(n._id),
      categoryId: catMap[n.categoryId] ?? n.categoryId,
      authorId: authorMap[n.authorId] ?? n.authorId,
    }));

    res.json({
      news,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("getPublishedNews error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── GET BY SLUG ──────────────────────────────────────────────────────────────
export const getNewsBySlug = async (req: Request, res: Response) => {
  try {
    await autoPublishDueScheduled();

    const news = await News.findOne({
      slug: String(req.params.id),
    })
      .populate("authorId", "name role")
      .populate("categoryId", "name color");

    if (!news) return res.status(404).json({ message: "News not found" });

    // View counting is NOT done here. It happens exclusively in
    // analytics.controller.ts's trackPageView -> bumpAnalyticsBucket, which
    // is called by the public article page and is properly deduped against
    // the PageView collection. That same function now also increments
    // News.views, so this route stays a pure read and the two counters
    // (this table's News.views, and the Dashboard's Analytics-backed
    // numbers) can never fall out of sync — there's only one place a view
    // is ever recorded.

    res.json(news);
  } catch (error) {
    console.error("getNewsBySlug error:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getNewsById = async (req: Request, res: Response) => {
  try {
    await autoPublishDueScheduled();

    const newsDoc = await News.findById(String(req.params.id)).lean();

    if (!newsDoc) return res.status(404).json({ message: "News not found" });

    const [catDoc, authorDoc] = await Promise.all([
      (newsDoc as any).categoryId
        ? Category.findById((newsDoc as any).categoryId)
            .select("_id name color")
            .lean()
        : null,
      (newsDoc as any).authorId
        ? User.findById((newsDoc as any).authorId)
            .select("_id name email role")
            .lean()
        : null,
    ]);

    const news = {
      ...newsDoc,
      id: String((newsDoc as any)._id),
      categoryId: catDoc ?? (newsDoc as any).categoryId,
      authorId: authorDoc ?? (newsDoc as any).authorId,
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
    const id = String(req.params.id);
    const existing = await News.findById(id);
    if (!existing) return res.status(404).json({ message: "News not found" });
    if (!canModifyNews(req, existing)) {
  return res.status(403).json({
    message: "You can only modify news created by you.",
  });
}

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

    const typeEnum = articleType
      ? toArticleTypeEnum(articleType)
      : existing.articleType;
// ── Editor capability checks ─────────────────────────────────────────────
if (req.user?.role === "EDITOR") {
  const editor = await User.findById(req.user.id).select("permissions");

  if (!editor) {
    return res.status(401).json({
      message: "User not found.",
    });
  }

  const permissions = editor.permissions || [];

  // Editor cannot change an article into Breaking News
  if (
    typeEnum === "BREAKING" &&
    existing.articleType !== "BREAKING" &&
    !permissions.includes("breaking-news")
  ) {
    return res.status(403).json({
      message: "Breaking News permission is required.",
    });
  }

  // Editor cannot change an article into Live Updates
  if (
    typeEnum === "LIVE" &&
    existing.articleType !== "LIVE" &&
    !permissions.includes("live-news")
  ) {
    return res.status(403).json({
      message: "Live News permission is required.",
    });
  }
}
    let categoryId = existing.categoryId;
    if (req.body.categoryId || req.body.category) {
      try {
        categoryId = await resolveCategoryId(req.body);
      } catch (_) {}
    }

    let slug = existing.slug;
    const incomingSlug = typeof req.body.slug === "string" ? req.body.slug.trim() : "";
    const incomingSlugNormalised = incomingSlug ? slugifyAny(incomingSlug) : "";

    if (incomingSlugNormalised && incomingSlugNormalised !== existing.slug) {
      // Admin manually edited the URL Slug field (or the frontend sent a
      // freshly auto-generated, transliterated slug) — honour it.
      slug = await buildUniqueSlug(headline?.trim() || existing.headline, id, incomingSlug);
    } else if (headline && headline.trim() !== existing.headline) {
      // Headline changed and the slug wasn't hand-edited — regenerate from
      // the new headline (with Hindi transliteration applied).
      slug = await buildUniqueSlug(headline.trim(), id);
    }

    let publishedAt: Date | null = existing.publishedAt ?? null;
    let scheduledAt: Date | null = (existing as any).scheduledAt ?? null;
    let deletedAt: Date | null = (existing as any).deletedAt ?? null;
    let deleteAfter: Date | null = (existing as any).deleteAfter ?? null;

    if (
  req.user?.role === "EDITOR" &&
  status === "SCHEDULED" &&
  existing.status !== "SCHEDULED"
) {
  const editor = await User.findById(req.user.id).select("permissions");

  if (!editor) {
    return res.status(401).json({
      message: "User not found.",
    });
  }

  if (!editor.permissions?.includes("scheduled")) {
    return res.status(403).json({
      message: "Scheduled News permission is required.",
    });
  }
}

    const justPublished = status === "PUBLISHED" && existing.status !== "PUBLISHED";

    if (justPublished) {
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
        return res.json({
          success: true,
          message: "Article permanently deleted.",
        });
      }
      const days = parseInt(String(deleteIntervalDays ?? 14));
      deleteAfter = new Date(Date.now() + days * 86_400_000);
    }

    const resolvedTags = Array.isArray(tags) ? await upsertTags(tags) : null;

    const updateData: Record<string, any> = {
      categoryId,
      articleType: typeEnum,
      slug,
      publishedAt,
      scheduledAt,
      deletedAt,
      deleteAfter,
    };

    if (headline !== undefined) updateData.headline = headline.trim();
    if (shortTitle !== undefined)
      updateData.shortTitle = shortTitle?.trim() || null;
    if (excerpt !== undefined) updateData.excerpt = excerpt?.trim() || null;
    if (content !== undefined) updateData.content = content;
    if (language !== undefined) updateData.language = language;
    if (location !== undefined) updateData.location = location?.trim() || null;
    if (resolvedTags !== null) updateData.tags = resolvedTags;

    if (typeEnum === "BREAKING") {
      updateData.breakingNewsTicker = Boolean(breakingNewsTicker);
      updateData.breakingPushNotif = Boolean(breakingPushNotif);
      updateData.breakingHomepageAlert = Boolean(breakingHomepageAlert);
    }

    if (priority !== undefined)
      updateData.priority = normalisePriority(priority);
    if (statusType !== undefined) updateData.statusType = statusType;
    if (expiryTime !== undefined)
      updateData.expiryTime = expiryTime ? new Date(expiryTime) : null;

    if (typeEnum === "LIVE" && liveUpdates !== undefined) {
      // liveUpdates may arrive as a parsed array (JSON body) or a JSON string (FormData)
      let parsedLiveUpdates = liveUpdates;
      if (typeof liveUpdates === "string") {
        try { parsedLiveUpdates = JSON.parse(liveUpdates); } catch { parsedLiveUpdates = undefined; }
      }
      updateData.liveUpdates = Array.isArray(parsedLiveUpdates) ? parsedLiveUpdates : undefined;
    }

    // Prefer a freshly-uploaded file URL from middleware; fall back to the
    // value sent in the JSON body; never accept a blob: URL.
    if ((req as any).uploadedImageUrl) {
      updateData.featuredImage = (req as any).uploadedImageUrl;
    } else if (featuredImage !== undefined && !featuredImage?.startsWith("blob:")) {
      updateData.featuredImage = featuredImage?.trim() || null;
    }
    if (imageCaption !== undefined)
      updateData.imageCaption = imageCaption?.trim() || null;
    if (photoCredit !== undefined)
      updateData.photoCredit = photoCredit?.trim() || null;
    if (metaTitle !== undefined)
      updateData.metaTitle = metaTitle?.trim() || null;
    if (metaDescription !== undefined)
      updateData.metaDescription = metaDescription?.trim() || null;
    if (keywords !== undefined)
      updateData.keywords = Array.isArray(keywords) ? keywords : [];
    if (focusKeywords !== undefined)
      updateData.focusKeywords = focusKeywords?.trim() || null;
    if (canonicalUrl !== undefined)
      updateData.canonicalUrl = canonicalUrl?.trim() || null;
    if (status !== undefined) updateData.status = status;

    const updated = await News.findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .populate("authorId", "name")
      .populate("categoryId", "name color");

    if (justPublished && updated) {
      notifySubscribersOfNewArticle({
        headline: updated.headline,
        slug: updated.slug,
        shortDescription: updated.excerpt ?? undefined,
        coverImage: updated.featuredImage ?? undefined,
      }).catch((err) => console.error("[Newsletter] Notify failed:", err));

      // TEMP DEBUG: await + rethrow so the real error shows up in the API
      // response instead of only (maybe) in server logs.
      await notifyUsersOfNewArticle({
        headline: updated.headline,
        slug: updated.slug,
      });
    }

    res.json({ success: true, updated });
  } catch (error) {
    console.error("updateNews error:", error);
    res.status(500).json({ message: "Error updating news" });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteNews = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await News.findById(id);
    if (!existing) return res.status(404).json({ message: "News not found" });
    if (!canModifyNews(req, existing)) {
  return res.status(403).json({
    message: "You can only delete news created by you.",
  });
}

    const { deleteMode, deleteIntervalDays } = req.body ?? {};

    if (deleteMode === "interval") {
      const days = parseInt(String(deleteIntervalDays ?? 14));
      await News.findByIdAndUpdate(id, {
        status: "DELETED",
        deletedAt: new Date(),
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
      status: "DELETED",
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
    const id = String(req.params.id);
    const existing = await News.findById(id);
    if (!existing) return res.status(404).json({ message: "News not found" });
    if (!canModifyNews(req, existing)) {
  return res.status(403).json({
    message: "You can only modify news created by you.",
  });
}
    if (existing.articleType !== "BREAKING")
      return res.status(400).json({ message: "Not a breaking news article" });

    const current = (existing as any).statusType as string | null;
    const newStatus = current === "paused" ? "published" : "paused";

    const updated = await News.findByIdAndUpdate(
      id,
      { statusType: newStatus },
      { returnDocument: 'after' },
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
    const id = String(req.params.id);
    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "News not found" });
    if (!canModifyNews(req, news)) {
  return res.status(403).json({
    message: "You can only modify news created by you.",
  });
}
    if (news.articleType !== "LIVE")
      return res.status(400).json({ message: "Not a live article" });

    const {
      text,
      title,
      imageUrl,
      imageCaption,
      imageCredit,
      tweetUrl,
      poll,
      sourceUrl,
      sourceLabel,
      tags,
      isHighlight,
      isBreaking,
    } = req.body;

    const hasContent =
      text?.trim() ||
      title?.trim() ||
      imageUrl?.trim() ||
      tweetUrl?.trim() ||
      sourceUrl?.trim() ||
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
     id: randomUUID(),
      time: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: now.toISOString(),
      ...(text?.trim() && { text: text.trim() }),
      ...(title?.trim() && { title: title.trim() }),
      ...(imageUrl?.trim() &&
        !imageUrl.startsWith("blob:") && { imageUrl: imageUrl.trim() }),
      ...(imageCaption?.trim() && { imageCaption: imageCaption.trim() }),
      ...(imageCredit?.trim() && { imageCredit: imageCredit.trim() }),
      ...(tweetUrl?.trim() && { tweetUrl: tweetUrl.trim() }),
      ...(sourceUrl?.trim() && { sourceUrl: sourceUrl.trim() }),
      ...(sourceLabel?.trim() && { sourceLabel: sourceLabel.trim() }),
      ...(Array.isArray(tags) && tags.length > 0 && { tags }),
      ...(isHighlight !== undefined && { isHighlight: Boolean(isHighlight) }),
      ...(isBreaking !== undefined && { isBreaking: Boolean(isBreaking) }),
      ...(poll &&
        typeof poll.question === "string" &&
        poll.question.trim() &&
        Array.isArray(poll.options) &&
        poll.options.length >= 2 && {
          poll: {
            question: poll.question.trim(),
            totalVotes: 0,

            options: poll.options
              .filter((o: any) => o && (o.label || o).toString().trim())
              .map((o: any, index: number) => ({
                id: `opt_${index}`,
                label: typeof o === "string" ? o : o.label,
                votes: 0,
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
      { returnDocument: 'after' },
    );

    res.json({ success: true, update: newUpdate, news: updated });
  } catch (error) {
    console.error("addLiveUpdate error:", error);
    res.status(500).json({ message: "Error adding live update" });
  }
};


export const voteOnPoll = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      newsId,
      updateId
    } = req.params;

    const { optionId } =
      req.body;

    const news =
      await News.findById(newsId);

    if (!news)
      return res.status(404).json({
        message: "News not found",
      });

    const update =
      news.liveUpdates.find(
        (u: any) =>
          String(u.id) === updateId
      );

    if (!update?.poll)
      return res.status(404).json({
        message: "Poll not found",
      });

    const option =
      update.poll.options.find(
        (o: any) =>
          o.id === optionId
      );

    if (!option)
      return res.status(404).json({
        message: "Option not found",
      });

    option.votes += 1;

    update.poll.totalVotes += 1;

    news.markModified(
      "liveUpdates"
    );

    await news.save();

    res.json({
      success: true,
      poll: update.poll,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error voting",
    });
  }
};

// ─── GET MEDIA LIBRARY ────────────────────────────────────────────────────────
export const getMediaLibrary = async (req: Request, res: Response) => {
  try {
    const pageNum = Math.max(1, parseInt(String(req.query.page || "1")));
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit || "50"))),
    );
    const skip = (pageNum - 1) * limitNum;

    const filter = {
  featuredImage: { $not: /^blob:/ },
};

    const [items, total] = await Promise.all([
      News.find(filter)
        .select(
          "_id headline featuredImage content imageCaption photoCredit createdAt status views",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      News.countDocuments(filter),
    ]);

   const formatted = items.flatMap((item) => {
  const contentImages = extractImagesFromContent(item.content || "");

  const featuredItem = {
    newsId: String(item._id),
    url: item.featuredImage ?? null,
    headline: item.headline,
    caption: item.imageCaption ?? null,
    credit: item.photoCredit ?? null,
    createdAt: item.createdAt,
    status: item.status,
    views: item.views,
    type: "featured" as const,
  };

  return [
    featuredItem,

    ...contentImages
      .filter((url) => !url.startsWith("blob:"))
      .map((url) => ({
        newsId: String(item._id),
        url,
        headline: item.headline,
        caption: null,
        credit: null,
        createdAt: item.createdAt,
        status: item.status,
        views: item.views,
        type: "content" as const,
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
    const newsId = String(req.params.newsId);
    const article = await News.findById(newsId);
    if (!article) return res.status(404).json({ message: "Article not found" });
    if (!canModifyNews(req, article)) {
  return res.status(403).json({
    message: "You can only modify news created by you.",
  });
}

    const imageUrl = article.featuredImage;

    await News.findByIdAndUpdate(newsId, {
      featuredImage: null,
      imageCaption: null,
      photoCredit: null,
    });

    if (imageUrl) {
  try {
    const publicId = imageUrl
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0];

    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Cloudinary delete warning:", err);
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
    const tagNames: string[] = await News.distinct("tags", {
      status: "PUBLISHED",
    });

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

export const getRecentNews = async (req: Request, res: Response) => {
  try {
    await autoPublishDueScheduled();

    const news = await News.find({
      status: "PUBLISHED",
    })
      .sort({
        createdAt: -1,
      })
      .limit(10);

    const formattedNews = await Promise.all(
      news.map(async (item) => {
        const category = await Category.findById(item.categoryId);

        return {
          ...item.toObject(),

          categoryName: category?.name || "News",
        };
      }),
    );

    res.json({
      success: true,
      news: formattedNews,
    });
  } catch (error) {
    console.error("getRecentNews error:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching recent news",
    });
  }
};

export const getBreakingTickerNews = async (req: Request, res: Response) => {
  try {
    await autoPublishDueScheduled();

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

    const headlines = news.map((item: any) =>
      item.shortTitle?.trim() ? item.shortTitle : item.headline,
    );

    res.json({
      success: true,
      headlines,
    });
  } catch (error) {
    console.error("getBreakingTickerNews error:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching ticker news",
    });
  }
};

export const getNewsByTag = async (req: Request, res: Response) => {
  try {
    await autoPublishDueScheduled();

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
    console.error("getNewsByTag error:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching tag news",
    });
  }
};

export const getTrendingNews = async (req: Request, res: Response) => {
  try {
    await autoPublishDueScheduled();

    // Trending is now purely admin-controlled: only tags the admin has
    // manually pinned via isTrending count as "trending". Usage-based
    // auto-trending has been removed.
    const adminTrendingTags = await Tag.find({
      isTrending: true,
    });
    const tagNames = adminTrendingTags.map((tag) => tag.name);

    // Get all news matching an admin-trending tag. If no tags are pinned
    // yet, fall back to the most recent published articles so the section
    // is never empty.
    const news = tagNames.length
      ? await News.find({
          status: "PUBLISHED",
          tags: {
            $in: tagNames,
          },
        }).sort({
          createdAt: -1,
        })
      : await News.find({ status: "PUBLISHED" })
          .sort({ createdAt: -1 })
          .limit(20);

    // Random shuffle
    const shuffled = [...news].sort(() => Math.random() - 0.5);

    // Get category names
    const newsWithCategory = await Promise.all(
      shuffled.map(async (article) => {
        const category = await Category.findById(article.categoryId);

        return {
          ...article.toObject(),
          category: category?.name || "News",
        };
      }),
    );

    res.json({
      success: true,
      news: newsWithCategory,
    });
  } catch (error) {
    console.error("getTrendingNews error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch trending news",
    });
  }
};

export const getNewsByTopicSlug = async (req: Request, res: Response) => {
  try {
    await autoPublishDueScheduled();

    const { slug } = req.params;

    const topic = await TopicProfile.findOne({
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
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      topic: topic.name,
      total: news.length,
      news,
    });
  } catch (error) {
    console.error("getNewsByTopicSlug error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch topic news",
    });
  }
};

// ─── UPLOAD / REPLACE FEATURED IMAGE ──────────────────────────────────────────────
export const uploadMediaImage = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const newsId = String(req.params.newsId);

    const article = await News.findById(newsId);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    if (!canModifyNews(req, article)) {
  return res.status(403).json({
    message: "You can only modify news created by you.",
  });
}

    // uploadedImageUrl is already provided by your upload middleware
    const imageUrl = (req as any).uploadedImageUrl;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image upload failed.",
      });
    }

    // Delete old image from Cloudinary (optional but recommended)
    if (article.featuredImage) {
      try {
        const publicId = article.featuredImage
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];

        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn("Old image delete warning:", err);
      }
    }

    article.featuredImage = imageUrl;

    await article.save();

    res.json({
      success: true,
      message: "Featured image uploaded successfully.",
      image: imageUrl,
      article,
    });
  } catch (error) {
    console.error("uploadMediaImage error:", error);

    res.status(500).json({
      success: false,
      message: "Error uploading image",
    });
  }
};

// ─── REORDER NEWS ─────────────────────────────────────────────────────────────

export const reorderNews = async (req: AuthRequest, res: Response) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orders must be a non-empty array",
      });
    }

    const operations = orders.map(
      (item: { id: string; order: number }) => ({
        updateOne: {
          filter: { _id: item.id },
          update: {
            $set: {
              displayOrder: Number(item.order),
            },
          },
        },
      })
    );

    await News.bulkWrite(operations);

    return res.json({
      success: true,
      message: "News order updated successfully",
    });
  } catch (error) {
    console.error("reorderNews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update news order",
    });
  }
};

// ─── PIN / UNPIN HOMEPAGE ────────────────────────────────────────────────────

// ─── PIN / UNPIN HOMEPAGE ────────────────────────────────────────────────────

// ─── PIN / UNPIN HOMEPAGE ────────────────────────────────────────────────────

export const toggleHomepagePin = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News article not found",
      });
    }

    // ─── UNPIN ───────────────────────────────────────────────────────────────
    if (news.isPinned) {
      news.isPinned = false;

      await news.save();

      return res.json({
        success: true,
        message: "Article removed from homepage",
        isPinned: false,
      });
    }

    // ─── ONLY PUBLISHED ARTICLES CAN BE PINNED ───────────────────────────────
    if (news.status !== "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Only published articles can be pinned to homepage",
      });
    }

    // ─── GET CURRENT PINNED ARTICLES ────────────────────────────────────────
    const pinnedArticles = await News.find({
      isPinned: true,
      status: "PUBLISHED",
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("_id displayOrder");

    // ─── MAXIMUM 5 PINNED ARTICLES ──────────────────────────────────────────
    // If 5 are already pinned, remove the lowest ordered pinned article.
    if (pinnedArticles.length >= 5) {
      const articleToRemove =
        pinnedArticles[pinnedArticles.length - 1];

      await News.findByIdAndUpdate(
        articleToRemove._id,
        {
          $set: {
            isPinned: false,
          },
        }
      );
    }

    // ─── PIN ARTICLE ─────────────────────────────────────────────────────────
    // IMPORTANT:
    // Do NOT change displayOrder.
    //
    // This means:
    // - All News keeps its current order.
    // - Homepage priority is calculated separately.
    news.isPinned = true;

    await news.save();

    return res.json({
      success: true,
      message: "Article pinned to homepage",
      isPinned: true,
    });
  } catch (error) {
    console.error("toggleHomepagePin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update homepage pin",
    });
  }
};
// ─── HOMEPAGE NEWS ───────────────────────────────────────────────────────────

// ─── HOMEPAGE NEWS ───────────────────────────────────────────────────────────

// ─── HOMEPAGE NEWS ───────────────────────────────────────────────────────────

// ─── HOMEPAGE NEWS ───────────────────────────────────────────────────────────

export const getHomepageNews = async (
  req: Request,
  res: Response
) => {
  try {
    await autoPublishDueScheduled();

    // ───────────────────────────────────────────────────────────────────────
    // Get ALL published articles first.
    //
    // Do NOT use .limit(20) here.
    // A pinned article may have a large displayOrder and must still be
    // considered for homepage priority.
    // ───────────────────────────────────────────────────────────────────────

    const newsDocs = await News.find({
      status: "PUBLISHED",
    })
      .sort({
        displayOrder: 1,
        publishedAt: -1,
        createdAt: -1,
      })
      .lean();

    // ───────────────────────────────────────────────────────────────────────
    // Calculate homepage priority
    //
    // 1 = LIVE + PINNED
    // 2 = BREAKING + PINNED
    // 3 = PINNED
    // 4 = LIVE
    // 5 = BREAKING
    // 6 = NORMAL
    // ───────────────────────────────────────────────────────────────────────

    const getHomepagePriority = (article: any): number => {
      const isPinned = article.isPinned === true;
      const type = article.articleType;

      if (isPinned && type === "LIVE") {
        return 1;
      }

      if (isPinned && type === "BREAKING") {
        return 2;
      }

      if (isPinned) {
        return 3;
      }

      if (type === "LIVE") {
        return 4;
      }

      if (type === "BREAKING") {
        return 5;
      }

      return 6;
    };

    // ───────────────────────────────────────────────────────────────────────
    // Sort by priority first.
    //
    // For articles having the SAME priority:
    // displayOrder decides the position.
    //
    // This means dragging/reordering still works.
    // ───────────────────────────────────────────────────────────────────────

    const sortedNews = [...newsDocs].sort((a: any, b: any) => {
      const priorityA = getHomepagePriority(a);
      const priorityB = getHomepagePriority(b);

      // First: special homepage priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Second: manually controlled display order
      const orderA = Number(a.displayOrder ?? 0);
      const orderB = Number(b.displayOrder ?? 0);

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Third: newest published article
      const publishedA = a.publishedAt
        ? new Date(a.publishedAt).getTime()
        : 0;

      const publishedB = b.publishedAt
        ? new Date(b.publishedAt).getTime()
        : 0;

      if (publishedA !== publishedB) {
        return publishedB - publishedA;
      }

      // Final fallback
      const createdA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const createdB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return createdB - createdA;
    });

    // ───────────────────────────────────────────────────────────────────────
    // Only five articles are displayed on the homepage.
    // ───────────────────────────────────────────────────────────────────────

    const homepageDocs = sortedNews.slice(0, 5);

    // ───────────────────────────────────────────────────────────────────────
    // Resolve categories
    // ───────────────────────────────────────────────────────────────────────

    const categoryIds = [
      ...new Set(
        homepageDocs
          .map((article: any) => article.categoryId)
          .filter(Boolean)
      ),
    ];

    const categories = await Category.find({
      _id: { $in: categoryIds },
    })
      .select("_id name color")
      .lean();

    const categoryMap = Object.fromEntries(
      (categories as any[]).map((category: any) => [
        String(category._id),
        category,
      ])
    );

    // ───────────────────────────────────────────────────────────────────────
    // Format response
    // ───────────────────────────────────────────────────────────────────────

    const news = homepageDocs.map((article: any) => ({
      ...article,

      id: String(article._id),

      // Frontend expects:
      // article.categoryId.name
      categoryId:
        categoryMap[String(article.categoryId)] ??
        article.categoryId,
    }));

    return res.json({
      success: true,
      news,
    });
  } catch (error) {
    console.error("getHomepageNews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load homepage news",
    });
  }
};