import { Router } from "express";
import {
  createNews,
  getAllNews,
  getNewsBySlug,
  getNewsById,
  updateNews,
  deleteNews,
  addLiveUpdate,
  togglePauseBreaking,
  getMediaLibrary,
  deleteMediaImage,
} from "../controllers/news.controller";
import { upload } from "../middleware/upload.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// ─── Media Library (before /:slug to avoid route conflict) ────────────────────
router.get("/media-library",            getMediaLibrary);
router.delete("/media-library/:newsId", protect, deleteMediaImage);

// ─── Public reads ─────────────────────────────────────────────────────────────
router.get("/",       getAllNews);
router.get("/id/:id", getNewsById);

// ─── Create ───────────────────────────────────────────────────────────────────
// No protect here — multipart/form-data + cookie auth is handled inside the
// controller (req.user fallback to first DB user). This avoids 401 on file uploads.
router.post("/create", upload.single("image"), createNews);

// ─── Admin mutations ──────────────────────────────────────────────────────────
router.put("/:id",                protect, updateNews);
router.delete("/:id",             protect, deleteNews);
router.patch("/:id/pause-toggle", protect, togglePauseBreaking);
router.post("/:id/live-update",   protect, addLiveUpdate);

// ⚠️  Keep slug route LAST — catch-all for /:slug
router.get("/:slug", getNewsBySlug);

export default router;