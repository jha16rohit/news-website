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
  // Deduplication key = `${newsId}::${sessionId}::${5s time bucket}`. A UNIQUE
  // index on this field is what actually guarantees "1 real view = 1 row" —
  // it rejects a second insert for the same article+session within the same
  // 5-second window even when two trackPageView requests arrive concurrently
  // (React StrictMode double effects, a client retry, a fast remount, etc).
  // A find-then-create check alone can't prevent this because two near-
  // simultaneous requests can both pass the "does one already exist?" check
  // before either has finished inserting.
  dedupeKey:   string;
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
    dedupeKey: { type: String, required: true },
  },
  { timestamps: true }
);

// Enforces "1 real view = 1 row" at the database level (see comment above).
// sparse: true matters here — documents created before this field existed
// have no dedupeKey at all, and a *non*-sparse unique index treats every
// missing field as the same `null` value, so it fails to build the moment
// there's more than one such legacy document. A failed index build leaves
// Mongoose's command buffer stuck waiting on it, which silently blocks
// every future write to this model — i.e. views stop updating entirely.
// sparse: true tells Mongo to simply skip documents without the field,
// so old data doesn't get in the way and new writes are still protected.
PageViewSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

// Auto-delete raw events after 90 days
PageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const PageView = mongoose.model<IPageView>("PageView", PageViewSchema);
export default PageView;