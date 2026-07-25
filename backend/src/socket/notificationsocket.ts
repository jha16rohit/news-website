// server/src/socket/notificationsocket.ts
//
// Referenced in server.ts as `initNotificationSocket(io)` — add this call
// alongside the existing `initAnalyticsSocket(io)` call.
//
// Admin dashboard clients join the "admin-notifications" room and receive
// a push the moment a new notification-worthy event is detected.
//
// There are no direct hooks into News/Comment creation, so instead this
// periodically SCANS for conditions (pending breaking news, new scheduled
// articles, flagged/pending comments, view spikes) and upserts a
// Notification row keyed by `dedupeKey` — the upsert is a no-op if that
// exact event was already recorded, so nothing is ever double-created.
// Only genuinely new rows get broadcast.

import { Server as SocketServer, Socket } from "socket.io";
import News from "../models/News";
import Comment from "../models/Comment";
import PageView from "../models/Pageview";
import Notification, { NotificationType, NotificationTab } from "../models/Notification";

const ADMIN_ROOM = "admin-notifications";
const POLL_INTERVAL_MS = 30_000;

// Tunable thresholds — picked conservatively since real traffic volume
// varies by site. Adjust these to match your actual traffic if the
// trending/spike notifications fire too often or too rarely.
const TRENDING_MIN_VIEWS_PER_HOUR = 50;
const TRENDING_MIN_JUMP_MULTIPLIER = 1.5; // must be 1.5x the prior hour
const TRAFFIC_SPIKE_MIN_PCT = 100; // site-wide views must at least double hour-over-hour

let ioRef: SocketServer | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function formatCount(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1000) return (v / 1000).toFixed(1) + "K";
  return String(v);
}

function formatTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

interface Candidate {
  type: NotificationType;
  tab: NotificationTab;
  title: string;
  description: string;
  dedupeKey: string;
}

/**
 * Insert a notification if (and only if) `dedupeKey` hasn't been seen before.
 * Returns the doc if it was newly created, or null if it already existed.
 */
async function tryCreate(c: Candidate) {
  // Already exists?
  const existing = await Notification.findOne({
    dedupeKey: c.dedupeKey,
  });

  if (existing) {
    return null;
  }

  const created = await Notification.create({
    ...c,
    unread: true,
  });

  return created;
}

async function broadcast(doc: any) {
  if (!ioRef || !doc) return;
  ioRef.to(ADMIN_ROOM).emit("notifications:new", doc);
}

async function scanBreakingNews() {
  const [pending, published] = await Promise.all([
    News.find({ articleType: "BREAKING", status: "DRAFT" })
      .select("_id headline").limit(50).lean(),
    News.find({ articleType: "BREAKING", status: "PUBLISHED" })
      .select("_id headline").sort({ publishedAt: -1 }).limit(20).lean(),
  ]);

  for (const n of pending) {
    const created = await tryCreate({
      type: "breaking", tab: "Breaking",
      title: "Breaking News Pending",
      description: `"${n.headline}" is waiting for your approval before going live.`,
      dedupeKey: `breaking-pending-${n._id}`,
    });
    await broadcast(created);
  }

  for (const n of published) {
    const created = await tryCreate({
      type: "published", tab: "Breaking",
      title: "Breaking Published",
      description: `"${n.headline}" has been published as breaking news.`,
      dedupeKey: `breaking-published-${n._id}`,
    });
    await broadcast(created);
  }
}

async function scanScheduledNews() {
  const scheduled = await News.find({ status: "SCHEDULED", scheduledAt: { $ne: null } })
    .select("_id headline scheduledAt").limit(100).lean();

  for (const n of scheduled) {
    if (!n.scheduledAt) continue;

    const created = await tryCreate({
      type: "scheduled", tab: "Scheduled",
      title: "Article Scheduled",
      description: `"${n.headline}" is scheduled to publish at ${formatTime(n.scheduledAt)}.`,
      dedupeKey: `scheduled-${n._id}`,
    });
    await broadcast(created);

    const hoursUntil = (n.scheduledAt.getTime() - Date.now()) / 3_600_000;
    if (hoursUntil > 0 && hoursUntil <= 24) {
      const reminder = await tryCreate({
        type: "reminder", tab: "Scheduled",
        title: "Publish Reminder",
        description: `"${n.headline}" will auto-publish at ${formatTime(n.scheduledAt)}.`,
        dedupeKey: `reminder-${n._id}`,
      });
      await broadcast(reminder);
    }
  }
}

