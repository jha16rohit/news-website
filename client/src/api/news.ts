import { apiClient } from "./client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ArticleTypeEnum = "STANDARD" | "BREAKING" | "LIVE";
export type StatusEnum      = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "DELETED";
export type PriorityEnum    = "CRITICAL" | "HIGH" | "MEDIUM";
export type StatusTypeEnum  = "published" | "paused";
export type DeleteModeEnum  = "instant" | "interval";

export interface PollOption {
  label: string;
  votes: number;
}

export interface PollData {
  question: string;
  options:  PollOption[];
}

export interface LiveUpdate {
  id:            number;
  time:          string;
  text:          string;
  timestamp?:    string;
  title?:        string;
  isHighlight?:  boolean;
  isBreaking?:   boolean;
  imageUrl?:     string;
  imageCaption?: string;
  imageCredit?:  string;
  tweetUrl?:     string;
  poll?:         PollData;
  sourceUrl?:    string;
  sourceLabel?:  string;
  tags?:         string[];
}

// Payload for the POST /:id/live-update endpoint
export interface LiveUpdatePayload {
  text?:         string;
  title?:        string;
  imageUrl?:     string;
  imageCaption?: string;
  imageCredit?:  string;
  tweetUrl?:     string;
  poll?:         PollData;
  sourceUrl?:    string;
  sourceLabel?:  string;
  tags?:         string[];
  isHighlight?:  boolean;
  isBreaking?:   boolean;
}

export interface NewsPayload {
  headline:    string;
  shortTitle?: string;
  excerpt?:    string;
  content:     string;

  categoryId?: string;
  category?:   string;

  language?:  string;
  location?:  string;
  tags?:      string[];
  articleType?: ArticleTypeEnum;

  // Breaking extras
  breakingNewsTicker?:    boolean;
  breakingPushNotif?:     boolean;
  breakingHomepageAlert?: boolean;
  priority?:   PriorityEnum;
  statusType?: StatusTypeEnum;
  expiryTime?: string;

  // Live
  liveUpdates?: LiveUpdate[];

  // Media
  featuredImage?: string;
  imageCaption?:  string;
  photoCredit?:   string;

  // SEO
  metaTitle?:       string;
  metaDescription?: string;
  keywords?:        string[];
  focusKeywords?:   string;
  canonicalUrl?:    string;

  // Publishing
  status?:    StatusEnum;
  publishAt?: string;

  // Delete options
  deleteMode?:         DeleteModeEnum;
  deleteIntervalDays?: number;
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const createNews = (data: NewsPayload) =>
  apiClient("/api/news/create", {
    method: "POST",
    body: JSON.stringify(data),
  });

// 🔥 CREATE WITH MEDIA — throws on server error so callers can catch it
export const createNewsWithMedia = async (formData: FormData): Promise<any> => {
  const res = await fetch("/api/news/create", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.message || `Server error ${res.status}`);
  }

  return json;
};

// ─── FETCH ALL ────────────────────────────────────────────────────────────────
export const fetchAllNews = (params?: {
  categoryId?:  string;
  category?:    string;
  search?:      string;
  articleType?: ArticleTypeEnum;
  status?:      StatusEnum;
  priority?:    PriorityEnum | "All Priority";
  page?:        number;
  limit?:       number;
}) => {
  const qs = new URLSearchParams();

  if (params?.categoryId)                                     qs.set("categoryId", params.categoryId);
  if (params?.category)                                       qs.set("category", params.category);
  if (params?.search)                                         qs.set("search", params.search);
  if (params?.articleType)                                    qs.set("articleType", params.articleType);
  if (params?.status)                                         qs.set("status", params.status);
  if (params?.priority && params.priority !== "All Priority") qs.set("priority", params.priority);
  if (params?.page)                                           qs.set("page", String(params.page));
  if (params?.limit)                                          qs.set("limit", String(params.limit));

  return apiClient(`/api/news?${qs.toString()}`);
};

// ─── FETCH ALL (ADMIN — every status: draft/scheduled/published/etc.) ─────────
// The public fetchAllNews() above now hits the public "/api/news" route,
// which only ever returns PUBLISHED articles (so drafts/scheduled articles
// never leak onto the live site). The admin dashboard (All News, Scheduled &
// Drafts) needs to see every status, so it uses this instead, which hits the
// protected "/api/news/admin/all" route.
export const fetchAdminNews = (params?: {
  categoryId?:  string;
  category?:    string;
  search?:      string;
  articleType?: ArticleTypeEnum;
  status?:      StatusEnum;
  priority?:    PriorityEnum | "All Priority";
  page?:        number;
  limit?:       number;
}) => {
  const qs = new URLSearchParams();

  if (params?.categoryId)                                     qs.set("categoryId", params.categoryId);
  if (params?.category)                                       qs.set("category", params.category);
  if (params?.search)                                         qs.set("search", params.search);
  if (params?.articleType)                                    qs.set("articleType", params.articleType);
  if (params?.status)                                         qs.set("status", params.status);
  if (params?.priority && params.priority !== "All Priority") qs.set("priority", params.priority);
  if (params?.page)                                           qs.set("page", String(params.page));
  if (params?.limit)                                          qs.set("limit", String(params.limit));

  return apiClient(`/api/news/admin/all?${qs.toString()}`);
};

