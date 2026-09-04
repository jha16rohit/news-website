// server/src/routes/analytics.routes.ts

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
  getEditorKPIs,
  getEditorTrafficChart,
  getEditorTopArticles,
} from "../controllers/analytics.controller";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

// ── Public router: called from article pages, no auth required ────────────────

const analyticsPublicRouter = Router();

analyticsPublicRouter.post(
  "/pageview",
  trackPageView
);

analyticsPublicRouter.post(
  "/readtime",
  trackReadTime
);

// ── Admin router: powers the dashboard widgets ───────────────────────────────

const analyticsAdminRouter = Router();

analyticsAdminRouter.use(
  protect,
  hasPermission("analytics")
);

analyticsAdminRouter.get(
  "/kpis",
  getKPIs
);

analyticsAdminRouter.get(
  "/traffic",
  getTrafficChart
);

analyticsAdminRouter.get(
  "/sources",
  getTrafficSources
);

analyticsAdminRouter.get(
  "/top-articles",
  getTopArticles
);

analyticsAdminRouter.get(
  "/live-visitors",
  getLiveVisitors
);

analyticsAdminRouter.get(
  "/user-insights",
  getUserInsights
);

analyticsAdminRouter.get(
  "/export",
  exportAnalytics
);

// ── Editor router: powers the Editor Dashboard analytics ─────────────────────

const analyticsEditorRouter = Router();

analyticsEditorRouter.use(protect);

analyticsEditorRouter.get(
  "/kpis",
  getEditorKPIs
);

analyticsEditorRouter.get(
  "/traffic",
  getEditorTrafficChart
);

analyticsEditorRouter.get(
  "/top-articles",
  getEditorTopArticles
);

// ── Export routers ───────────────────────────────────────────────────────────

export {
  analyticsPublicRouter,
  analyticsAdminRouter,
  analyticsEditorRouter,
};