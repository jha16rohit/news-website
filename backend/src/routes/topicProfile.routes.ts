import { Router } from "express";

import {
  createProfile,
  getProfiles,
  updateProfile,
  deleteProfile,
} from "../controllers/topicProfile.controller";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

const router = Router();

// ─── CREATE ────────────────────────────────────────────────────────────────

router.post(
  "/",
  protect,
  hasPermission("topic-profile"),
  createProfile
);

// ─── READ ──────────────────────────────────────────────────────────────────

router.get(
  "/",
  protect,
  hasPermission("topic-profile"),
  getProfiles
);

// ─── UPDATE ────────────────────────────────────────────────────────────────

router.put(
  "/:id",
  protect,
  hasPermission("topic-profile"),
  updateProfile
);

// ─── DELETE ────────────────────────────────────────────────────────────────

router.delete(
  "/:id",
  protect,
  hasPermission("topic-profile"),
  deleteProfile
);

export default router;