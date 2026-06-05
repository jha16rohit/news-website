// server/src/routes/analytics.routes.ts
// ─────────────────────────────────────────────
// Register in app.ts:
//   app.use("/api/analytics",       analyticsPublicRouter);
//   app.use("/api/admin/analytics", analyticsAdminRouter);

import { Router } from "express";
import {
  trackPageView,
  trackReadTime,
  getKPIs,
  getTrafficChart,
  getTrafficSources,
  getTopArticles,
  getLiveVisitors,
  exportAnalytics,
} from "../controllers/analytics.controller";
import { protect, isAdmin } from "../middleware/auth.middleware";

// ── Public (no auth) — called from article pages ──────────────
export const analyticsPublicRouter = Router();

/** POST /api/analytics/pageview   — track a page view */
analyticsPublicRouter.post("/pageview",  trackPageView);

/** POST /api/analytics/readtime   — update read time on exit */
analyticsPublicRouter.post("/readtime",  trackReadTime);

// ── Admin only ────────────────────────────────────────────────
export const analyticsAdminRouter = Router();

/** GET /api/admin/analytics/kpis?range=7        — 4 KPI cards */
analyticsAdminRouter.get("/kpis",          protect, isAdmin, getKPIs);

/** GET /api/admin/analytics/traffic?range=7     — area chart data */
analyticsAdminRouter.get("/traffic",       protect, isAdmin, getTrafficChart);

/** GET /api/admin/analytics/sources?range=7     — traffic source bars */
analyticsAdminRouter.get("/sources",       protect, isAdmin, getTrafficSources);

/** GET /api/admin/analytics/top-articles?range=7 — top articles table */
analyticsAdminRouter.get("/top-articles",  protect, isAdmin, getTopArticles);

/** GET /api/admin/analytics/live-visitors       — real-time visitor count */
analyticsAdminRouter.get("/live-visitors", protect, isAdmin, getLiveVisitors);

/** GET /api/admin/analytics/export?range=7      — CSV download */
analyticsAdminRouter.get("/export",        protect, isAdmin, exportAnalytics);