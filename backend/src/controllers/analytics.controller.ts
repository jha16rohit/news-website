// server/src/controllers/analytics.controller.ts
import { Request, Response } from "express";
import crypto from "crypto";
import Analytics from "../models/Analytics";
import PageView, { TrafficSource } from "../models/Pageview";

// ── helpers ──────────────────────────────────────────────────────────────────

function dayBucket(d: Date = new Date()): Date {
  const b = new Date(d);
  b.setUTCHours(0, 0, 0, 0);
  return b;
}

function classifySource(referrer = "", utmSource = ""): TrafficSource {
  const ref = (referrer + utmSource).toLowerCase();
  if (!ref || ref === "direct") return "direct";
  if (/google|bing|yahoo|duckduckgo|search/.test(ref)) return "google";
  if (/facebook|twitter|instagram|linkedin|youtube|whatsapp|t\.co|social/.test(ref))
    return "social";
  return "other";
}

function hashVisitor(ip: string, ua: string): string {
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}

function parseDateRange(req: Request): { from: Date; to: Date; days: number } {
  const now  = new Date();
  const raw  = (req.query.range as string) ?? "7";
  const days = Math.min(Math.max(parseInt(raw) || 7, 1), 365);
  const to   = dayBucket(now);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days + 1);
  return { from, to, days };
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// ══════════════════════════════════════════════════════════════
export const trackPageView = async (req: Request, res: Response) => {
  try {
    const { newsId, sessionId, referrer, utmSource, userEmail } = req.body;
    if (!newsId || !sessionId) return res.status(400).json({ message: "newsId and sessionId required" });

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "";
    const ua = req.headers["user-agent"] ?? "";
    
    // Uses email if provided, otherwise falls back to hashed IP
    const visitorId = userEmail ? userEmail.trim().toLowerCase() : hashVisitor(ip, ua);
    const source    = classifySource(referrer, utmSource);
    const bucket    = dayBucket();

    await PageView.create({ newsId, visitorId, source, sessionId });

    const isNewVisitor = !(await PageView.exists({
      newsId,
      visitorId,
      createdAt: { $gte: bucket },
      sessionId: { $ne: sessionId }, 
    }));

    await Analytics.findOneAndUpdate(
      { newsId, date: bucket },
      {
        $inc: {
          views:                       1,
          uniqueVisitors:              isNewVisitor ? 1 : 0,
          [`sources.${source}`]:       1,
        },
      },
{ upsert: true, returnDocument: 'after' }    );

    await Analytics.findOneAndUpdate(
      { newsId: "SITE", date: bucket },
      {
        $inc: {
          views:                       1,
          uniqueVisitors:              isNewVisitor ? 1 : 0,
          [`sources.${source}`]:       1,
        },
      },
{ upsert: true, returnDocument: 'after' }    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("trackPageView error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
export const trackReadTime = async (req: Request, res: Response) => {
  try {
    const { newsId, sessionId, seconds } = req.body;
    if (!newsId || !sessionId || typeof seconds !== "number") {
      return res.status(400).json({ message: "newsId, sessionId, seconds required" });
    }

    const secs   = Math.min(Math.max(Math.round(seconds), 0), 3600);
    const bucket = dayBucket();

    await PageView.findOneAndUpdate(
      { newsId, sessionId },
      { $set: { readTime: secs } }
    );

    for (const id of [newsId, "SITE"]) {
      const doc = await Analytics.findOneAndUpdate(
        { newsId: id, date: bucket },
        { $inc: { totalReadTime: secs, readSessions: 1 } },
{ upsert: true, returnDocument: 'after' }   
   );
      if (doc && doc.readSessions > 0) {
        doc.avgReadTime = Math.round(doc.totalReadTime / doc.readSessions);
        await doc.save();
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("trackReadTime error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
export const getKPIs = async (req: Request, res: Response) => {
  try {
    const { from, to, days } = parseDateRange(req);

    const prevTo   = new Date(from);
    prevTo.setUTCDate(prevTo.getUTCDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setUTCDate(prevFrom.getUTCDate() - days + 1);

    const [cur, prev] = await Promise.all([
      Analytics.aggregate([
        { $match: { newsId: "SITE", date: { $gte: from, $lte: to } } },
        { $group: {
            _id: null,
            views:          { $sum: "$views" },
            uniqueVisitors: { $sum: "$uniqueVisitors" },
            totalReadTime:  { $sum: "$totalReadTime" },
            readSessions:   { $sum: "$readSessions" },
        }},
      ]),
      Analytics.aggregate([
        { $match: { newsId: "SITE", date: { $gte: prevFrom, $lte: prevTo } } },
        { $group: {
            _id: null,
            views:          { $sum: "$views" },
            uniqueVisitors: { $sum: "$uniqueVisitors" },
            totalReadTime:  { $sum: "$totalReadTime" },
            readSessions:   { $sum: "$readSessions" },
        }},
      ]),
    ]);

    const c = cur[0]  ?? { views: 0, uniqueVisitors: 0, totalReadTime: 0, readSessions: 0 };
    const p = prev[0] ?? { views: 0, uniqueVisitors: 0, totalReadTime: 0, readSessions: 0 };

    const pct = (cur: number, prev: number) =>
      prev === 0 ? null : (((cur - prev) / prev) * 100).toFixed(1);

    const avgSecs   = c.readSessions > 0 ? Math.round(c.totalReadTime / c.readSessions) : 0;
    const pAvgSecs  = p.readSessions > 0 ? Math.round(p.totalReadTime / p.readSessions) : 0;

    const News = (await import("../models/News")).default;
    
    // Bulletproof Published Articles Counter
    const publishedCount = await News.countDocuments({
      status: { $regex: /^published$/i },
      createdAt: { $gte: from }
    });

    return res.status(200).json({
      totalViews:      { value: c.views,          formatted: fmtNum(c.views),          pct: pct(c.views, p.views) },
      uniqueVisitors:  { value: c.uniqueVisitors,  formatted: fmtNum(c.uniqueVisitors),  pct: pct(c.uniqueVisitors, p.uniqueVisitors) },
      articlesPublished: { value: publishedCount, formatted: String(publishedCount), pct: null },
      avgReadTime:     {
        value: avgSecs,
        formatted: `${Math.floor(avgSecs / 60)}m ${avgSecs % 60}s`,
        pct: pct(avgSecs, pAvgSecs),
      },
    });
  } catch (err) {
    console.error("getKPIs error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
export const getTrafficChart = async (req: Request, res: Response) => {
  try {
    const { from, to } = parseDateRange(req);

    const rows = await Analytics.aggregate([
      { $match: { newsId: "SITE", date: { $gte: from, $lte: to } } },
      { $sort:  { date: 1 } },
      { $project: {
          _id: 0,
          date: { $dateToString: { format: "%b %d", date: "$date" } },
          views:          1,
          uniqueVisitors: 1,
      }},
    ]);

    return res.status(200).json({ chart: rows });
  } catch (err) {
    console.error("getTrafficChart error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
export const getTrafficSources = async (req: Request, res: Response) => {
  try {
    const { from, to } = parseDateRange(req);

    const rows = await Analytics.aggregate([
      { $match: { newsId: "SITE", date: { $gte: from, $lte: to } } },
      { $group: {
          _id:    null,
          direct: { $sum: "$sources.direct" },
          google: { $sum: "$sources.google" },
          social: { $sum: "$sources.social" },
          other:  { $sum: "$sources.other"  },
      }},
    ]);

    const r = rows[0] ?? { direct: 0, google: 0, social: 0, other: 0 };
    const total = r.direct + r.google + r.social + r.other || 1;
    const pct   = (n: number) => Math.round((n / total) * 100);

    return res.status(200).json({
      total: r.direct + r.google + r.social + r.other,
      sources: [
        { label: "Direct",        key: "direct", pct: pct(r.direct), color: "#3b82f6", icon: "globe"  },
        { label: "Google Search", key: "google", pct: pct(r.google), color: "#22c55e", icon: "search" },
        { label: "Social Media",  key: "social", pct: pct(r.social), color: "#a855f7", icon: "share"  },
        { label: "Other",         key: "other",  pct: pct(r.other),  color: "#f59e0b", icon: "other"  },
      ].filter((s) => s.pct > 0),
    });
  } catch (err) {
    console.error("getTrafficSources error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
export const getTopArticles = async (req: Request, res: Response) => {
  try {
    const { from, to } = parseDateRange(req);
    const limit        = Math.min(parseInt((req.query.limit as string) ?? "10"), 50);

    const cur = await Analytics.aggregate([
      { $match: { newsId: { $ne: "SITE" }, date: { $gte: from, $lte: to } } },
      { $group: {
          _id:           "$newsId",
          views:         { $sum: "$views" },
          readSessions:  { $sum: "$readSessions" },
          totalReadTime: { $sum: "$totalReadTime" },
      }},
      { $sort: { views: -1 } },
      { $limit: limit },
    ]);

    const prevTo   = new Date(from); prevTo.setUTCDate(prevTo.getUTCDate() - 1);
    const prevFrom = new Date(prevTo);
    const days     = parseDateRange(req).days;
    prevFrom.setUTCDate(prevFrom.getUTCDate() - days + 1);

    const prevMap: Record<string, number> = {};
    const prev = await Analytics.aggregate([
      { $match: { newsId: { $in: cur.map((c) => c._id) }, date: { $gte: prevFrom, $lte: prevTo } } },
      { $group: { _id: "$newsId", views: { $sum: "$views" } } },
    ]);
    prev.forEach((p) => { prevMap[p._id] = p.views; });

    let newsMap: Record<string, { headline: string; publishedAt: Date; categoryName: string }> = {};
    try {
      const News = (await import("../models/News")).default;
      const ids  = cur.map((c) => c._id);
      const docs = await (News as any).find({ _id: { $in: ids } }).select("headline publishedAt categoryId").lean();
      docs.forEach((d: any) => {
        newsMap[String(d._id)] = {
          headline:     d.headline ?? d.title ?? "Untitled",
          publishedAt:  d.publishedAt,
          categoryName: d.categoryId?.name ?? "News",
        };
      });
    } catch { }

    const articles = cur.map((c, i) => {
      const prevViews  = prevMap[c._id] ?? 0;
      const trendPct   = prevViews > 0 ? (((c.views - prevViews) / prevViews) * 100).toFixed(1) : null;
      const engPct     = c.readSessions > 0 ? Math.round((c.readSessions / c.views) * 100) : 0;
      const info       = newsMap[c._id];

      return {
        rank:        i + 1,
        newsId:      c._id,
        title:       info?.headline    ?? `Article ${c._id}`,
        published:   info?.publishedAt ?? null,
        category:    info?.categoryName ?? "",
        views:       c.views,
        viewsFmt:    fmtNum(c.views),
        engagement:  engPct + "%",
        trend:       trendPct ? (Number(trendPct) > 0 ? "+" : "") + trendPct + "%" : "—",
        trendUp:     trendPct ? Number(trendPct) >= 0 : true,
      };
    });

    return res.status(200).json({ articles });
  } catch (err) {
    console.error("getTopArticles error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
export const getLiveVisitors = async (_req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 5 * 60 * 1000);
    const count = await PageView.distinct("visitorId", { createdAt: { $gte: since } });
    return res.status(200).json({ liveVisitors: count.length });
  } catch (err) {
    console.error("getLiveVisitors error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
export const exportAnalytics = async (req: Request, res: Response) => {
  try {
    const { from, to } = parseDateRange(req);

    const rows = await Analytics.aggregate([
      { $match: { newsId: "SITE", date: { $gte: from, $lte: to } } },
      { $sort:  { date: 1 } },
    ]);

    const header = "Date,Views,Unique Visitors,Avg Read Time (s),Direct,Google,Social,Other\n";
    const body   = rows.map((r) =>
      [
        r.date.toISOString().slice(0, 10),
        r.views,
        r.uniqueVisitors,
        r.avgReadTime,
        r.sources?.direct ?? 0,
        r.sources?.google ?? 0,
        r.sources?.social ?? 0,
        r.sources?.other  ?? 0,
      ].join(",")
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="analytics-${from.toISOString().slice(0,10)}-to-${to.toISOString().slice(0,10)}.csv"`);
    return res.send(header + body);
  } catch (err) {
    console.error("exportAnalytics error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};