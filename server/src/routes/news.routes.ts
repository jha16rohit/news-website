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
} from "../controllers/news.controller";

const router = Router();

// ─── Public ────────────────────────────────────────────────────────────────────
router.get("/",        getAllNews);
router.get("/id/:id",  getNewsById);

// ─── Admin ─────────────────────────────────────────────────────────────────────
router.post("/create",              createNews);
router.put("/:id",                  updateNews);
router.delete("/:id",               deleteNews);
router.patch("/:id/pause-toggle",   togglePauseBreaking);
router.post("/:id/live-update",     addLiveUpdate);

// ⚠️  Keep slug route LAST — it is a catch-all for /:slug
router.get("/:slug", getNewsBySlug);

export default router;