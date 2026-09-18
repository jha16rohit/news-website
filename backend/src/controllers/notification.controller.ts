// server/src/controllers/notification.controller.ts

import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import Notification from "../models/Notification";

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const {
      tab,
      unreadOnly,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query: any = { isDeleted: false };

    if (tab && tab !== "All") {
      query.tab = tab;
    }

    if (unreadOnly === "true") {
      query.readBy = { $ne: userId };
    }

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ isDeleted: false, readBy: { $ne: userId } }),
    ]);

    const notificationsWithReadState = notifications.map((n) => ({
      ...n,
      unread: !n.readBy.includes(userId),
    }));

    res.json({
      notifications: notificationsWithReadState,
      unreadCount,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    await Notification.updateMany(
      { isDeleted: false, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    res.json({ ok: true });
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    res.status(500).json({ message: "Error marking notifications read" });
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;
    await Notification.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: userId } },
      { new: true }
    );
    res.json({ ok: true });
  } catch (error) {
    console.error("markNotificationRead error:", error);
    res.status(500).json({ message: "Error marking notification read" });
  }
}

export async function markNotificationUnread(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;
    await Notification.findByIdAndUpdate(
      id,
      { $pull: { readBy: userId } },
      { new: true }
    );
    res.json({ ok: true });
  } catch (error) {
    console.error("markNotificationUnread error:", error);
    res.status(500).json({ message: "Error marking notification unread" });
  }
}

export async function deleteNotification(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;
    await Notification.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    res.json({ ok: true });
  } catch (error) {
    console.error("deleteNotification error:", error);
    res.status(500).json({ message: "Error deleting notification" });
  }
}