// backend/src/models/Analytics.ts
// ─────────────────────────────────────────────
// Stores daily aggregated analytics per article + site-wide totals.
// One document per (newsId OR "SITE") per calendar day.

import mongoose, { Document, Schema } from "mongoose";

export interface IAnalytics extends Document {
  newsId:        string;          // article _id  OR  "SITE" for global daily totals
  date:          Date;            // midnight UTC of the day (YYYY-MM-DD 00:00:00)
  views:         number;          // total page views that day
  uniqueVisitors: number;         // approx unique visitors (by fingerprint/IP hash)
  totalReadTime: number;          // sum of all read-times in seconds
  readSessions:  number;          // how many sessions contributed a read-time
  avgReadTime:   number;          // derived: totalReadTime / readSessions (seconds)
  sources: {
    direct:  number;
    google:  number;
    social:  number;
    other:   number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    newsId: { type: String, required: true, index: true },
    date:   { type: Date,   required: true, index: true },

    views:          { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    totalReadTime:  { type: Number, default: 0 },
    readSessions:   { type: Number, default: 0 },
    avgReadTime:    { type: Number, default: 0 },

    sources: {
      direct: { type: Number, default: 0 },
      google: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      other:  { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// One record per article per day
AnalyticsSchema.index({ newsId: 1, date: 1 }, { unique: true });

const Analytics = mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);
export default Analytics;