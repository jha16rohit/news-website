import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleFeatured,
  toggleActive,
} from "../controllers/category.controller";

const router = Router();

// ─── CREATE ────────────────────────────────────────────────────────────────
router.post("/", createCategory);

// ─── READ ──────────────────────────────────────────────────────────────────
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// ─── UPDATE ────────────────────────────────────────────────────────────────
router.put("/:id", updateCategory);

// ─── DELETE ────────────────────────────────────────────────────────────────
router.delete("/:id", deleteCategory);

// ─── TOGGLES (for your UI switches) ────────────────────────────────────────
router.patch("/:id/featured", toggleFeatured);
router.patch("/:id/active", toggleActive);

export default router;