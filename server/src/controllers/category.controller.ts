import { Request, Response } from "express";
import prisma from "../config/db";
import slugify from "slugify";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function buildUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const raw = slugify(name, { lower: true, strict: true });
  const existing = await prisma.category.findFirst({
    where: { slug: raw, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (!existing) return raw;
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${raw}-${suffix}`;
}

// ─── CREATE ─────────────────────────────────────────────────────────────────
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, color, featured, showcase, active, parentId } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const finalSlug = slug?.trim()
      ? await buildUniqueSlug(slug.trim())
      : await buildUniqueSlug(name.trim());

    // Validate parentId exists if provided
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: String(parentId) } });
      if (!parent) return res.status(400).json({ message: "Parent category not found" });
      // Prevent grandchildren (only one level of nesting)
      if (parent.parentId) return res.status(400).json({ message: "Cannot nest more than one level deep" });
    }

    const category = await prisma.category.create({
      data: {
        name:        name.trim(),
        slug:        finalSlug,
        description: description?.trim() || null,
        color:       color || null,
        featured:    Boolean(featured),
        showcase:    Boolean(showcase),
        active:      active !== undefined ? Boolean(active) : true,
        parentId:    parentId ? String(parentId) : null,
      },
      include: {
        parent:   { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count:   { select: { news: true } },
      },
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error("createCategory error:", error);
    res.status(500).json({ message: "Error creating category" });
  }
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const categories = await prisma.category.findMany({
      where: search
        ? { name: { contains: String(search), mode: "insensitive" } }
        : undefined,
      include: {
        parent:   { select: { id: true, name: true, color: true } },
        children: { select: { id: true, name: true, color: true, active: true } },
        _count:   { select: { news: true } },
      },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    });

    // Shape into the Category type expected by the frontend
    const shaped = categories.map(c => ({
      id:          c.id,
      name:        c.name,
      slug:        c.slug,
      description: c.description ?? "",
      color:       c.color ?? "#3b82f6",
      parentId:    c.parentId ?? null,
      parent:      c.parent,
      children:    c.children,
      featured:    c.featured,
      inShowcase:  c.showcase,
      enabled:     c.active,
      _count:      c._count,
      createdAt:   c.createdAt,
    }));

    res.json(shaped);
  } catch (error) {
    console.error("getAllCategories error:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// ─── GET SINGLE ──────────────────────────────────────────────────────────────
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent:   true,
        children: true,
        _count:   { select: { news: true } },
      },
    });

    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    console.error("getCategoryById error:", error);
    res.status(500).json({ message: "Error fetching category" });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id       = String(req.params.id);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Category not found" });

    const { name, slug, description, color, featured, showcase, active, parentId } = req.body;

    // Validate new parentId if changing
    if (parentId !== undefined && parentId !== null) {
      const pid = String(parentId);
      if (pid === id) return res.status(400).json({ message: "A category cannot be its own parent" });
      const parent = await prisma.category.findUnique({ where: { id: pid } });
      if (!parent) return res.status(400).json({ message: "Parent category not found" });
      if (parent.parentId) return res.status(400).json({ message: "Cannot nest more than one level deep" });
    }

    let finalSlug = existing.slug;
    if (slug?.trim() || name?.trim()) {
      finalSlug = await buildUniqueSlug(slug?.trim() || name?.trim(), id);
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name:        name.trim() }),
        slug: finalSlug,
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color       !== undefined && { color }),
        ...(featured    !== undefined && { featured: Boolean(featured) }),
        ...(showcase    !== undefined && { showcase: Boolean(showcase) }),
        ...(active      !== undefined && { active:   Boolean(active) }),
        ...(parentId    !== undefined && {
          parentId: parentId ? String(parentId) : null,
        }),
      },
      include: {
        parent:   { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count:   { select: { news: true } },
      },
    });

    res.json({ success: true, updated });
  } catch (error) {
    console.error("updateCategory error:", error);
    res.status(500).json({ message: "Error updating category" });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.category.findUnique({
      where:   { id },
      include: { _count: { select: { news: true } } },
    });
    if (!existing) return res.status(404).json({ message: "Category not found" });

    // Prevent deleting a category that still has news articles
    if ((existing._count as any).news > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${(existing._count as any).news} article(s) still use this category. Reassign them first.`,
      });
    }

    // Children are cascade-deleted by DB (onDelete: Cascade in schema)
    await prisma.category.delete({ where: { id } });

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("deleteCategory error:", error);
    res.status(500).json({ message: "Error deleting category" });
  }
};

// ─── TOGGLE FEATURED ─────────────────────────────────────────────────────────
export const toggleFeatured = async (req: Request, res: Response) => {
  try {
    const id       = String(req.params.id);
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ message: "Category not found" });

    const updated = await prisma.category.update({
      where: { id },
      data:  { featured: !category.featured },
    });
    res.json({ success: true, updated });
  } catch (error) {
    console.error("toggleFeatured error:", error);
    res.status(500).json({ message: "Error toggling featured" });
  }
};

// ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────────
export const toggleActive = async (req: Request, res: Response) => {
  try {
    const id       = String(req.params.id);
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ message: "Category not found" });

    const updated = await prisma.category.update({
      where: { id },
      data:  { active: !category.active },
    });
    res.json({ success: true, updated });
  } catch (error) {
    console.error("toggleActive error:", error);
    res.status(500).json({ message: "Error toggling active" });
  }
};