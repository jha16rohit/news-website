// server/src/models/Notification.ts
//
// Notifications are NOT written directly by other controllers (News/Comment
// creation isn't touched). Instead notificationsocket.ts periodically scans
// News/Comment/PageView for notification-worthy conditions and upserts here,
// using `dedupeKey` so the same event never creates a second row.

import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "breaking"
  | "comment"
  | "scheduled"
  | "trending"
  | "flagged"
  | "published"
  | "reminder"
  | "traffic";

export type NotificationTab = "Breaking" | "Comments" | "Scheduled" | "Trending";

export interface INotification extends Document {
  type: NotificationType;
  tab: NotificationTab;
  title: string;
  description: string;
  dedupeKey: string;   // stable per-event key, e.g. "breaking-pending-<newsId>"
  unread: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: { type: String, required: true },
    tab: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    dedupeKey: { type: String, required: true, unique: true },
    unread: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
export default Notification;