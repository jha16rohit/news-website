// backend/src/routes/notification.routes.ts

import { Router } from "express";

import {
  getNotifications,
  markAllNotificationsRead,
} from "../controllers/notification.controller";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

const notificationRouter = Router();

// ─── Protected Admin-panel notification routes ────────────────────────────────

notificationRouter.use(
  protect,
  hasPermission("notification")
);

// GET /api/notifications
notificationRouter.get(
  "/",
  getNotifications
);

// POST /api/notifications/mark-all-read
notificationRouter.post(
  "/mark-all-read",
  markAllNotificationsRead
);

export default notificationRouter;