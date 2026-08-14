import { Request, Response } from "express";
import Tag from "../models/Tag";
import News from "../models/News";
import slugify from "slugify";

// How many top-by-usage tags count as "trending" automatically (in addition
// to whatever the admin has manually pinned with isTrending).
const USAGE_TRENDING_LIMIT = 10;


async function getLiveArticleCountsByTagName(
  statusFilter: Record<string, any> = { status: { $ne: "DELETED" } }
): Promise<Map<string, number>> {
  const rows = await News.aggregate([
    { $match: statusFilter },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
  ]);

  // Case-insensitive lookup map, since tag names are stored normalized but
  // we key defensively in case of any casing drift.
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row._id) counts.set(String(row._id).toLowerCase(), row.count);
  }
  return counts;
}

function attachCount(tag: any, counts: Map<string, number>) {
  return {
    ...tag.toObject(),
    id: String(tag._id),
    _count: { articles: counts.get(tag.name.toLowerCase()) ?? 0 },
  };
}

// ─── Helper: Normalize Tag ────────────────────────────────────────────────────
function normalizeTagName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Helper: Generate a safe, never-empty slug ────────────────────────────────
// slugify with strict:true strips non-Latin chars completely, producing "" for
// Hindi/Devanagari names which then crashes on the unique+required constraint.
// This function falls back to a stable hash-based slug for non-Latin text.
function generateSlug(name: string): string {
  // Try Latin-friendly slug first
  const latinSlug = slugify(name, { lower: true, strict: true }).trim();
  if (latinSlug.length >= 2) return latinSlug;

  // Non-Latin fallback: stable numeric hash → "tag-xxxxxxx"
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (Math.imul(31, hash) + name.charCodeAt(i)) | 0;
  }
  return "tag-" + Math.abs(hash).toString(36);
}

// ─── CREATE TAG ───────────────────────────────────────────────────────────────
export const createTag = async (req: Request, res: Response) => {
  try {
    let { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Tag name is required" });
    }

    name = normalizeTagName(name);
    const slug = generateSlug(name);

    // Upsert: return existing tag if name or slug already taken
    const existing = await Tag.findOne({
      $or: [{ slug }, { name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } }],
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        tag: existing,
        message: "Tag already exists",
      });
    }

    const tag = await Tag.create({ name, slug });

    res.status(201).json({ success: true, tag });
  } catch (error: any) {
    // Handle MongoDB duplicate key race condition (two requests at the same time)
    if (error.code === 11000) {
      const name = normalizeTagName(req.body.name ?? "");
      const tag = await Tag.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { slug: generateSlug(name) },
        ],
      });
      if (tag) return res.status(200).json({ success: true, tag, message: "Tag already exists" });
    }
    console.error("createTag error:", error);
    res.status(500).json({ message: "Error creating tag" });
  }
};

// ─── GET ALL TAGS ─────────────────────────────────────────────────────────────
export const getAllTags = async (req: Request, res: Response) => {
  try {
    const [tags, counts] = await Promise.all([
      Tag.find().sort({ createdAt: -1 }),
      getLiveArticleCountsByTagName(),
    ]);
    // Map to include _count.articles shape that the frontend Tags page expects,
    // computed live from the News collection (see getLiveArticleCountsByTagName).
    const mapped = tags.map((t) => attachCount(t, counts));
    res.json(mapped);
  } catch (error) {
    console.error("getAllTags error:", error);
    res.status(500).json({ message: "Error fetching tags" });
  }
};

// ─── TRENDING TAGS ────────────────────────────────────────────────────────────
// A tag counts as "trending" if EITHER:
//   1. An admin has manually pinned it (isTrending: true), OR
//   2. It's currently one of the most-used tags among published articles
//      (usage-based, fully automatic — no admin action required).
// Both sets are unioned so trending news / trending tag UI on the user side
// reflects both sources, exactly as intended.
export const getTrendingTags = async (req: Request, res: Response) => {
  try {
    const [adminTrending, publishedCounts, allCounts] = await Promise.all([
      Tag.find({ isTrending: true }),
      getLiveArticleCountsByTagName({ status: "PUBLISHED" }),
      getLiveArticleCountsByTagName(),
    ]);

    const byId = new Map<string, any>();
    for (const t of adminTrending) byId.set(String(t._id), t);

    // Top N tags by live published-article usage, regardless of manual flag.
    const usageRanked = [...publishedCounts.entries()]
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, USAGE_TRENDING_LIMIT)
      .map(([name]) => name);

    if (usageRanked.length) {
      const usageTags = await Tag.find({
        name: { $in: usageRanked.map((n) => new RegExp(`^${n}$`, "i")) },
      });
      for (const t of usageTags) byId.set(String(t._id), t);
    }

    const merged = [...byId.values()].map((t) => attachCount(t, allCounts));
    merged.sort((a, b) => (b._count.articles ?? 0) - (a._count.articles ?? 0));

    res.json(merged);
  } catch (error) {
    console.error("getTrendingTags error:", error);
    res.status(500).json({ message: "Error fetching trending tags" });
  }
};

// ─── SET / UNSET TRENDING ─────────────────────────────────────────────────────
export const setTagTrending = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const isTrending = Boolean(req.body.isTrending);

    const tag = await Tag.findByIdAndUpdate(
      id,
      { isTrending },
      { returnDocument: 'after' }
    );

    if (!tag) return res.status(404).json({ message: "Tag not found" });

    res.json({ success: true, tag });
  } catch (error) {
    console.error("setTagTrending error:", error);
    res.status(500).json({ message: "Error updating trending status" });
  }
};

// ─── DELETE TAG ───────────────────────────────────────────────────────────────
export const deleteTag = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    await Tag.findByIdAndDelete(id);

    res.json({ success: true, message: "Tag deleted" });
  } catch (error) {
    console.error("deleteTag error:", error);
    res.status(500).json({ message: "Error deleting tag" });
  }
};