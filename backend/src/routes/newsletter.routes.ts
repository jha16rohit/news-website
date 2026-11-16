// server/src/routes/newsletter.routes.ts

import { Router } from "express";

import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getPublicFrontendUrl,
} from "../controllers/newsletter.controller";

const router = Router();

/** POST /api/newsletter/subscribe — footer subscribe box (public) */

router.post(
  "/subscribe",
  subscribeToNewsletter
);

/** POST /api/newsletter/unsubscribe — one-click unsubscribe from frontend (public) */
router.post(
  "/unsubscribe",
  unsubscribeFromNewsletter
);

/** GET /api/newsletter/unsubscribe/:token — legacy backend unsubscribe link → redirect to frontend */
router.get(
  "/unsubscribe/:token",
  (req, res) => {
    const frontendUrl = getPublicFrontendUrl().replace(/\/$/, "");
    return res.redirect(302, `${frontendUrl}/unsubscribe?token=${req.params.token}`);
  }
);

export default router;