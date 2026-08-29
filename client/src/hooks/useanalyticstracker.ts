// src/hooks/useAnalyticsTracker.ts
// ─────────────────────────────────────────────
// No external packages needed — uses crypto.randomUUID() built into every
// modern browser (Chrome 92+, Firefox 95+, Safari 15.4+).
//
// Usage in ArticalDetails.tsx:
//   import { useAnalyticsTracker } from "../../../hooks/useAnalyticsTracker";
//   // inside the component body:
//   useAnalyticsTracker(article?.id ?? null);

import { useEffect, useRef } from "react";
import { trackPageView, trackReadTime } from "../api/analytics";

export function useAnalyticsTracker(newsId: string | null) {
  // Generate a stable session ID once per component mount
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36) // SSR-safe fallback
  );
  const startRef = useRef<number>(Date.now());
  const sentRef  = useRef<boolean>(false);

  useEffect(() => {
    if (!newsId) return;

    const sessionId = sessionIdRef.current;
    startRef.current = Date.now();
    sentRef.current  = false;

    // Fire page view immediately (fire-and-forget)
    trackPageView(newsId, sessionId, document.referrer);

    const sendTime = () => {
      if (sentRef.current) return;
      sentRef.current = true;
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      trackReadTime(newsId, sessionId, seconds);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendTime();
    };

    window.addEventListener("beforeunload", sendTime);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      sendTime(); // fires on React route change / unmount
      window.removeEventListener("beforeunload", sendTime);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [newsId]);
}