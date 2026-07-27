// server/src/socket/notificationsocket.ts
//
// Periodically scans News, Comment, and PageView for notification-worthy
// conditions and upserts rows into Notification, using `dedupeKey` so the
// same event never creates a second row (see models/Notification.ts).
//
// Newly-inserted notifications are pushed in real time to any admin client
// subscribed via the "admin:subscribe-notifications" event (Notifications.tsx
// emits this on socket connect).

import { Server as SocketServer } from "socket.io";
import News from "../models/News";
import Comment from "../models/Comment";
import PageView from "../models/Pageview";
import Notification, { INotification } from "../models/Notification";

const ADMIN_ROOM = "admin-notifications";
const SCAN_INTERVAL_MS = 30_000; // how often we scan for new conditions

// ─── Tunables ────────────────────────────────────────────────────────────
const SCHEDULED_REMINDER_WINDOW_MIN = 30;    // remind when publish is <=30 min away
const TRAFFIC_SPIKE_MULTIPLIER = 2;          // "spike" = 2x the prior hour
const TRAFFIC_SPIKE_MIN_PREV_VIEWS = 20;     // ignore noise on low-traffic hours
const TRENDING_ARTICLE_VIEWS_PER_HOUR = 50;  // per-article "trending" threshold

type NotificationInput = Pick<
  INotification,
  "type" | "tab" | "title" | "description" | "dedupeKey"
>;

// Upserts a notification by dedupeKey. Only emits the socket event when the
// row is actually newly created — repeat scans that hit the same event are
// silent no-ops, which is what keeps "the same event never creates a second
// row" true and stops the client from getting duplicate toasts.
async function upsertNotification(io: SocketServer, doc: NotificationInput) {
  const result: any = await Notification.findOneAndUpdate(
    { dedupeKey: doc.dedupeKey },
    { $setOnInsert: doc },
    { upsert: true, returnDocument: 'after', rawResult: true, setDefaultsOnInsert: true },
  );

  const wasInserted = Boolean(result?.lastErrorObject?.upserted);
  if (wasInserted && result?.value) {
    io.to(ADMIN_ROOM).emit("notifications:new", result.value);
  }
}

// ─── Scan: Breaking news published ─────────────────────────────────────────
async function scanBreakingPublished(io: SocketServer) {
  const articles = await News.find({ status: "PUBLISHED", articleType: "BREAKING" })
    .select("_id headline")
    .lean();

  for (const a of articles as any[]) {
    await upsertNotification(io, {
      type: "breaking",
      tab: "Breaking",
      title: "Breaking Published",
      description: `"${a.headline}" has been published as breaking news.`,
      dedupeKey: `breaking-published-${a._id}`,
    });
  }
}

// ─── Scan: Scheduled articles nearing publish time ─────────────────────────
async function scanScheduledReminders(io: SocketServer) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + SCHEDULED_REMINDER_WINDOW_MIN * 60_000);

  const articles = await News.find({
    status: "SCHEDULED",
    scheduledAt: { $gte: now, $lte: windowEnd },
  })
    .select("_id headline scheduledAt")
    .lean();

  for (const a of articles as any[]) {
    const mins = Math.max(
      1,
      Math.round((new Date(a.scheduledAt).getTime() - now.getTime()) / 60_000),
    );
    await upsertNotification(io, {
      type: "reminder",
      tab: "Scheduled",
      title: "Scheduled Article Publishing Soon",
      description: `"${a.headline}" is scheduled to publish in ${mins} minute${mins === 1 ? "" : "s"}.`,
      dedupeKey: `scheduled-reminder-${a._id}`,
    });
  }
}

// ─── Scan: New comments ─────────────────────────────────────────────────────
async function scanNewComments(io: SocketServer) {
  // No time window here on purpose: dedupeKey already guarantees a comment
  // can only ever produce one notification, so we just look at the most
  // recent N approved comments each pass instead of a "createdAt >= X"
  // window. A window-based query silently drops any comment older than the
  // window at scan time — including everything that existed before this
  // scanner was ever deployed — and it never gets a notification.
  const comments = await Comment.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(200)
    .select("_id newsId createdAt")
    .lean();

  if (!comments.length) return;

  const headlineMap = await getHeadlineMap(comments.map((c: any) => c.newsId));

  for (const c of comments as any[]) {
    const headline = headlineMap[String(c.newsId)] || "an article";
    await upsertNotification(io, {
      type: "comment",
      tab: "Comments",
      title: "New Comment",
      description: `A new comment was posted on "${headline}".`,
      dedupeKey: `comment-new-${c._id}`,
    });
  }
}

