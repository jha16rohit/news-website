import { Router } from "express";

import {
  getPublicLiveEvents,
  getPublicLiveEventById,
  getAllLiveEvents,
  createLiveEvent,
  updateLiveEvent,
  deleteLiveEvent,
} from "../controllers/liveEvent.controller";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

const router = Router();

// ─── PUBLIC (unauthenticated) ──────────────────────────────────────────────────
router.get("/public", getPublicLiveEvents);
router.get("/public/:eventId", getPublicLiveEventById);

// ─── ADMIN ─────────────────────────────────────────────────────────────────────
router.get("/", protect, hasPermission("live-events"), getAllLiveEvents);
router.post("/", protect, hasPermission("live-events"), createLiveEvent);
router.put("/:eventId", protect, hasPermission("live-events"), updateLiveEvent);
router.delete("/:eventId", protect, hasPermission("live-events"), deleteLiveEvent);

export default router;