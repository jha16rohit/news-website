// backend/src/routes/notification.routes.ts

import { Router } from "express";
import {
  getNotifications,
  markAllNotificationsRead,
} from "../controllers/notification.controller";
import { protect, isAdmin } from "../middleware/auth.middleware";

const notificationRouter = Router();

// Protect all notification routes
notificationRouter.use(protect, isAdmin);

// GET /api/notifications
notificationRouter.get("/", getNotifications);

// POST /api/notifications/mark-all-read
notificationRouter.post("/mark-all-read", markAllNotificationsRead);

export default notificationRouter;