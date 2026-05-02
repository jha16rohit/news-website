import { Request, Response } from "express";
import prisma from "../config/db";
import slugify from "slugify";

// ─── Helper: Normalize Tag ─────────────────────────────────────
function normalizeTagName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── CREATE TAG ────────────────────────────────────────────────
export const createTag = async (req: Request, res: Response) => {
  try {
    let { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Tag name is required" });
    }

    name = normalizeTagName(name);
    const slug = slugify(name, { lower: true, strict: true });

    // Check if already exists
    const existing = await prisma.tag.findFirst({
      where: {
        OR: [
          { slug },
          { name: { equals: name, mode: "insensitive" } }
        ]
      }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        tag: existing,
        message: "Tag already exists"
      });
    }

    const tag = await prisma.tag.create({
      data: { name, slug }
    });

    res.status(201).json({ success: true, tag });

  } catch (error) {
    console.error("createTag error:", error);
    res.status(500).json({ message: "Error creating tag" });
  }
};

// ─── GET ALL TAGS ──────────────────────────────────────────────
export const getAllTags = async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { articles: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(tags);

  } catch (error) {
    console.error("getAllTags error:", error);
    res.status(500).json({ message: "Error fetching tags" });
  }
};

// ─── TRENDING TAGS (MOST USED) ─────────────────────────────────
export const getTrendingTags = async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      take: 10,
      orderBy: {
        usageCount: "desc"   // ✅ correct
      },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    });

    res.json(tags);

  } catch (error) {
    console.error("getTrendingTags error:", error);
    res.status(500).json({ message: "Error fetching trending tags" });
  }
};

// ─── DELETE TAG ────────────────────────────────────────────────
export const deleteTag = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    await prisma.tag.delete({
      where: { id }
    });

    res.json({ success: true, message: "Tag deleted" });

  } catch (error) {
    console.error("deleteTag error:", error);
    res.status(500).json({ message: "Error deleting tag" });
  }
};