// src/api/admin/analytics.ts
// All analytics API calls consumed by the admin dashboard

// Use relative URLs so the Vite proxy forwards requests to localhost:5001
// and session cookies are included correctly.
const BASE        = "/api/admin/analytics";
const PUBLIC_BASE = "/api/analytics";
// Use the JWT stored in this browser tab. This keeps Admin and Editor sessions
// independent when both panels are open at the same time.
function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("auth-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    headers: { ...(init.headers || {}), ...getAuthHeaders() },
    credentials: "include",
  });
}


// ── Admin API helpers ─────────────────────────────────────────

async function get(path: string, range?: number) {
  const q   = range ? `?range=${range}` : "";
  const res = await authFetch(`${BASE}${path}${q}`);
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
  const res = await authFetch(`${BASE}/top-articles?range=${range}&limit=${limit}`);
  if (!res.ok) throw new Error("Analytics API error: top-articles");
  return res.json();
}

export async function fetchLiveVisitors() {
  return get("/live-visitors");
}

export async function fetchUserInsights() {
  const res = await authFetch(`${BASE}/user-insights`);
  if (!res.ok) throw new Error("Analytics API error: user-insights");
  return res.json();
}

export function getExportUrl(range: number) {
  return `${BASE}/export?range=${range}`;
}

// ── Resolve the logged-in user's email ───────────────────────────────────────
// Cached for the lifetime of the page so we don't call /me on every view.
let _cachedEmail: string | null = null;
let _emailFetched = false;

async function getLoggedInEmail(): Promise<string | null> {
  if (_emailFetched) return _cachedEmail;
  try {
    const res = await authFetch("/api/auth/me");
    if (!res.ok) { _cachedEmail = null; _emailFetched = true; return null; }
    const data = await res.json();
    // Support common response shapes: { email } or { user: { email } }
    _cachedEmail = data?.email ?? data?.user?.email ?? null;
    _emailFetched = true;
  } catch {
    _cachedEmail = null;
    _emailFetched = true;
  }
  return _cachedEmail;
}

// ── Public tracking helpers (called from article pages) ──────────────────────

/**
 * Track a page view. Returns a viewId that MUST be passed to trackReadTime.
 * The viewId ties this exact visit's read-time to the right PageView record,
 * so repeated visits by the same user each get their own read-time counted.
 */
export async function trackPageView(
  newsId: string,
  sessionId: string,
  userEmail?: string | null,
  referrer?: string,
): Promise<string | null> {
  try {
    const resolvedEmail = userEmail ?? await getLoggedInEmail();

    const res = await fetch(`${PUBLIC_BASE}/pageview`, {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        newsId,
        sessionId,
        userEmail: resolvedEmail,
        referrer:  referrer ?? document.referrer,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    // Backend returns { ok: true, viewId: "sessionId_timestamp" }
    return data.viewId ?? null;
  } catch {
    return null;
  }
}

/**
 * Send the active read time for this specific visit.
 *
 * @param newsId    - article being read
 * @param viewId    - returned by trackPageView; ties time to the right PageView record
 * @param seconds   - total ACTIVE seconds (tab visible + user on page), not wall-clock time
 *
 * Uses sendBeacon so it fires reliably even when the tab is closing.
 * Safe to call multiple times — the backend deduplicates using viewId.
 */
export function trackReadTime(newsId: string, viewId: string, seconds: number): void {
  if (seconds < 1) return; // nothing meaningful to record

  try {
    const payload = JSON.stringify({ newsId, viewId, seconds });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${PUBLIC_BASE}/readtime`,
        new Blob([payload], { type: "application/json" }),
      );
    } else {
      fetch(`${PUBLIC_BASE}/readtime`, {
        method:    "POST",
        headers:   { "Content-Type": "application/json" },
        body:      payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch { /* fire-and-forget */ }
}


// ── Editor analytics ────────────────────────────────────────────────────────

const EDITOR_BASE = "/api/analytics/editor";

async function getEditor(path: string, range?: number) {
  const q = range ? `?range=${range}` : "";

  const res = await authFetch(`${EDITOR_BASE}${path}${q}`);

  if (!res.ok) {
    throw new Error(`Editor Analytics API error: ${path}`);
  }

  return res.json();
}

export async function fetchEditorKPIs(range: number) {
  return getEditor("/kpis", range);
}

export async function fetchEditorTrafficChart(range: number) {
  return getEditor("/traffic", range);
}

export async function fetchEditorTopArticles(range: number, limit = 10) {
  const res = await authFetch(
    `${EDITOR_BASE}/top-articles?range=${range}&limit=${limit}`
  );

  if (!res.ok) {
    throw new Error("Editor Analytics API error: top-articles");
  }

  return res.json();
}