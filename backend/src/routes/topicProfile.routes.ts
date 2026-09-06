import { Router } from "express";

import {
  createProfile,
  getProfiles,
  getPublicProfiles,
  updateProfile,
  deleteProfile,
} from "../controllers/topicProfile.controller";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

const router = Router();

// ─── PUBLIC (USER-SIDE) ──────────────────────────────────────────────────────
// No auth — this is what the public website should call.
router.get("/public", getPublicProfiles);

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