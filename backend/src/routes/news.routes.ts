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

// ✅ NEW RECENT NEWS ROUTE
router.get(
  "/recent",
  getRecentNews
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

// ⚠️ KEEP THIS LAST
router.get(
  "/:slug",
  getNewsBySlug
);

export default router;