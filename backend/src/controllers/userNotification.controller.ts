// server/src/controllers/userNotification.controller.ts

import { Response } from "express";
import { SiteUserRequest } from "../middleware/Siteuserauth.middleware";
import UserNotification from "../models/UserNotification";

// ══════════════════════════════════════════════════════════════
//  GET /api/user-notifications   (protectSiteUser)
//  Returns broadcasts + anything addressed to me, newest first,
//  each flagged with whether *I* have read it.
// ══════════════════════════════════════════════════════════════
export const getMyNotifications = async (req: SiteUserRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated." });

    const docs = await UserNotification.find({
      $or: [{ userId: null }, { userId }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const notifications = docs.map((n) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      createdAt: n.createdAt,
      read: n.readBy.includes(userId),
    }));

    const unreadCount = notifications.filter((n) => !n.read).length;

    return res.json({ notifications, unreadCount });
  } catch (err: any) {
    console.error("getMyNotifications error:", err);
    return res.status(500).json({ message: err.message || "Error fetching notifications." });
  }
};

// ══════════════════════════════════════════════════════════════
//  POST /api/user-notifications/:id/read   (protectSiteUser)
// ══════════════════════════════════════════════════════════════
export const markNotificationRead = async (req: SiteUserRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated." });

    await UserNotification.updateOne(
      { _id: req.params.id },
      { $addToSet: { readBy: userId } }
    );
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("markNotificationRead error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
//  POST /api/user-notifications/mark-all-read   (protectSiteUser)
// ══════════════════════════════════════════════════════════════
export const markAllNotificationsRead = async (req: SiteUserRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated." });

    await UserNotification.updateMany(
      { $or: [{ userId: null }, { userId }] },
      { $addToSet: { readBy: userId } }
    );
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("markAllNotificationsRead error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════
//  Helper functions — NOT route handlers. Called from other
//  controllers at the moment the underlying event happens.
// ══════════════════════════════════════════════════════════════

/** Broadcast to every site user when a new article is published. */
export async function notifyUsersOfNewArticle(article: {
  headline: string;
  slug: string;
}): Promise<void> {
  await UserNotification.create({
    type: "new_article",
    title: "📰 New story published",
    message: article.headline,
    link: `/article/${article.slug}`,
    userId: null,
  });
}

/** Personal notification for the user whose comment just got a reply. */
export async function notifyUserOfCommentReply(params: {
  recipientUserId: string;
  replierName: string;
  newsSlug: string;
  commentId: string;
}): Promise<void> {
  // Don't notify someone that they replied to themselves.
  await UserNotification.create({
    type: "comment_reply",
    title: "💬 New reply to your comment",
    message: `${params.replierName} replied to your comment.`,
    link: `/article/${params.newsSlug}?comment=${params.commentId}`,
    userId: params.recipientUserId,
  });
}

/** Personal notification when admin responds to a user's advertisement inquiry. */
export async function notifyUserOfAdResponse(params: {
  recipientUserId: string;
  status: "approved" | "rejected" | "published";
  adInquiryId: string;
}): Promise<void> {
  const statusText =
    params.status === "approved" || params.status === "published"
      ? "approved"
      : "responded to";

  await UserNotification.create({
    type: "ad_response",
    title: "📢 Update on your advertisement request",
    message: `Your advertisement inquiry has been ${statusText}.`,
    link: `/profile?tab=advertisements&inquiry=${params.adInquiryId}`,
    userId: params.recipientUserId,
  });
}