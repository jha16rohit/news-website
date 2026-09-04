import { Router } from "express";

import {
  createCategory,
  getAllCategories,
  getPublicCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleFeatured,
  toggleActive,
  getCategoryNews,
} from "../controllers/category.controller";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

const router = Router();

// ─── CREATE ────────────────────────────────────────────────────────────────

router.post(
  "/",
  protect,
  hasPermission("categories"),
  createCategory
);

// ─── PUBLIC (unauthenticated) ───────────────────────────────────────────────
// Used by the public/user-facing site. MUST be declared before the
// "/:id" and "/:slug/news" routes below, or Express will try to match
// "public" as an :id / :slug param first.

router.get(
  "/public",
  getPublicCategories
);

router.get(
  "/public/:slug/news",
  getCategoryNews
);

// ─── READ (ADMIN) ────────────────────────────────────────────────────────────

router.get(
  "/",
  protect,
  getAllCategories
);

router.get(
  "/:slug/news",
  protect,
  hasPermission("categories"),
  getCategoryNews
);

router.get(
  "/:id",
  protect,
  hasPermission("categories"),
  getCategoryById
);

// ─── UPDATE ────────────────────────────────────────────────────────────────

router.put(
  "/:id",
  protect,
  hasPermission("categories"),
  updateCategory
);

// ─── DELETE ────────────────────────────────────────────────────────────────

router.delete(
  "/:id",
  protect,
  hasPermission("categories"),
  deleteCategory
);

// ─── TOGGLES ───────────────────────────────────────────────────────────────

router.patch(
  "/:id/featured",
  protect,
  hasPermission("categories"),
  toggleFeatured
);

router.patch(
  "/:id/active",
  protect,
  hasPermission("categories"),
  toggleActive
);

export default router;