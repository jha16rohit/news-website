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
import { uploadToSupabase } from "../middleware/upload.middleware"; // ← replaces upload.single("image")
import { protect }          from "../middleware/auth.middleware";

const router = Router();

// ─── Media Library ────────────────────────────────────────────────────────────
router.get("/media-library",            getMediaLibrary);
router.delete("/media-library/:newsId", protect, deleteMediaImage);

// ─── Public reads ─────────────────────────────────────────────────────────────
router.get("/",       getAllNews);
router.get("/id/:id", getNewsById);

// ─── Create ───────────────────────────────────────────────────────────────────
// uploadToSupabase is an array [multerMiddleware, supabaseUploadMiddleware]
// Express spreads arrays automatically when passed as route handlers.
router.post("/create", uploadToSupabase, createNews);

// ─── Admin mutations ──────────────────────────────────────────────────────────
router.put("/:id",                protect, updateNews);
router.delete("/:id",             protect, deleteNews);
router.patch("/:id/pause-toggle", protect, togglePauseBreaking);
router.post("/:id/live-update",   protect, addLiveUpdate);

// ⚠️  Keep slug route LAST — catch-all for /:slug
router.get("/:slug", getNewsBySlug);

export default router;