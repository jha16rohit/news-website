import { Request, Response } from "express";
import Tag from "../models/Tag";
import slugify from "slugify";

// ─── Helper: Normalize Tag ────────────────────────────────────────────────────
function normalizeTagName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── CREATE TAG ───────────────────────────────────────────────────────────────
export const createTag = async (req: Request, res: Response) => {
  try {
    let { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Tag name is required" });
    }

    name = normalizeTagName(name);
    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Tag.findOne({
      $or: [{ slug }, { name: { $regex: new RegExp(`^${name}$`, "i") } }],
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
  } catch (error) {
    console.error("createTag error:", error);
    res.status(500).json({ message: "Error creating tag" });
  }
};

// ─── GET ALL TAGS ─────────────────────────────────────────────────────────────
export const getAllTags = async (req: Request, res: Response) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });
    res.json(tags);
  } catch (error) {
    console.error("getAllTags error:", error);
    res.status(500).json({ message: "Error fetching tags" });
  }
};

// ─── TRENDING TAGS ────────────────────────────────────────────────────────────
export const getTrendingTags = async (req: Request, res: Response) => {
  try {
    const tags = await Tag.find({ isTrending: true }).sort({
      usageCount: -1,
    });
    res.json(tags);
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
      { new: true }
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