// ─── GET ───────────────────────────────────────────────────────────────────────
export const fetchNewsBySlug = (slug: string) =>
  apiClient(`/api/news/slug/${slug}`);

export const fetchNewsById = (id: string) =>
  apiClient(`/api/news/${id}`);

// ─── UPDATE ────────────────────────────────────────────────────────────────────
export const updateNews = (id: string, data: Partial<NewsPayload>) =>
  apiClient(`/api/news/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

// 🖼️ UPDATE WITH MEDIA — sends multipart/form-data so the featured image can be
// replaced at the same time as other fields are updated.
export const updateNewsWithMedia = async (id: string, formData: FormData): Promise<any> => {
  const res = await fetch(`/api/news/${id}`, {
    method: "PUT",
    body: formData,
    credentials: "include",
    // Do NOT set Content-Type — browser sets it with the correct boundary automatically.
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.message || `Server error ${res.status}`);
  }

  return json;
};

// ─── DELETE ────────────────────────────────────────────────────────────────────
export const deleteNews = (
  id: string,
  opts?: { deleteMode?: DeleteModeEnum; deleteIntervalDays?: number }
) =>
  apiClient(`/api/news/${id}`, {
    method: "DELETE",
    body: JSON.stringify(opts ?? {}),
  });

// ─── BREAKING ──────────────────────────────────────────────────────────────────
export const togglePauseBreaking = (id: string) =>
  apiClient(`/api/news/${id}/pause-toggle`, { method: "PATCH" });

// ─── LIVE UPDATE ───────────────────────────────────────────────────────────────
// Appends a rich update to a live article's liveUpdates array.
// The backend prepends it (newest first) and persists to DB.
export const appendLiveUpdate = (id: string, payload: LiveUpdatePayload): Promise<any> =>
  apiClient(`/api/news/${id}/live-update`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

// ─── MEDIA LIBRARY ─────────────────────────────────────────────────────────────
export const fetchMediaLibrary = (params?: { page?: number; limit?: number }) => {
  const qs = new URLSearchParams();

  if (params?.page)  qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  return apiClient(`/api/news/media-library?${qs.toString()}`);
};

// ─── DELETE MEDIA IMAGE ────────────────────────────────────────────────────────
// Removes the featuredImage from a specific news article
export const deleteMediaImage = (newsId: string) =>
  apiClient(`/api/news/media-library/${newsId}`, {
    method: "DELETE",
  });


  // ─── UPLOAD / REPLACE MEDIA IMAGE ─────────────────────────────────────────────
export const uploadMediaImage = async (
  newsId: string,
  file: File
): Promise<any> => {
  const formData = new FormData();

  formData.append("image", file);

  const res = await fetch(`/api/news/media-library/${newsId}/upload`, {
    method: "PATCH",
    body: formData,
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.message || `Server error ${res.status}`);
  }

  return json;
};

  // ─── BREAKING TICKER NEWS ───────────────────────────────────────
export const getBreakingTickerNews = async () => {

  return apiClient(
    "/api/news/breaking-ticker"
  );
};

// ─── VIEW TRACKING ───────────────────────────────────────────────────────────
// One sessionId per browser tab (survives re-renders/StrictMode double-mounts,
// resets on a fresh tab). The server dedupes on newsId+sessionId+5s window,
// so calling trackPageView more than once for the same visit is harmless —
// only the first call actually increments the view count.
const SESSION_KEY = "ln_session_id";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export const trackPageView = (
  newsId: string,
  source: "direct" | "google" | "social" | "other" = "direct"
): Promise<{ success: boolean; counted: boolean; viewId: string }> =>
  apiClient("/api/news/track-view", {
    method: "POST",
    body: JSON.stringify({ newsId, sessionId: getSessionId(), source }),
  });

export const trackReadTime = (viewId: string, readTime: number) =>
  apiClient("/api/news/track-read-time", {
    method: "POST",
    body: JSON.stringify({ viewId, readTime }),
  });