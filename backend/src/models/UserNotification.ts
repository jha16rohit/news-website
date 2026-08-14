// server/src/models/UserNotification.ts
//
// Site-visitor-facing notifications (bell icon in UserNavbar). This is
// intentionally separate from models/Notification.ts, which powers the
// ADMIN dashboard feed and is unrelated to what end users see.
//
// - userId: null      → broadcast to every logged-in site user (e.g. "new article")
// - userId: "<id>"     → personal, only that user should ever see it
//                        (e.g. "your comment got a reply", "someone liked your comment",
//                        "your ad request was answered")
// - readBy: tracks which userIds have read this notification. For personal
//   notifications this will only ever contain the one recipient; for
//   broadcasts it can contain many.

import mongoose, { Document, Schema } from "mongoose";

export type UserNotificationType =
  | "new_article"
  | "comment_reply"
  | "comment_like"
  | "ad_response";

export interface IUserNotification extends Document {
  type: UserNotificationType;
  title: string;
  message: string;
  link: string;           // frontend route to navigate to on click, e.g. "/article/some-slug"
  userId: string | null;  // null = broadcast to all site users
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserNotificationSchema = new Schema<IUserNotification>(
  {
    type: {
      type: String,
      enum: ["new_article", "comment_reply", "comment_like", "ad_response"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, required: true },
    userId: { type: String, default: null, index: true },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Fast lookup of "my feed": broadcasts + anything addressed to me, newest first.
UserNotificationSchema.index({ userId: 1, createdAt: -1 });

const UserNotification = mongoose.model<IUserNotification>(
  "UserNotification",
  UserNotificationSchema
);

export default UserNotification;