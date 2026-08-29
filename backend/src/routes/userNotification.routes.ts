// server/src/routes/userNotification.routes.ts

import { Router } from "express";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/userNotification.controller";
import { protectSiteUser } from "../middleware/Siteuserauth.middleware";

const router = Router();

router.use(protectSiteUser);

// ── Disable HTTP caching on this whole router ──────────────────
// Express auto-generates an ETag on every JSON response. Since this
// endpoint is polled every 60s from UserNavbar, the browser was
// sending `If-None-Match` on each poll and — because Express's default
// weak ETag can collide/round-trip identically under some proxy/cache
// configs — getting back a bare 304, which makes the browser reuse
// whatever (possibly stale/empty) body it cached from the FIRST
// request. That's why new notifications never appeared without a
// hard refresh. This forces every request here to hit the DB fresh.
router.use((_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

/** GET  /api/user-notifications             — my feed (broadcasts + personal) */
router.get("/", getMyNotifications);

/** POST /api/user-notifications/:id/read    — mark one as read */
router.post("/:id/read", markNotificationRead);

/** POST /api/user-notifications/mark-all-read */
router.post("/mark-all-read", markAllNotificationsRead);

export default router;