// server/src/routes/newsletter.routes.ts

import { Router } from "express";

import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from "../controllers/newsletter.controller";

const router = Router();

/** POST /api/newsletter/subscribe — footer subscribe box (public) */

router.post(
  "/subscribe",
  subscribeToNewsletter
);

/** GET /api/newsletter/unsubscribe/:token — one-click link from emails (public) */

router.get(
  "/unsubscribe/:token",
  unsubscribeFromNewsletter
);

export default router;