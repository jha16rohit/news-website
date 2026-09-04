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

// ─── READ ──────────────────────────────────────────────────────────────────

router.get(
  "/",
  protect,
  getAllTags
);

router.get(
  "/trending",
  protect,
  getTrendingTags
);

// ─── TRENDING ───────────────────────────────────────────────────────────────

router.patch(
  "/:id/trending",
  protect,
  hasPermission("tags"),
  setTagTrending
);

// ─── DELETE ────────────────────────────────────────────────────────────────

router.delete(
  "/:id",
  protect,
  hasPermission("tags"),
  deleteTag
);

export default router;