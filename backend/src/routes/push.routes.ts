// server/src/routes/push.routes.ts
import { Router } from "express";
import {
  getVapidPublicKey,
  subscribeToPush,
  unsubscribeFromPush,
} from "../controllers/push.controller";

const router = Router();

/** GET  /api/push/vapid-public-key — frontend fetches this before subscribing (public) */
router.get("/vapid-public-key", getVapidPublicKey);

/** POST /api/push/subscribe        — save a browser's push subscription (public) */
router.post("/subscribe", subscribeToPush);

/** POST /api/push/unsubscribe      — remove a browser's push subscription (public) */
router.post("/unsubscribe", unsubscribeFromPush);

export default router;