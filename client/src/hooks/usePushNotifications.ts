// client/src/hooks/usePushNotifications.ts
// Drop <NotificationBell /> (or call this hook directly) anywhere — e.g. the
// bell icon already in the navbar — to let a visitor opt in to device
// notifications for new articles.

import { useCallback, useEffect, useState } from "react";
import { getVapidPublicKey, subscribeToPush, unsubscribeFromPush } from "../api/user/push";

export type PushPermissionState = "unsupported" | "default" | "granted" | "denied";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermissionState);
  }, []);

  const enable = useCallback(async (email?: string) => {
    if (permission === "unsupported") return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermissionState);
      if (perm !== "granted") return;

      const { publicKey } = await getVapidPublicKey();
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast needed: newer TS DOM lib types `Uint8Array.buffer` as
        // ArrayBufferLike (which includes SharedArrayBuffer), but
        // applicationServerKey's BufferSource wants a strict ArrayBuffer.
        // The value here is always a plain ArrayBuffer at runtime.
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      await subscribeToPush(subscription.toJSON(), email);
    } finally {
      setLoading(false);
    }
  }, [permission]);

  const disable = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint);
        await sub.unsubscribe();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, loading, enable, disable };
}