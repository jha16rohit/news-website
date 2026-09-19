import { Request, Response } from "express";
import Category from "../models/Category";
import News from "../models/News";
import slugify from "slugify";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function buildUniqueSlug(
  input: string,
  excludeId?: string
): Promise<string> {
  let raw = input.trim();

  // Generate English-style slug only if the text contains Latin letters
  if (/[a-zA-Z]/.test(raw)) {
    raw = slugify(raw, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

  const query: any = { slug: raw };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await Category.findOne(query);

  if (!existing) return raw;

  let counter = 2;

  while (
    await Category.findOne({
      slug: `${raw}-${counter}`,
      ...(excludeId && { _id: { $ne: excludeId } }),
    })
  ) {
    counter++;
  }

  return `${raw}-${counter}`;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createCategory = async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      color,
      featured,
      showcase,
      active,
      parentId,
    } = req.body;

    if (!name?.trim()) {
      return res
        .status(400)
        .json({ message: "Category name is required" });
    }

    const finalSlug = slug?.trim()
      ? await buildUniqueSlug(slug.trim())
      : await buildUniqueSlug(name.trim());

    // Validate parentId exists if provided
    if (parentId) {
      const parent = await Category.findById(String(parentId));
      if (!parent)
        return res
          .status(400)
          .json({ message: "Parent category not found" });
      if (parent.parentId)
        return res
          .status(400)
          .json({ message: "Cannot nest more than one level deep" });
    }

    const categoryDoc = await Category.create({
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() || undefined,
      color: color || undefined,
      featured: Boolean(featured),
      showcase: Boolean(showcase),
      active: active !== undefined ? Boolean(active) : true,
      parentId: parentId ? String(parentId) : undefined,
    });
    const category = categoryDoc as NonNullable<typeof categoryDoc>;

    // Enrich with parent / children / count for response
    const parent = category.parentId
      ? await Category.findById(category.parentId).select("_id name")
      : null;
    const children = await Category.find({
      parentId: String(category._id),
    }).select("_id name");
    const newsCount = await News.countDocuments({
      categoryId: String(category._id),
    });

    res.status(201).json({
      success: true,
      category: {
        ...category.toObject(),
        parent,
        children,
        _count: { news: newsCount },
      },
    });
  } catch (error) {
    console.error("createCategory error:", error);
    res.status(500).json({ message: "Error creating category" });
  }
};

