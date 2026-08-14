// server/src/lib/webpush.ts
// npm install web-push
// npm install -D @types/web-push
import webpush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:admin@localnewz.example";

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set in .env. Generate a pair with: npx web-push generate-vapid-keys"
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function getWebPush() {
  ensureConfigured();
  return webpush;
}

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY?.trim() || "";