async function scanComments() {
  const [pendingByArticle, flagged] = await Promise.all([
    Comment.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: "$newsId", count: { $sum: 1 } } },
    ]),
    Comment.find({ "reportedBy.0": { $exists: true } })
      .select("_id newsId").limit(50).lean(),
  ]);

  const newsIds = [
    ...pendingByArticle.map((r) => r._id),
    ...flagged.map((c) => c.newsId),
  ];
  const newsDocs = await News.find({ _id: { $in: newsIds } }).select("headline").lean();
  const titleMap = Object.fromEntries(newsDocs.map((n: any) => [String(n._id), n.headline]));

  for (const row of pendingByArticle) {
    const title = titleMap[row._id] ?? "an article";
    const created = await tryCreate({
      type: "comment", tab: "Comments",
      title: "New Comments",
      // dedupeKey includes the count so the notification re-fires as the
      // moderation queue grows for that article, not just on the first comment.
      description: `${row.count} new comment${row.count === 1 ? "" : "s"} on "${title}" need moderation.`,
      dedupeKey: `comment-pending-${row._id}-${row.count}`,
    });
    await broadcast(created);
  }

  for (const c of flagged) {
    const title = titleMap[c.newsId] ?? "an article";
    const created = await tryCreate({
      type: "flagged", tab: "Comments",
      title: "Comment Flagged",
      description: `A comment on "${title}" has been flagged for review.`,
      dedupeKey: `flagged-${c._id}`,
    });
    await broadcast(created);
  }
}

async function scanTrafficAndTrending() {
  const now = Date.now();
  const oneHourAgo = new Date(now - 3_600_000);
  const twoHoursAgo = new Date(now - 7_200_000);

  const [currentHourRows, prevHourRows] = await Promise.all([
    PageView.aggregate([
      { $match: { createdAt: { $gte: oneHourAgo } } },
      { $group: { _id: "$newsId", views: { $sum: 1 } } },
    ]),
    PageView.aggregate([
      { $match: { createdAt: { $gte: twoHoursAgo, $lt: oneHourAgo } } },
      { $group: { _id: "$newsId", views: { $sum: 1 } } },
    ]),
  ]);

  const prevMap = Object.fromEntries(prevHourRows.map((r) => [r._id, r.views]));
  const hourKey = oneHourAgo.toISOString().slice(0, 13); // "YYYY-MM-DDTHH", one bucket per hour

  // ── Per-article trending ──
  const candidateIds = currentHourRows
    .filter((r) => r.views >= TRENDING_MIN_VIEWS_PER_HOUR)
    .map((r) => r._id);
  const newsDocs = candidateIds.length
    ? await News.find({ _id: { $in: candidateIds } }).select("headline").lean()
    : [];
  const titleMap = Object.fromEntries(newsDocs.map((n: any) => [String(n._id), n.headline]));

  for (const row of currentHourRows) {
    if (row.views < TRENDING_MIN_VIEWS_PER_HOUR) continue;
    const prev = prevMap[row._id] ?? 0;
    if (prev > 0 && row.views < prev * TRENDING_MIN_JUMP_MULTIPLIER) continue;

    const title = titleMap[row._id] ?? "An article";
    const created = await tryCreate({
      type: "trending", tab: "Trending",
      title: "Article Trending",
      description: `"${title}" is trending with ${formatCount(row.views)} views in the last hour.`,
      dedupeKey: `trending-${row._id}-${hourKey}`,
    });
    await broadcast(created);
  }

  // ── Site-wide traffic spike ──
  const totalCurrent = currentHourRows.reduce((s, r) => s + r.views, 0);
  const totalPrev = prevHourRows.reduce((s, r) => s + r.views, 0);
  if (totalPrev > 0) {
    const pctChange = Math.round(((totalCurrent - totalPrev) / totalPrev) * 100);
    if (pctChange >= TRAFFIC_SPIKE_MIN_PCT) {
      const created = await tryCreate({
        type: "traffic", tab: "Trending",
        title: "Traffic Spike",
        description: `Your site is experiencing a ${pctChange}% traffic spike compared to the previous hour.`,
        dedupeKey: `traffic-spike-${hourKey}`,
      });
      await broadcast(created);
    }
  }
}

async function runScan() {
  await Promise.all([
    scanBreakingNews().catch((e) => console.error("scanBreakingNews error:", e)),
    scanScheduledNews().catch((e) => console.error("scanScheduledNews error:", e)),
    scanComments().catch((e) => console.error("scanComments error:", e)),
    scanTrafficAndTrending().catch((e) => console.error("scanTrafficAndTrending error:", e)),
  ]);
}

export function initNotificationSocket(io: SocketServer): void {
  ioRef = io;

  io.on("connection", (socket: Socket) => {
    socket.on("admin:subscribe-notifications", () => {
      socket.join(ADMIN_ROOM);
    });

    socket.on("admin:unsubscribe-notifications", () => {
      socket.leave(ADMIN_ROOM);
    });

    socket.on("disconnect", () => {
      socket.leave(ADMIN_ROOM);
    });
  });

  if (pollTimer) clearInterval(pollTimer);
  runScan().catch(() => {}); // immediate scan on boot
  pollTimer = setInterval(() => {
    runScan().catch(() => {});
  }, POLL_INTERVAL_MS);
}