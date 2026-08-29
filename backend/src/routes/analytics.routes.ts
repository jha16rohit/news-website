// server/src/routes/analytics.routes.ts
//
// Referenced in app.ts as:
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
  getUserInsights,
  exportAnalytics,
} from "../controllers/analytics.controller";

import { protect, isAdmin } from "../middleware/auth.middleware";

// ── Public router: called from article pages, no auth required ─────────────
const analyticsPublicRouter = Router();

analyticsPublicRouter.post("/pageview", trackPageView);
analyticsPublicRouter.post("/readtime", trackReadTime);

// ── Admin router: powers the dashboard widgets ──────────────────────────────
const analyticsAdminRouter = Router();

analyticsAdminRouter.use(protect, isAdmin);

analyticsAdminRouter.get("/kpis", getKPIs);
analyticsAdminRouter.get("/traffic", getTrafficChart);
analyticsAdminRouter.get("/sources", getTrafficSources);
analyticsAdminRouter.get("/top-articles", getTopArticles);
analyticsAdminRouter.get("/live-visitors", getLiveVisitors);
analyticsAdminRouter.get("/user-insights", getUserInsights);
analyticsAdminRouter.get("/export", exportAnalytics);

export { analyticsPublicRouter, analyticsAdminRouter };