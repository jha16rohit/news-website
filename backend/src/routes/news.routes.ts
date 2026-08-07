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
} from "../controllers/news.controller";

import { uploadToCloudinary } from "../middleware/Upload.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// ─── Media Library ──────────────────────────────────────────────
router.get("/media-library", getMediaLibrary);
router.delete("/media-library/:newsId", protect, deleteMediaImage);
router.patch(
  "/media-library/:newsId/upload",
  protect,
  uploadToCloudinary,
  uploadMediaImage
);

// ─── Specific named GET routes (MUST be before /:id and /:slug) ─
router.get("/tags-in-use",     getTagsInPublishedNews);
router.get("/published",       getPublishedNews);
router.get("/recent",          getRecentNews);
router.get("/breaking-ticker", getBreakingTickerNews);
router.get("/trending-news",   getTrendingNews);
router.get("/tag/:slug",       getNewsByTag);
router.get("/topic/:slug",     getNewsByTopicSlug);

// ─── Root list ──────────────────────────────────────────────────
router.get("/", getAllNews);

// ─── Create ─────────────────────────────────────────────────────
router.post("/create", uploadToCloudinary, createNews);

router.post(
  "/:newsId/live-update/:updateId/vote",
  voteOnPoll
);

// ─── Admin mutations ────────────────────────────────────────────
router.put("/:id",              protect, uploadToCloudinary, updateNews);
router.delete("/:id",           protect, deleteNews);
router.patch("/:id/pause-toggle", protect, togglePauseBreaking);
router.post("/:id/live-update",   protect, addLiveUpdate);

// ─── Purge ──────────────────────────────────────────────────────
router.delete("/admin/purge-deleted", protect, purgeDeletedNews);

// ─── ID lookup (for ArticleDetail page) ─────────────────────────
// This catches MongoDB ObjectIds like 6a1c0e0d4629d6c68ebd1c1c
// and slug strings — checks format to route correctly
// ─── ID lookup (for ArticleDetail page) ─────────────────────────
router.get("/:id", (req, res, next) => {
  const { id } = req.params;
  // MongoDB ObjectId is exactly 24 hex characters
  if (/^[a-f\d]{24}$/i.test(id)) {
    return getNewsById(req, res);
  }
  // Otherwise treat as slug
  return getNewsBySlug(req, res);
});
export default router;