// ─── Scan: Flagged/reported comments ────────────────────────────────────────
async function scanFlaggedComments(io: SocketServer) {
  const comments = await Comment.find({ "reportedBy.0": { $exists: true } })
    .select("_id newsId")
    .lean();

  if (!comments.length) return;

  const headlineMap = await getHeadlineMap(comments.map((c: any) => c.newsId));

  for (const c of comments as any[]) {
    const headline = headlineMap[String(c.newsId)] || "an article";
    await upsertNotification(io, {
      type: "flagged",
      tab: "Comments",
      title: "Comment Flagged",
      description: `A comment on "${headline}" was reported and needs review.`,
      dedupeKey: `flagged-comment-${c._id}`,
    });
  }
}

// ─── Scan: Site-wide traffic spike ──────────────────────────────────────────
function hourBucket(d: Date): string {
  return d.toISOString().slice(0, 13); // e.g. "2026-07-26T15"
}

async function scanTrafficSpike(io: SocketServer) {
  const now = new Date();
  const currentHourStart = new Date(now);
  currentHourStart.setMinutes(0, 0, 0);
  const prevHourStart = new Date(currentHourStart.getTime() - 60 * 60_000);

  const [currentCount, prevCount] = await Promise.all([
    PageView.countDocuments({ createdAt: { $gte: currentHourStart, $lte: now } }),
    PageView.countDocuments({ createdAt: { $gte: prevHourStart, $lt: currentHourStart } }),
  ]);

  if (prevCount < TRAFFIC_SPIKE_MIN_PREV_VIEWS) return;
  if (currentCount < prevCount * TRAFFIC_SPIKE_MULTIPLIER) return;

  const pctIncrease = Math.round(((currentCount - prevCount) / prevCount) * 100);

  await upsertNotification(io, {
    type: "traffic",
    tab: "Trending",
    title: "Traffic Spike",
    description: `Your site is experiencing a ${pctIncrease}% traffic spike compared to the previous hour.`,
    // Bucketed by hour so a spike that persists across an hour only alerts once,
    // but a *new* spike the following hour will alert again.
    dedupeKey: `traffic-spike-${hourBucket(now)}`,
  });
}

// ─── Scan: Per-article trending (views/hour) ────────────────────────────────
async function scanTrendingArticles(io: SocketServer) {
  const oneHourAgo = new Date(Date.now() - 60 * 60_000);

  const results = await PageView.aggregate([
    { $match: { createdAt: { $gte: oneHourAgo } } },
    { $group: { _id: "$newsId", views: { $sum: 1 } } },
    { $match: { views: { $gte: TRENDING_ARTICLE_VIEWS_PER_HOUR } } },
  ]);

  if (!results.length) return;

  const headlineMap = await getHeadlineMap(results.map((r) => r._id));

  for (const r of results) {
    const headline = headlineMap[String(r._id)] || "An article";
    await upsertNotification(io, {
      type: "trending",
      tab: "Trending",
      title: "Article Trending",
      description: `"${headline}" is trending with ${r.views} views in the last hour.`,
      dedupeKey: `trending-${r._id}-${hourBucket(new Date())}`,
    });
  }
}

// ─── Shared helper ───────────────────────────────────────────────────────────
async function getHeadlineMap(newsIds: string[]): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(newsIds.filter(Boolean))];
  if (!uniqueIds.length) return {};

  const docs = await News.find({ _id: { $in: uniqueIds } }).select("headline").lean();
  const map: Record<string, string> = {};
  for (const d of docs as any[]) map[String(d._id)] = d.headline;
  return map;
}

// ─── Orchestration ───────────────────────────────────────────────────────────
async function runScan(io: SocketServer) {
  try {
    await Promise.all([
      scanBreakingPublished(io),
      scanScheduledReminders(io),
      scanNewComments(io),
      scanFlaggedComments(io),
      scanTrafficSpike(io),
      scanTrendingArticles(io),
    ]);
  } catch (err) {
    console.error("notificationsocket scan error:", err);
  }
}

export function initNotificationSocket(io: SocketServer) {
  io.on("connection", (socket) => {
    socket.on("admin:subscribe-notifications", () => {
      socket.join(ADMIN_ROOM);
    });
  });

  // Run once at boot so notifications aren't stale for up to SCAN_INTERVAL_MS,
  // then keep scanning on an interval.
  runScan(io);
  setInterval(() => runScan(io), SCAN_INTERVAL_MS);
}