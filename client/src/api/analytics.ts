// src/api/admin/analytics.ts
// All analytics API calls consumed by the admin dashboard

const BASE = "http://localhost:5001/api/admin/analytics";
const PUBLIC_BASE = "http://localhost:5001/api/analytics";

// ── Admin API helpers ─────────────────────────────────────────

async function get(path: string, range?: number) {
  const q   = range ? `?range=${range}` : "";
  const res = await fetch(`${BASE}${path}${q}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Analytics API error: ${path}`);
  return res.json();
}

export async function fetchKPIs(range: number) {
  return get("/kpis", range);
}

export async function fetchTrafficChart(range: number) {
  return get("/traffic", range);
}

export async function fetchTrafficSources(range: number) {
  return get("/sources", range);
}

export async function fetchTopArticles(range: number, limit = 10) {
  const res = await fetch(`${BASE}/top-articles?range=${range}&limit=${limit}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Analytics API error: top-articles");
  return res.json();
}

export async function fetchLiveVisitors() {
  return get("/live-visitors");
}

export function getExportUrl(range: number) {
  return `${BASE}/export?range=${range}`;
}

// ── Public tracking helpers (called from article pages) ────────

// UPDATED: Added userEmail to the function signature and fetch body
export async function trackPageView(newsId: string, sessionId: string, userEmail?: string | null, referrer?: string) {
  try {
    await fetch(`${PUBLIC_BASE}/pageview`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ 
        newsId, 
        sessionId, 
        userEmail, 
        referrer: referrer ?? document.referrer 
      }),
    });
  } catch { /* fire-and-forget — never crash the page */ }
}

/** Call on page exit / visibility change with seconds spent */
export async function trackReadTime(newsId: string, sessionId: string, seconds: number) {
  try {
    // Use sendBeacon so it fires even when tab closes
    const payload = JSON.stringify({ newsId, sessionId, seconds });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${PUBLIC_BASE}/readtime`,
        new Blob([payload], { type: "application/json" })
      );
    } else {
      await fetch(`${PUBLIC_BASE}/readtime`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    payload,
        keepalive: true,
      });
    }
  } catch { /* fire-and-forget */ }
}