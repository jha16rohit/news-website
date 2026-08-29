// server/src/controllers/notification.controller.ts

import { Request, Response } from "express";
import Notification from "../models/Notification";

export async function getNotifications(req: Request, res: Response) {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).limit(100).lean(),
      Notification.countDocuments({ unread: true }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  try {
    await Notification.updateMany({ unread: true }, { unread: false });
    res.json({ ok: true });
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    res.status(500).json({ message: "Error marking notifications read" });
  }
}