// ─── GET ALL (ADMIN — every category, active + inactive) ─────────────────────
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const filter = search
      ? { name: { $regex: String(search), $options: "i" } }
      : {};

    const categories = await Category.find(filter).sort({
      parentId: 1,
      name: 1,
    });

    // Build shaped response
    const shaped = await Promise.all(
      categories.map(async (c) => {
        const parent = c.parentId
          ? await Category.findById(c.parentId).select("_id name color")
          : null;
        const children = await Category.find({
          parentId: String(c._id),
        }).select("_id name color active");
        const newsCount = await News.countDocuments({
          categoryId: String(c._id),
        });

        return {
          id: String(c._id),
          name: c.name,
          slug: c.slug,
          description: c.description ?? "",
          color: c.color ?? "#3b82f6",
          parentId: c.parentId ?? null,
          parent,
          children,
          featured: c.featured,
          inShowcase: c.showcase,
          enabled: c.active,
          _count: { news: newsCount },
          createdAt: c.createdAt,
        };
      })
    );

    res.json(shaped);
  } catch (error) {
    console.error("getAllCategories error:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// ─── GET ALL (PUBLIC — active categories only, lightweight shape) ─────────────
// Used by the public/user-facing site (nav menus, category filters, etc).
// Unlike getAllCategories, this is unauthenticated and only ever exposes
// categories the admin/editor has switched "active" on.
export const getPublicCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ active: true })
      .select("_id name slug color parentId featured showcase")
      .sort({ name: 1 });

    // Only ever expose active children — an inactive child shouldn't
    // appear in a public dropdown/showcase even if its parent is active.
    const shaped = await Promise.all(
      categories.map(async (c) => {
        const parent = c.parentId
          ? await Category.findOne({ _id: c.parentId, active: true }).select(
              "_id name slug color"
            )
          : null;

        const children = await Category.find({
          parentId: String(c._id),
          active: true,
        }).select("_id name slug color");

        return {
          id: String(c._id),
          name: c.name,
          slug: c.slug,
          color: c.color ?? "#3b82f6",
          parentId: c.parentId ?? null,
          parent,
          children,
          featured: c.featured,
          inShowcase: c.showcase,
          enabled: true, // query already restricts to active: true
        };
      })
    );

    // Return the full flat list (parents + children). Consumers that only
    // want top-level nav items should filter with `!c.parentId` themselves —
    // e.g. CategoryTemplate looks up a category (which may itself be a
    // child) by slug via this same list, so children must stay included.
    res.json(shaped);
  } catch (error) {
    console.error("getPublicCategories error:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// ─── GET SINGLE ───────────────────────────────────────────────────────────────
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const parent = category.parentId
      ? await Category.findById(category.parentId)
      : null;
    const children = await Category.find({ parentId: id });
    const newsCount = await News.countDocuments({ categoryId: id });

    res.json({
      ...category.toObject(),
      parent,
      children,
      _count: { news: newsCount },
    });
  } catch (error) {
    console.error("getCategoryById error:", error);
    res.status(500).json({ message: "Error fetching category" });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const existing = await Category.findById(id);
    if (!existing)
      return res.status(404).json({ message: "Category not found" });

    const {
      name,
      slug,
      description,
      color,
      featured,
      showcase,
      active,
      parentId,
    } = req.body;

    // Validate new parentId if changing
    if (parentId !== undefined && parentId !== null) {
      const pid = String(parentId);
      if (pid === id)
        return res
          .status(400)
          .json({ message: "A category cannot be its own parent" });
      const parent = await Category.findById(pid);
      if (!parent)
        return res
          .status(400)
          .json({ message: "Parent category not found" });
      if (parent.parentId)
        return res
          .status(400)
          .json({ message: "Cannot nest more than one level deep" });
    }

    let finalSlug = existing.slug;
    if (slug?.trim() || name?.trim()) {
      finalSlug = await buildUniqueSlug(
        slug?.trim() || name?.trim(),
        id
      );
    }

    const updateData: any = { slug: finalSlug };
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color;
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (showcase !== undefined) updateData.showcase = Boolean(showcase);
    if (active !== undefined) updateData.active = Boolean(active);
    if (parentId !== undefined)
      updateData.parentId = parentId ? String(parentId) : null;

    const updated = await Category.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
    });

    const parent = updated?.parentId
      ? await Category.findById(updated.parentId).select("_id name")
      : null;
    const children = await Category.find({ parentId: id }).select(
      "_id name"
    );
    const newsCount = await News.countDocuments({ categoryId: id });

    res.json({
      success: true,
      updated: {
        ...updated?.toObject(),
        parent,
        children,
        _count: { news: newsCount },
      },
    });
  } catch (error) {
    console.error("updateCategory error:", error);
    res.status(500).json({ message: "Error updating category" });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const existing = await Category.findById(id);
    if (!existing)
      return res.status(404).json({ message: "Category not found" });

    const newsCount = await News.countDocuments({ categoryId: id });
    if (newsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${newsCount} article(s) still use this category. Reassign them first.`,
      });
    }

    // Also delete all child categories
    await Category.deleteMany({ parentId: id });
    await Category.findByIdAndDelete(id);

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("deleteCategory error:", error);
    res.status(500).json({ message: "Error deleting category" });
  }
};

// ─── TOGGLE FEATURED ──────────────────────────────────────────────────────────
export const toggleFeatured = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const updated = await Category.findByIdAndUpdate(
      id,
      { featured: !category.featured },
      { returnDocument: 'after' }
    );
    res.json({ success: true, updated });
  } catch (error) {
    console.error("toggleFeatured error:", error);
    res.status(500).json({ message: "Error toggling featured" });
  }
};

// ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────────
export const toggleActive = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const updated = await Category.findByIdAndUpdate(
      id,
      { active: !category.active },
      { returnDocument: 'after' }
    );
    res.json({ success: true, updated });
  } catch (error) {
    console.error("toggleActive error:", error);
    res.status(500).json({ message: "Error toggling active" });
  }
};

// ─── GET CATEGORY NEWS (PUBLIC) ────────────────────────────────────────────────
export const getCategoryNews = async (
  req: Request,
  res: Response
) => {
  try {
    const { slug } = req.params;

    // Find category using slug
    const category = await Category.findOne({
      slug,
      active: true,
    });

    // If category not found
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Find all subcategories
    const childCategories = await Category.find({
      parentId: String(category._id),
      active: true,
    });

    // Combine parent + child category ids
    const allowedCategoryIds = [
      String(category._id),

      ...childCategories.map((c) =>
        String(c._id)
      ),
    ];

    // Fetch all related news
    const rawNews = await News.find({
      categoryId: {
        $in: allowedCategoryIds,
      },

      status: "PUBLISHED",
    }).sort({
      createdAt: -1,
    });

    const news = await Promise.all(
      rawNews.map(async (item) => {

        const newsCategory =
          await Category.findById(
            item.categoryId
          );

        return {
          ...item.toObject(),

          categoryName:
            newsCategory?.name || "News",
        };
      })
    );

    // Send response
    res.json({
      success: true,

      category,

      childCategories,

      totalNews: news.length,

      news,
    });

  } catch (error) {
    console.error(
      "getCategoryNews error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Error fetching category news",
    });
  }
};