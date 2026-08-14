// server/src/controllers/newsletter.controller.ts
import { Request, Response } from "express";
import crypto from "crypto";
import { Resend } from "resend";
import NewsletterSubscriber from "../models/NewsletterSubscriber";
import PushSubscription from "../models/PushSubscription";
import { getWebPush } from "../utils/webpush";

// ── Resend client (same pattern as advertisement.controller.ts) ──────────────
let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) throw new Error("RESEND_API_KEY is not set in .env");
    resendClient = new Resend(key);
  }
  return resendClient;
}

const SITE_URL = process.env.SITE_URL?.trim() || "http://localhost:3000";
const FROM = process.env.RESEND_FROM?.trim() || "Local Newz <onboarding@resend.dev>";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ══════════════════════════════════════════════════════════════
//  POST /api/newsletter/subscribe   (public)
// ══════════════════════════════════════════════════════════════
export const subscribeToNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !isValidEmail(email.trim())) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await NewsletterSubscriber.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.isActive) {
        return res
          .status(200)
          .json({ message: "You're already subscribed!", alreadySubscribed: true });
      }
      // Re-activate a previously unsubscribed email
      existing.isActive = true;
      existing.subscribedAt = new Date();
      await existing.save();
      sendWelcomeEmail(existing.email, existing.unsubscribeToken).catch((err) =>
        console.error("[Newsletter] Welcome email failed:", err)
      );
      return res.status(200).json({ message: "Welcome back! You're subscribed again." });
    }

    const unsubscribeToken = crypto.randomBytes(24).toString("hex");
    const subscriber = await NewsletterSubscriber.create({
      email: normalizedEmail,
      unsubscribeToken,
    });

    sendWelcomeEmail(subscriber.email, subscriber.unsubscribeToken).catch((err) =>
      console.error("[Newsletter] Welcome email failed:", err)
    );

    return res
      .status(201)
      .json({ message: "Subscribed! Check your inbox for a confirmation email." });
  } catch (err: any) {
    console.error("subscribeToNewsletter error:", err);
    return res.status(500).json({ message: err.message || "Something went wrong." });
  }
};

