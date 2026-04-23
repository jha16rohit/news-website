import { Router } from "express";
import {
  createNews,
  getAllNews,
  getNewsBySlug,
  getNewsById,
  updateNews,
  deleteNews,
  addLiveUpdate,
} from "../controllers/news.controller";

const router = Router();

// Public
router.get("/", getAllNews);
router.get("/id/:id", getNewsById);

// Admin
router.post("/create", createNews);
router.put("/:id", updateNews);
router.delete("/:id", deleteNews);

// Live updates
router.post("/:id/live-update", addLiveUpdate);

// ⚠️ ALWAYS KEEP THIS LAST
router.get("/:slug", getNewsBySlug);
export default router;