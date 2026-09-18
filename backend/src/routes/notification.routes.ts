// backend/src/routes/notification.routes.ts

import { Router } from "express";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  deleteNotification,
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

// PATCH /api/notifications/:id/read
notificationRouter.patch(
  "/:id/read",
  markNotificationRead
);

// PATCH /api/notifications/:id/unread
notificationRouter.patch(
  "/:id/unread",
  markNotificationUnread
);

// DELETE /api/notifications/:id (soft delete)
notificationRouter.delete(
  "/:id",
  deleteNotification
);

export default notificationRouter;