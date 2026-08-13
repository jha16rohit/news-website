// client/src/api/userauth.ts
// All API calls go to the real backend. No localStorage.
// Components/context cache the returned user in React state / context.

import { apiClient } from "../client";

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
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

// ─────────────────────────────────────────────
// IN-MEMORY TOKEN
// ─────────────────────────────────────────────

let _memoryToken: string | null = null;

export function setMemoryToken(token: string | null): void {
  _memoryToken = token;
}

export function getMemoryToken(): string | null {
  return _memoryToken;
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

export async function getMe(): Promise<{ user: AuthUser }> {
  return apiClient("/api/users/me");
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await apiClient("/api/users/logout", { method: "POST" });
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
  return apiClient("/api/users/analytics");
}

// ─────────────────────────────────────────────
// TRACK READ / SHARE — call these from the article page
// ─────────────────────────────────────────────

export async function trackRead(newsId: string, durationSeconds = 0): Promise<void> {
  await apiClient("/api/users/track-read", {
    method: "POST",
    body: JSON.stringify({ newsId, durationSeconds }),
  }).catch(() => {});
}

export async function trackShare(newsId: string, platform: string): Promise<void> {
  await apiClient("/api/users/track-share", {
    method: "POST",
    body: JSON.stringify({ newsId, platform }),
  }).catch(() => {});
}