import express from "express";
import {
  createTag,
  getAllTags,
  getTrendingTags,
  deleteTag
} from "../controllers/tags.controller";

const router = express.Router();

router.post("/", createTag);
router.get("/", getAllTags);
router.get("/trending", getTrendingTags);
router.delete("/:id", deleteTag);

export default router;