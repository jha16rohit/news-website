// server/src/models/PageView.ts
// ─────────────────────────────────────────────
// Raw page view events. Used to:
//  1. Increment Analytics daily buckets (via a lightweight upsert)
//  2. Power the real-time live-visitor count via Socket.IO
//
// TTL index removes events after 90 days to keep the collection lean.

import mongoose, { Document, Schema } from "mongoose";

export type TrafficSource = "direct" | "google" | "social" | "other";

export interface IPageView extends Document {
  newsId:      string;           // article _id
  visitorId:   string;           // hashed IP + UA (never store raw IP)
  source:      TrafficSource;
  readTime?:   number;           // active seconds on page (sent on exit/visibility change)
  sessionId:   string;           // random UUID per browser tab session
  viewId:      string;           // unique per visit: sessionId_timestamp — used by trackReadTime
  createdAt:   Date;
}

const PageViewSchema = new Schema<IPageView>(
  {
    newsId:    { type: String, required: true, index: true },
    visitorId: { type: String, required: true, index: true },
    source:    { type: String, enum: ["direct", "google", "social", "other"], default: "direct" },
    readTime:  { type: Number, default: null },
    sessionId: { type: String, required: true },
    viewId:    { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Auto-delete raw events after 90 days
PageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const PageView = mongoose.model<IPageView>("PageView", PageViewSchema);
export default PageView;