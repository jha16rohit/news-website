import express from "express";
import {
  createTag,
  getAllTags,
  getTrendingTags,
  setTagTrending,
  deleteTag,
} from "../controllers/tags.controller";

const router = express.Router();

router.post("/",                  createTag);
router.get("/",                   getAllTags);
router.get("/trending",           getTrendingTags);
router.patch("/:id/trending",     setTagTrending);   // ← NEW: set/unset trending from admin
router.delete("/:id",             deleteTag);

export default router;