// server/src/controllers/analytics.controller.ts
//
// Backs the two routers registered in app.ts:
//   analyticsPublicRouter  -> /api/analytics        (pageview, readtime)
//   analyticsAdminRouter   -> /api/admin/analytics  (kpis, traffic, top-articles, sources, live-visitors, user-insights, export)
//
// Data model:
//   PageView  = one row per visit (raw event, 90-day TTL)
//   Analytics = daily rollup per article + "SITE" (kept for future export/reporting)
//
// For the two live dashboard widgets (TrafficOverview, TopPerformers) we query
// PageView directly with aggregation pipelines — it's well within the 90-day
// retention window for the "Today / 7 days / 30 days" ranges the UI offers,
// and gives us exact unique-visitor counts without double-counting.

import { Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import PageView, { TrafficSource } from "../models/Pageview";
import Analytics from "../models/Analytics";
import News from "../models/News";
import AdInquiry from "../models/AdInquiry";
import { broadcastLiveVisitorCount } from "../socket/analyticssocket";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashVisitor(req: Request): string {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";
  const ua = req.headers["user-agent"] || "unknown";
  return crypto.createHash("sha256").update(`${ip}::${ua}`).digest("hex");
}

function classifySource(referrer?: string): TrafficSource {
  if (!referrer) return "direct";
  const r = referrer.toLowerCase();
  if (r.includes("google.")) return "google";
  if (
    r.includes("facebook.") ||
    r.includes("twitter.") ||
    r.includes("x.com") ||
    r.includes("instagram.") ||
    r.includes("linkedin.") ||
    r.includes("t.co")
  ) {
    return "social";
  }
  return "other";
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangeStart(range: number): Date {
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - (range - 1));
  return start;
}

// Mirrors the frontend's aaFmt() so KPI cards format consistently either place.
function formatCount(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1000) return Math.round(v / 1000) + "K";
  return String(v);
}

function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

// Percent change vs previous period. Null (not 0) means "no baseline to compare to",
// which the frontend renders as "No previous data" instead of a misleading "+100%".
function pctChange(cur: number, prev: number): string | null {
  if (prev > 0) return (((cur - prev) / prev) * 100).toFixed(1);
  return cur > 0 ? "100" : null;
}

function formatHourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${h12} ${suffix}`;
}

function formatDayLabel(dateStr: string, range: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (range <= 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Upsert the daily Analytics rollup (per-article + SITE). Fire-and-forget from callers.
async function bumpAnalyticsBucket(
  newsId: string,
  field: "views" | "readTime",
  amount: number,
  source?: TrafficSource,
) {
  const date = startOfDay(new Date());
  const inc: Record<string, number> = {};

  if (field === "views") {
    inc.views = amount;
    if (source) inc[`sources.${source}`] = amount;
  } else {
    inc.totalReadTime = amount;
    inc.readSessions = 1;
  }

  for (const id of [newsId, "SITE"]) {
    await Analytics.findOneAndUpdate(
      { newsId: id, date },
      { $inc: inc },
      { upsert: true, new: true },
    ).catch(() => {});
  }
}

// ─── PUBLIC: pageview + readtime ─────────────────────────────────────────────

export async function trackPageView(req: Request, res: Response) {
  try {
    const { newsId, sessionId, referrer } = req.body;
    if (!newsId || !sessionId) {
      return res.status(400).json({ message: "newsId and sessionId are required" });
    }

    const visitorId = hashVisitor(req);
    const source = classifySource(referrer);
    const viewId = `${sessionId}_${Date.now()}`;

    await PageView.create({ newsId, visitorId, source, sessionId, viewId });
    bumpAnalyticsBucket(newsId, "views", 1, source).catch(() => {});
    broadcastLiveVisitorCount().catch(() => {});

    res.json({ ok: true, viewId });
  } catch (error) {
    console.error("trackPageView error:", error);
    res.status(500).json({ message: "Error tracking page view" });
  }
}

export async function trackReadTime(req: Request, res: Response) {
  try {
    const { newsId, viewId, seconds } = req.body;
    if (!viewId || typeof seconds !== "number" || seconds < 1) {
      return res.status(400).json({ message: "viewId and a positive seconds value are required" });
    }

    const updated = await PageView.findOneAndUpdate(
      { viewId },
      { readTime: seconds },
      { new: true },
    );

    if (updated && newsId) {
      bumpAnalyticsBucket(newsId, "readTime", seconds).catch(() => {});
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("trackReadTime error:", error);
    res.status(500).json({ message: "Error tracking read time" });
  }
}

// ─── ADMIN: traffic chart ────────────────────────────────────────────────────

export async function getTrafficChart(req: Request, res: Response) {
  try {
    const range = parseInt(String(req.query.range ?? "1"), 10) || 1;

    if (range <= 1) {
      // Hourly buckets for "Today"
      const start = startOfDay(new Date());
      const rows = await PageView.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            views: { $sum: 1 },
            visitors: { $addToSet: "$visitorId" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const chart = rows.map((r) => ({
        label: formatHourLabel(r._id),
        views: r.views,
        uniqueVisitors: r.visitors.length,
      }));

      return res.json({ chart });
    }

    // Daily buckets for 7 / 30 day ranges
    const start = rangeStart(range);
    const rows = await PageView.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          views: { $sum: 1 },
          visitors: { $addToSet: "$visitorId" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chart = rows.map((r) => ({
      label: formatDayLabel(r._id, range),
      views: r.views,
      uniqueVisitors: r.visitors.length,
    }));

    res.json({ chart });
  } catch (error) {
    console.error("getTrafficChart error:", error);
    res.status(500).json({ message: "Error fetching traffic chart" });
  }
}

// ─── ADMIN: top articles ─────────────────────────────────────────────────────

export async function getTopArticles(req: Request, res: Response) {
  try {
    const range = parseInt(String(req.query.range ?? "1"), 10) || 1;
    const limit = parseInt(String(req.query.limit ?? "10"), 10) || 10;

    const start = rangeStart(range);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - range);

    const [current, previous] = await Promise.all([
      PageView.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: "$newsId",
            views: { $sum: 1 },
            totalReadTime: { $sum: { $ifNull: ["$readTime", 0] } },
            readSessions: { $sum: { $cond: [{ $gt: ["$readTime", 0] }, 1, 0] } },
          },
        },
        { $sort: { views: -1 } },
        { $limit: limit },
      ]),
      PageView.aggregate([
        { $match: { createdAt: { $gte: prevStart, $lt: start } } },
        { $group: { _id: "$newsId", views: { $sum: 1 } } },
      ]),
    ]);

    const prevMap = Object.fromEntries(previous.map((p) => [p._id, p.views]));

    const ids = current
      .map((c) => c._id)
      .filter((id) => mongoose.isValidObjectId(id));

    const newsDocs = await News.find({ _id: { $in: ids } }).select("headline").lean();
    const titleMap = Object.fromEntries(
      newsDocs.map((n: any) => [String(n._id), n.headline]),
    );

    const articles = current.map((c) => {
      const prevViews = prevMap[c._id] ?? 0;
      const growthPercent =
        prevViews > 0
          ? ((c.views - prevViews) / prevViews) * 100
          : c.views > 0
          ? 100
          : 0;

      return {
        newsId: c._id,
        title: titleMap[c._id] ?? "Untitled article",
        views: c.views,
        avgReadTime: c.readSessions > 0 ? c.totalReadTime / c.readSessions : 0,
        growthPercent: Math.round(growthPercent),
      };
    });

    res.json({ articles });
  } catch (error) {
    console.error("getTopArticles error:", error);
    res.status(500).json({ message: "Error fetching top articles" });
  }
}

// ─── ADMIN: KPI cards (Published Today / Views Today / etc.) ────────────────

export async function getKPIs(req: Request, res: Response) {
  try {
    const todayStart = startOfDay(new Date());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const [
      publishedToday,
      publishedYesterday,
      pendingReview,
      pendingReviewYesterday,
      breakingLive,
      viewsToday,
      viewsYesterday,
      trending,
      trendingYesterday,
      activeReadersToday,
      activeReadersYesterday,
    ] = await Promise.all([
      News.countDocuments({ status: "PUBLISHED", publishedAt: { $gte: todayStart } }),
      News.countDocuments({
        status: "PUBLISHED",
        publishedAt: { $gte: yesterdayStart, $lt: todayStart },
      }),
      News.countDocuments({ status: "DRAFT" }),
      News.countDocuments({ status: "DRAFT", createdAt: { $lt: todayStart } }),
      News.countDocuments({ articleType: "BREAKING", statusType: "published" }),
      PageView.countDocuments({ createdAt: { $gte: todayStart } }),
      PageView.countDocuments({ createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
      News.countDocuments({ status: "PUBLISHED", priority: { $in: ["HIGH", "CRITICAL"] } }),
      News.countDocuments({
        status: "PUBLISHED",
        priority: { $in: ["HIGH", "CRITICAL"] },
        publishedAt: { $lt: todayStart },
      }),
      PageView.distinct("visitorId", { createdAt: { $gte: todayStart } }),
      PageView.distinct("visitorId", { createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
    ]);

    const viewsGrowthPct =
      viewsYesterday > 0
        ? Math.round(((viewsToday - viewsYesterday) / viewsYesterday) * 100)
        : viewsToday > 0
        ? 100
        : 0;

    // ── Traffic-page KPIs (Analytics.tsx: Total Views / Unique Visitors / ──
    // ── Articles Published / Avg Read Time), computed over the selected  ──
    // ── range vs. the equal-length period immediately before it.        ──
    const range = parseInt(String(req.query.range ?? "0"), 10) || 0;

    let totalViews = null, uniqueVisitors = null, articlesPublished = null, avgReadTime = null;

    if (range > 0) {
      const start = rangeStart(range);
      const prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - range);

      const [
        curViews, prevViews,
        curVisitors, prevVisitors,
        curPublished, prevPublished,
        curReadAgg, prevReadAgg,
      ] = await Promise.all([
        PageView.countDocuments({ createdAt: { $gte: start } }),
        PageView.countDocuments({ createdAt: { $gte: prevStart, $lt: start } }),
        PageView.distinct("visitorId", { createdAt: { $gte: start } }),
        PageView.distinct("visitorId", { createdAt: { $gte: prevStart, $lt: start } }),
        News.countDocuments({ status: "PUBLISHED", publishedAt: { $gte: start } }),
        News.countDocuments({ status: "PUBLISHED", publishedAt: { $gte: prevStart, $lt: start } }),
        PageView.aggregate([
          { $match: { createdAt: { $gte: start }, readTime: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: "$readTime" }, count: { $sum: 1 } } },
        ]),
        PageView.aggregate([
          { $match: { createdAt: { $gte: prevStart, $lt: start }, readTime: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: "$readTime" }, count: { $sum: 1 } } },
        ]),
      ]);

      const curAvgSec = curReadAgg[0]?.count ? curReadAgg[0].total / curReadAgg[0].count : 0;
      const prevAvgSec = prevReadAgg[0]?.count ? prevReadAgg[0].total / prevReadAgg[0].count : 0;

      totalViews = { value: curViews, formatted: formatCount(curViews), pct: pctChange(curViews, prevViews) };
      uniqueVisitors = { value: curVisitors.length, formatted: formatCount(curVisitors.length), pct: pctChange(curVisitors.length, prevVisitors.length) };
      articlesPublished = { value: curPublished, formatted: formatCount(curPublished), pct: pctChange(curPublished, prevPublished) };
      avgReadTime = { value: curAvgSec, formatted: formatDuration(curAvgSec), pct: pctChange(curAvgSec, prevAvgSec) };
    }

    res.json({
      publishedToday,
      publishedGrowth: publishedToday - publishedYesterday,
      pendingReview,
      pendingReviewGrowth: pendingReview - pendingReviewYesterday,
      breakingLive,
      viewsToday,
      viewsGrowthPct,
      trending,
      trendingGrowth: trending - trendingYesterday,
      activeReaders: activeReadersToday.length,
      activeReadersGrowth: activeReadersToday.length - activeReadersYesterday.length,
      // Traffic-page shape (populated only when ?range= is supplied):
      totalViews,
      uniqueVisitors,
      articlesPublished,
      avgReadTime,
    });
  } catch (error) {
    console.error("getKPIs error:", error);
    res.status(500).json({ message: "Error fetching KPIs" });
  }
}

// ─── ADMIN: traffic sources breakdown ────────────────────────────────────────

export async function getTrafficSources(req: Request, res: Response) {
  try {
    const range = parseInt(String(req.query.range ?? "1"), 10) || 1;
    const start = range <= 1 ? startOfDay(new Date()) : rangeStart(range);

    const rows = await PageView.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: "$source", views: { $sum: 1 } } },
    ]);

    const counts = { direct: 0, google: 0, social: 0, other: 0 };
    rows.forEach((r) => {
      if (r._id in counts) counts[r._id as keyof typeof counts] = r.views;
    });

    const total = counts.direct + counts.google + counts.social + counts.other;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    const meta: Record<keyof typeof counts, { label: string; color: string; icon: string }> = {
      direct: { label: "Direct",       color: "#3b82f6", icon: "globe"  },
      google: { label: "Google",       color: "#22c55e", icon: "search" },
      social: { label: "Social Media", color: "#f59e0b", icon: "share"  },
      other:  { label: "Other",        color: "#a855f7", icon: "other"  },
    };

    const sources = (Object.keys(counts) as (keyof typeof counts)[]).map((key) => ({
      key,
      label: meta[key].label,
      color: meta[key].color,
      icon: meta[key].icon,
      pct: pct(counts[key]),
    }));

    res.json({ sources, total });
  } catch (error) {
    console.error("getTrafficSources error:", error);
    res.status(500).json({ message: "Error fetching traffic sources" });
  }
}

// ─── ADMIN: live visitor count ───────────────────────────────────────────────

export async function getLiveVisitors(req: Request, res: Response) {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const distinctVisitors = await PageView.distinct("visitorId", {
      createdAt: { $gte: fiveMinAgo },
    });
    res.json({ liveVisitors: distinctVisitors.length });
  } catch (error) {
    console.error("getLiveVisitors error:", error);
    res.status(500).json({ message: "Error fetching live visitors" });
  }
}

// ─── ADMIN: user insights ────────────────────────────────────────────────────
//
// NOTE: this app has no separate User/account model — the only identity
// signal anywhere in the schema is `visitorId` (hashed IP+UA) on PageView.
// So "users" here means "distinct visitors", derived entirely from PageView.
// Advertisement Requests has no backing model in this codebase yet, so that
// section stays at zero until an AdRequest-style model is added and wired in.

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export async function getUserInsights(req: Request, res: Response) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const ACTIVE_WINDOW_DAYS = 30;
    const activeStart = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // One row per visitor: when we first saw them, and how many distinct
    // sessions / articles they've racked up. This is the base dataset every
    // stat below is derived from.
    const visitorRows = await PageView.aggregate([
      {
        $group: {
          _id: "$visitorId",
          firstSeen: { $min: "$createdAt" },
          sessions: { $addToSet: "$sessionId" },
          articles: { $addToSet: "$newsId" },
        },
      },
    ]);

    const totalUsersValue = visitorRows.length;
    const newThisMonth = visitorRows.filter((v) => v.firstSeen >= monthStart).length;
    const newLastMonth = visitorRows.filter(
      (v) => v.firstSeen >= lastMonthStart && v.firstSeen < monthStart,
    ).length;

    const activeVisitorIds = await PageView.distinct("visitorId", {
      createdAt: { $gte: activeStart },
    });
    const activeUsersValue = activeVisitorIds.length;
    const pctActive = totalUsersValue > 0 ? Math.round((activeUsersValue / totalUsersValue) * 100) : 0;

    const growthRateValue =
      newLastMonth > 0
        ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
        : newThisMonth > 0
        ? 100
        : 0;

    const returningCount = visitorRows.filter((v) => v.sessions.length > 1).length;
    const returningPct = totalUsersValue > 0 ? Math.round((returningCount / totalUsersValue) * 100) : 0;

    // ── User Growth chart: new visitors bucketed by month (this year) and by year ──
    const currentYear = now.getFullYear();
    const monthly = MONTH_LABELS.map((label, i) => {
      const bucketStart = new Date(currentYear, i, 1);
      const bucketEnd = new Date(currentYear, i + 1, 1);
      const users = visitorRows.filter((v) => v.firstSeen >= bucketStart && v.firstSeen < bucketEnd).length;
      return { label, users };
    });

    const yearsPresent = Array.from(new Set(visitorRows.map((v) => v.firstSeen.getFullYear()))).sort();
    const yearly = yearsPresent.map((year) => ({
      label: String(year),
      users: visitorRows.filter((v) => v.firstSeen.getFullYear() === year).length,
    }));

    // ── Growth-rate stats: month-over-month % change across `monthly` ──
    const pctChanges: { month: string; pct: number }[] = [];
    for (let i = 1; i < monthly.length; i++) {
      const prev = monthly[i - 1].users;
      const cur = monthly[i].users;
      if (prev > 0 || cur > 0) {
        pctChanges.push({
          month: monthly[i].label,
          pct: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 100,
        });
      }
    }
    const highest = pctChanges.length
      ? pctChanges.reduce((a, b) => (b.pct > a.pct ? b : a))
      : { month: "—", pct: 0 };
    const lowest = pctChanges.length
      ? pctChanges.reduce((a, b) => (b.pct < a.pct ? b : a))
      : { month: "—", pct: 0 };
    const average = pctChanges.length
      ? Math.round(pctChanges.reduce((s, p) => s + p.pct, 0) / pctChanges.length)
      : 0;

    // ── Login Activity heatmap: page views bucketed by hour of day ──
    const hourRows = await PageView.aggregate([
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
    ]);
    const bucketFor = (h: number) =>
      h >= 6 && h < 12 ? "morning" : h >= 12 && h < 17 ? "afternoon" : h >= 17 && h < 22 ? "evening" : "night";
    const heatmapCounts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    hourRows.forEach((r) => { heatmapCounts[bucketFor(r._id)] += r.count; });

    const loginActivity = [
      { key: "morning",   label: "Morning",   range: "6 AM - 12 PM", logins: heatmapCounts.morning },
      { key: "afternoon", label: "Afternoon", range: "12 PM - 5 PM", logins: heatmapCounts.afternoon },
      { key: "evening",   label: "Evening",   range: "5 PM - 10 PM", logins: heatmapCounts.evening },
      { key: "night",     label: "Night",     range: "10 PM - 6 AM", logins: heatmapCounts.night },
    ];

    // ── Engagement ──
    const totalSessions = visitorRows.reduce((s, v) => s + v.sessions.length, 0);
    const avgLoginsPerUser = totalUsersValue > 0 ? Math.round((totalSessions / totalUsersValue) * 10) / 10 : 0;

    const readAgg = await PageView.aggregate([
      { $match: { readTime: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$readTime" }, count: { $sum: 1 } } },
    ]);
    const avgSessionSeconds = readAgg[0]?.count ? readAgg[0].total / readAgg[0].count : 0;
    const avgSessionMinutes = Math.round((avgSessionSeconds / 60) * 10) / 10;

    const totalArticleReads = visitorRows.reduce((s, v) => s + v.articles.length, 0);
    const avgArticlesRead = totalUsersValue > 0 ? Math.round((totalArticleReads / totalUsersValue) * 10) / 10 : 0;

    // ── Advertisement Requests: sourced from AdInquiry (the model actually ──
    // ── used by advertisement.controller.ts). "published" is shown as     ──
    // ── "Approved" in the UI — that's the inquiry lifecycle's approval    ──
    // ── state. The unused `AdRequest` model is intentionally not queried  ──
    // ── here since nothing in the app writes to it.                      ──
    const [pendingCount, publishedCount, rejectedCount] = await Promise.all([
      AdInquiry.countDocuments({ status: "pending" }),
      AdInquiry.countDocuments({ status: "published" }),
      AdInquiry.countDocuments({ status: "rejected" }),
    ]);
    const adRequestSummary = {
      pending: pendingCount,
      approved: publishedCount,
      rejected: rejectedCount,
      total: pendingCount + publishedCount + rejectedCount,
    };

    res.json({
      stats: {
        totalUsers: { value: totalUsersValue, newThisMonth },
        activeUsers: { value: activeUsersValue, pctActive },
        growthRate: { value: growthRateValue },
        newUsers: { value: newThisMonth },
        adRequests: { value: adRequestSummary.total, pending: adRequestSummary.pending },
        returningUsers: { pct: returningPct },
      },
      growthChart: { monthly, yearly },
      growthRateStats: { highest, lowest, average, current: growthRateValue },
      adRequestSummary,
      loginActivity,
      engagement: { avgLoginsPerUser, avgSessionMinutes, avgArticlesRead },
    });
  } catch (error) {
    console.error("getUserInsights error:", error);
    res.status(500).json({ message: "Error fetching user insights" });
  }
}

// ─── ADMIN: CSV export ───────────────────────────────────────────────────────

export async function exportAnalytics(req: Request, res: Response) {
  try {
    const range = parseInt(String(req.query.range ?? "30"), 10) || 30;
    const start = rangeStart(range);

    const rows = await Analytics.find({ newsId: { $ne: "SITE" }, date: { $gte: start } })
      .sort({ date: 1 })
      .lean();

    const header = "date,newsId,views,uniqueVisitors,totalReadTime,readSessions,avgReadTime\n";
    const body = rows
      .map((r: any) =>
        [
          r.date.toISOString().slice(0, 10),
          r.newsId,
          r.views,
          r.uniqueVisitors,
          r.totalReadTime,
          r.readSessions,
          r.readSessions > 0 ? (r.totalReadTime / r.readSessions).toFixed(1) : 0,
        ].join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="analytics-${range}d.csv"`);
    res.send(header + body);
  } catch (error) {
    console.error("exportAnalytics error:", error);
    res.status(500).json({ message: "Error exporting analytics" });
  }
}