// server/src/controllers/push.controller.ts
import { Request, Response } from "express";
import PushSubscription from "../models/PushSubscription";
import { VAPID_PUBLIC_KEY } from "../utils/webpush";

// ══════════════════════════════════════════════════════════════
//  GET /api/push/vapid-public-key   (public — frontend needs this to subscribe)
// ══════════════════════════════════════════════════════════════
export const getVapidPublicKey = (_req: Request, res: Response) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(500).json({ message: "Push notifications are not configured on the server." });
  }
  return res.json({ publicKey: VAPID_PUBLIC_KEY });
};

// ══════════════════════════════════════════════════════════════
//  POST /api/push/subscribe   (public)
//  body: { subscription: PushSubscriptionJSON, email?: string }
// ══════════════════════════════════════════════════════════════
export const subscribeToPush = async (req: Request, res: Response) => {
  try {
    const { subscription, email } = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ message: "Invalid push subscription payload." });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        email: typeof email === "string" ? email.trim().toLowerCase() : undefined,
        userAgent: req.headers["user-agent"],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ message: "Device notifications enabled." });
  } catch (err: any) {
    console.error("subscribeToPush error:", err);
    return res.status(500).json({ message: err.message || "Something went wrong." });
  }
};

// ══════════════════════════════════════════════════════════════
//  POST /api/push/unsubscribe   (public)
//  body: { endpoint: string }
// ══════════════════════════════════════════════════════════════
export const unsubscribeFromPush = async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ message: "endpoint is required." });
    }
    await PushSubscription.deleteOne({ endpoint });
    return res.json({ message: "Device notifications disabled." });
  } catch (err: any) {
    console.error("unsubscribeFromPush error:", err);
    return res.status(500).json({ message: err.message });
  }
};