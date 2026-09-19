import express from "express";

import {
  createTag,
  getAllTags,
  getTrendingTags,
  setTagTrending,
  deleteTag,
} from "../controllers/tags.controller";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

const router = express.Router();

// ─── CREATE ────────────────────────────────────────────────────────────────

router.post(
  "/",
  protect,
  hasPermission("tags"),
  createTag
);

// ─── PUBLIC (unauthenticated) ───────────────────────────────────────────────
// Used by the public site (HomeHero trending strip, UserFooter trending
// topics). No `protect` here on purpose — getTrendingTags has no auth logic
// in the controller, it was only ever meant to be public, same pattern as
// category.controller's getPublicCategories.

router.get(
  "/trending",
  getTrendingTags
);

// ─── READ (ADMIN) ────────────────────────────────────────────────────────────

router.get(
  "/",
  protect,
  getAllTags
);

// ─── TRENDING (ADMIN TOGGLE) ─────────────────────────────────────────────────

router.patch(
  "/:id/trending",
  protect,
  hasPermission("tags"),
  setTagTrending
);

// ─── DELETE ───────────────────────────────────────────────────────────────

router.delete(
  "/:id",
  protect,
  hasPermission("tags"),
  deleteTag
);

export default router;