// ══════════════════════════════════════════════════════════════
//  GET /api/newsletter/unsubscribe/:token   (public, clicked from email)
// ══════════════════════════════════════════════════════════════
export const unsubscribeFromNewsletter = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const subscriber = await NewsletterSubscriber.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return res.status(404).json({ message: "Subscription not found." });
    }

    subscriber.isActive = false;
    await subscriber.save();

    return res.json({ message: "You have been unsubscribed from Local Newz emails." });
  } catch (err: any) {
    console.error("unsubscribeFromNewsletter error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// ── Welcome email ─────────────────────────────────────────────────────────────
async function sendWelcomeEmail(email: string, unsubscribeToken: string): Promise<void> {
  const unsubscribeUrl = `${SITE_URL.replace(/\/$/, "")}/api/newsletter/unsubscribe/${unsubscribeToken}`;

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to: [email],
    subject: "🎉 You're subscribed to Local Newz!",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
          <div style="width:36px;height:36px;background:#e10600;border-radius:8px;display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-size:18px;font-weight:700">L</span>
          </div>
          <div style="font-size:18px;font-weight:700;color:#111">Local Newz</div>
        </div>
        <h2 style="color:#111;margin:0 0 8px">Welcome aboard!</h2>
        <p style="color:#555;font-size:14px;line-height:1.6">
          Thanks for subscribing. You'll now get an email whenever we publish a new story.
        </p>
        <p style="color:#aaa;font-size:11px;margin-top:32px">
          Didn't sign up for this? <a href="${unsubscribeUrl}" style="color:#e10600">Unsubscribe here</a>.
        </p>
      </div>
    `,
  });

  // IMPORTANT: Resend returns success (HTTP 200) with an `error` object in the
  // body when the send itself is rejected — it does NOT throw. That's why the
  // route can respond "Subscribed! Check your inbox" even when zero mail goes
  // out. Log the full object (not just .message) so the real reason shows up.
  if (error) {
    console.error("[Newsletter] Resend REJECTED the welcome email:", JSON.stringify(error, null, 2));
    console.error(
      "[Newsletter] Common cause: the shared 'onboarding@resend.dev' sender can only deliver to the " +
        "email address of the Resend account owner until you verify your own sending domain in the " +
        "Resend dashboard (Domains → Add Domain). Everything else silently bounces."
    );
  } else {
    console.log(`[Newsletter] Welcome email accepted by Resend → ${email} (id: ${data?.id})`);
  }
}

// ══════════════════════════════════════════════════════════════
//  Push notification for a newly published article
// ══════════════════════════════════════════════════════════════
async function notifyPushSubscribersOfNewArticle(article: {
  headline: string;
  slug: string;
  shortDescription?: string;
}): Promise<void> {
  const subs = await PushSubscription.find({});
  if (subs.length === 0) return;

  const webpush = getWebPush();
  const payload = JSON.stringify({
    title: "📰 Local Newz",
    body: article.headline,
    url: `${SITE_URL.replace(/\/$/, "")}/article/${article.slug}`,
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        },
        payload
      )
    )
  );

  // Clean up subscriptions the browser/OS has revoked (410 Gone / 404) so we
  // stop retrying dead endpoints on every future article.
  const deadEndpoints: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const statusCode = (r.reason as any)?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        deadEndpoints.push(subs[i].endpoint);
      } else {
        console.error("[Newsletter] Push send failed:", r.reason);
      }
    }
  });
  if (deadEndpoints.length > 0) {
    await PushSubscription.deleteMany({ endpoint: { $in: deadEndpoints } });
  }

  console.log(`[Newsletter] Push-notified ${subs.length} device(s) about "${article.headline}"`);
}

// ══════════════════════════════════════════════════════════════
//  notifySubscribersOfNewArticle
//  NOT a route handler — call this yourself from wherever your News
//  controller marks an article as published, e.g.:
//
//    import { notifySubscribersOfNewArticle } from "./newsletter.controller";
//    ...
//    await news.save();
//    notifySubscribersOfNewArticle({
//      headline: news.headline,
//      slug: news.slug,
//      shortDescription: news.shortDescription,
//      coverImage: news.coverImage,
//    }).catch((err) => console.error("[Newsletter] Notify failed:", err));
//
//  This now fans out to BOTH channels: email (Resend) and browser/device
//  push notifications (web-push), in parallel.
// ══════════════════════════════════════════════════════════════
export async function notifySubscribersOfNewArticle(article: {
  headline: string;
  slug: string;
  shortDescription?: string;
  coverImage?: string;
}): Promise<void> {
  await Promise.allSettled([
    notifyEmailSubscribersOfNewArticle(article),
    notifyPushSubscribersOfNewArticle(article),
  ]);
}

async function notifyEmailSubscribersOfNewArticle(article: {
  headline: string;
  slug: string;
  shortDescription?: string;
  coverImage?: string;
}): Promise<void> {
  const subscribers = await NewsletterSubscriber.find({ isActive: true }).select(
    "email unsubscribeToken"
  );
  if (subscribers.length === 0) return;

  const articleUrl = `${SITE_URL.replace(/\/$/, "")}/article/${article.slug}`;

  // Resend doesn't cleanly support one bulk call with per-recipient unsubscribe
  // links, so we send individually in small batches to stay under rate limits.
  const BATCH_SIZE = 20;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((sub) => {
        const unsubscribeUrl = `${SITE_URL.replace(/\/$/, "")}/api/newsletter/unsubscribe/${sub.unsubscribeToken}`;
        return getResend().emails.send({
          from: FROM,
          to: [sub.email],
          subject: `📰 New on Local Newz: ${article.headline}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
              ${article.coverImage ? `<img src="${article.coverImage}" style="width:100%;border-radius:8px;margin-bottom:16px" />` : ""}
              <h2 style="color:#111;margin:0 0 8px">${article.headline}</h2>
              ${article.shortDescription ? `<p style="color:#555;font-size:14px;line-height:1.6">${article.shortDescription}</p>` : ""}
              <a href="${articleUrl}" style="display:inline-block;margin-top:16px;background:#e10600;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Read Full Story →</a>
              <p style="color:#aaa;font-size:11px;margin-top:32px">
                <a href="${unsubscribeUrl}" style="color:#aaa">Unsubscribe</a> from these emails.
              </p>
            </div>
          `,
        });
      })
    );
    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value.error) {
        console.error("[Newsletter] Resend rejected an article email:", JSON.stringify(r.value.error));
      } else if (r.status === "rejected") {
        console.error("[Newsletter] Article email send threw:", r.reason);
      }
    });
  }

  console.log(`[Newsletter] Notified ${subscribers.length} email subscriber(s) about "${article.headline}"`);
}