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
  voteOnPoll,
  togglePauseBreaking,
  getMediaLibrary,
  deleteMediaImage,
  uploadMediaImage,
  getTagsInPublishedNews,
  getPublishedNews,
  getRecentNews,
  getBreakingTickerNews,
  getTrendingNews,
  getNewsByTag,
  getNewsByTopicSlug,

  // ─── Homepage / Ordering ──────────────────────────────────────
  reorderNews,
  toggleHomepagePin,
  getHomepageNews,
} from "../controllers/news.controller";

import { uploadToCloudinary } from "../middleware/Upload.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// ─── Media Library ──────────────────────────────────────────────

router.get("/media-library", getMediaLibrary);

router.delete(
  "/media-library/:newsId",
  protect,
  deleteMediaImage
);

router.patch(
  "/media-library/:newsId/upload",
  protect,
  uploadToCloudinary,
  uploadMediaImage
);

// ─── Specific named GET routes ──────────────────────────────────
// MUST be before /:id and /:slug

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

router.get(
  "/trending-news",
  getTrendingNews
);

router.get(
  "/tag/:slug",
  getNewsByTag
);

router.get(
  "/topic/:slug",
  getNewsByTopicSlug
);

// ─── Homepage ───────────────────────────────────────────────────
// Returns maximum 5 pinned published articles

router.get(
  "/homepage",
  getHomepageNews
);

// ─── Root list ──────────────────────────────────────────────────
// PUBLIC — published articles only

router.get(
  "/",
  getPublishedNews
);

// ─── Admin list ─────────────────────────────────────────────────
// PROTECTED — every status

router.get(
  "/admin/all",
  protect,
  getAllNews
);

// ─── Create ─────────────────────────────────────────────────────

router.post(
  "/create",
  uploadToCloudinary,
  createNews
);

router.post(
  "/:newsId/live-update/:updateId/vote",
  voteOnPoll
);

// ─── Admin mutations ────────────────────────────────────────────

// Save drag-and-drop article order
router.put(
  "/reorder",
  protect,
  reorderNews
);

// Pin / unpin article from homepage
router.put(
  "/:id/homepage-pin",
  protect,
  toggleHomepagePin
);

// Normal article update
router.put(
  "/:id",
  protect,
  uploadToCloudinary,
  updateNews
);

// Delete article
router.delete(
  "/:id",
  protect,
  deleteNews
);

// Pause / resume breaking news
router.patch(
  "/:id/pause-toggle",
  protect,
  togglePauseBreaking
);

// Add live update
router.post(
  "/:id/live-update",
  protect,
  addLiveUpdate
);

// ─── Purge ──────────────────────────────────────────────────────

router.delete(
  "/admin/purge-deleted",
  protect,
  purgeDeletedNews
);

// ─── ID lookup (for ArticleDetail page) ─────────────────────────
// This catches MongoDB ObjectIds and slug strings.

router.get(
  "/:id",
  (req, res, next) => {
    const { id } = req.params;

    // MongoDB ObjectId is exactly 24 hex characters
    if (/^[a-f\d]{24}$/i.test(id)) {
      return getNewsById(req, res);
    }

    // Otherwise treat as slug
    return getNewsBySlug(req, res);
  }
);

export default router;