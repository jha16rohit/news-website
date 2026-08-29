import { Router } from "express";
import {
  createProfile,
  getProfiles,
  updateProfile,
  deleteProfile,
} from "../controllers/topicProfile.controller";

const router = Router();

router.post("/", createProfile);
router.get("/", getProfiles);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);

export default router;