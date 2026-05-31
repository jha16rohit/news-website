import { Router } from "express";

import {
  createNews,
  getAllNews,
  getNewsBySlug,
  getNewsById,
  updateNews,
  deleteNews,
  purgeDeletedNews,
  addLiveUpdate,
  togglePauseBreaking,
  getMediaLibrary,
  deleteMediaImage,
  getTagsInPublishedNews,
  getPublishedNews,
  getRecentNews,
  getBreakingTickerNews,
  getTrendingNews,
  getNewsByTag,
  getNewsByTopicSlug,
} from "../controllers/news.controller";

import { uploadToSupabase } from "../middleware/Upload.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// ─── Media Library ────────────────────────────────────────────────
router.get(
  "/media-library",
  getMediaLibrary
);

router.delete(
  "/media-library/:newsId",
  protect,
  deleteMediaImage
);

// ─── Public reads ────────────────────────────────────────────────
router.get(
  "/",
  getAllNews
);

router.get(
  "/id/:id",
  getNewsById
);

router.get(
  "/tags-in-use",
  getTagsInPublishedNews
);

router.get(
  "/published",
  getPublishedNews
);

router.get(
  "/recent",
  getRecentNews
);

router.get(
  "/breaking-ticker",
  getBreakingTickerNews
);

// ✅ NEW TAG ROUTE
router.get(
  "/tag/:slug",
  getNewsByTag
);
router.get(
  "/topic/:slug",
  getNewsByTopicSlug
);
// ─── Create ──────────────────────────────────────────────────────
router.post(
  "/create",
  uploadToSupabase,
  createNews
);

// ─── Admin mutations ─────────────────────────────────────────────
router.put(
  "/:id",
  protect,
  updateNews
);

router.delete(
  "/:id",
  protect,
  deleteNews
);

router.patch(
  "/:id/pause-toggle",
  protect,
  togglePauseBreaking
);

router.post(
  "/:id/live-update",
  protect,
  addLiveUpdate
);

// ─── Purge scheduler ─────────────────────────────────────────────
router.delete(
  "/admin/purge-deleted",
  protect,
  purgeDeletedNews
);

router.get(
  "/trending-news",
  getTrendingNews
);

// ⚠️ KEEP THIS LAST
router.get(
  "/:slug",
  getNewsBySlug
);

export default router;