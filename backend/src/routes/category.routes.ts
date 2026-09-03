import { Router } from "express";

import {
  createCategory,
  getAllCategories,
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

// ─── READ ──────────────────────────────────────────────────────────────────

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