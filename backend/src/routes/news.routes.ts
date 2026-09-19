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
  getBreakingNewsHistory,
  removeBreakingStatus,
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
import {
  protect,
  isAdmin,
  hasPermission,
} from "../middleware/auth.middleware";

const router = Router();

// ─── Media Library ──────────────────────────────────────────────

router.get(
  "/media-library",
  protect,
  hasPermission("media-library"),
  getMediaLibrary
);

router.delete(
  "/media-library/:newsId",
  protect,
  hasPermission("media-library"),
  deleteMediaImage
);

router.patch(
  "/media-library/:newsId/upload",
  protect,
  hasPermission("media-library"),
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
  protect,
  hasPermission("create-news"),
  uploadToCloudinary,
  createNews
);

router.post(
  "/:newsId/live-update/:updateId/vote",
  voteOnPoll
);

// ─── Breaking News history / admin actions ─────────────────────

router.get(
  "/breaking-history",
  protect,
  hasPermission("breaking-news"),
  getBreakingNewsHistory
);

// ─── Admin mutations ────────────────────────────────────────────

// Save drag-and-drop article order
router.put(
  "/reorder",
  protect,
  hasPermission("news"),
  reorderNews
);

// Pin / unpin article from homepage
router.put(
  "/:id/homepage-pin",
  protect,
  hasPermission("news"),
  toggleHomepagePin
);

// Normal article update
router.put(
  "/:id",
  protect,
  hasPermission("news"),
  uploadToCloudinary,
  updateNews
);

// Delete article
router.delete(
  "/:id",
  protect,
  hasPermission("news"),
  deleteNews
);

// Pause / resume Breaking News
router.patch(
  "/:id/pause-toggle",
  protect,
  hasPermission("breaking-news"),
  togglePauseBreaking
);

// Remove Breaking status — Admin: any article; Editor: own article only.
router.patch(
  "/:id/remove-breaking",
  protect,
  hasPermission("breaking-news"),
  removeBreakingStatus
);

// Add live update
router.post(
  "/:id/live-update",
  protect,
  hasPermission("live-news"),
  addLiveUpdate
);

// ─── Purge ──────────────────────────────────────────────────────

router.delete(
  "/admin/purge-deleted",
  protect,
  isAdmin,
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