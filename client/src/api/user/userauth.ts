// client/src/api/userauth.ts
// All API calls go to the real backend. 
// Uses localStorage to persist auth state across new tabs.

import { apiClient, getAuthToken } from "../client";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profilePic?: string | null;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

// ─────────────────────────────────────────────

// TOKEN STORAGE
// ─────────────────────────────────────────────
// FIX: this used to be a plain in-memory variable (`_memoryToken`) that was
// never written to `sessionStorage`. `apiClient` (client.ts) reads the
// token from `sessionStorage.getItem("auth-token")`, so every call made
// through it — /api/users/me, /api/tags/trending, /api/categories,
// /api/user-notifications, /api/comments/*, etc. — went out with NO
// Authorization header at all, even immediately after a successful login.
// That's the actual cause of the "Not authorized, no token" 401s showing
// up across the whole app. `setMemoryToken`/`getMemoryToken` now read and
// write the same sessionStorage key `apiClient` uses, so the two are
// finally in sync. Function names/signatures are unchanged so callers
// (AuthContext, etc.) don't need to change.
const TOKEN_KEY = "auth-token";

export function setMemoryToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // sessionStorage unavailable -- fail silently.
  }
}

export function getMemoryToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse> {
  const json: AuthResponse = await apiClient("/api/users/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setMemoryToken(json.token);
  return json;
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const json: AuthResponse = await apiClient("/api/users/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setMemoryToken(json.token);
  return json;
}

// ─────────────────────────────────────────────
// GOOGLE AUTH
// Sends the Google credential (JWT id_token) to the backend.
// Backend verifies, upserts the SiteUser, returns our own JWT.
// ─────────────────────────────────────────────

export async function googleAuth(credential: string): Promise<AuthResponse> {
  const json: AuthResponse = await apiClient("/api/users/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  setMemoryToken(json.token);
  return json;
}

// ─────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────
// FIX: previously called unconditionally, so an anonymous visitor (no
// token yet) triggered a network round trip that was guaranteed to 401,
// plus a console.error from apiClient, on every page load / mount. Now
// short-circuits locally when there's no token, since the caller (e.g.
// AuthContext checking login state on mount) already treats any rejection
// here as "not logged in" -- behavior is identical, just quieter and
// without the wasted request.
export async function getMe(): Promise<{ user: AuthUser }> {
  if (!getAuthToken()) {
    return Promise.reject(new Error("Not authorized, no token"));
  }
  return apiClient("/api/users/me");
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  if (getAuthToken()) {
    await apiClient("/api/users/logout", { method: "POST" }).catch(() => {});
  }
  setMemoryToken(null);
}

// ─────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────

export async function updateProfile(data: {
  name?: string;
  email?: string;
  phone?: string;
  profilePic?: string | null;
}): Promise<{ message: string; user: AuthUser }> {
  return apiClient("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return apiClient("/api/users/change-password", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
// ─────────────────────────────────────────────
// READING HISTORY (last 7 days)
// ─────────────────────────────────────────────

export interface ReadingHistoryItem {
  id: string;
  slug: string;
  headline: string;
  category: string;
  image: string | null;
  readAt: string;
}

export async function getReadingHistory(): Promise<{ history: ReadingHistoryItem[] }> {
  if (!getAuthToken()) return Promise.reject(new Error("Not authorized, no token"));
  return apiClient("/api/users/reading-history");
}

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────

export interface AnalyticsData {
  totals: { reads: number; shares: number; timeLabel: string };
  dailyReading: { day: string; date: string; reads: number }[];
  categories: { label: string; value: number }[];
  platforms: { name: string; pct: number }[];
}

export async function getAnalytics(): Promise<AnalyticsData> {
  if (!getAuthToken()) return Promise.reject(new Error("Not authorized, no token"));
  return apiClient("/api/users/analytics");
}

// ─────────────────────────────────────────────
// TRACK READ / SHARE — call these from the article page
// ─────────────────────────────────────────────

export async function trackRead(newsId: string, durationSeconds = 0): Promise<void> {
  if (!getAuthToken()) return;
  await apiClient("/api/users/track-read", {
    method: "POST",
    body: JSON.stringify({ newsId, durationSeconds }),
  }).catch(() => {});
}

export async function trackShare(newsId: string, platform: string): Promise<void> {
  if (!getAuthToken()) return;
  await apiClient("/api/users/track-share", {
    method: "POST",
    body: JSON.stringify({ newsId, platform }),
  }).catch(() => {});
}