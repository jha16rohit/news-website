import { apiClient } from "./client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ArticleTypeEnum = "STANDARD" | "BREAKING" | "LIVE";
export type StatusEnum      = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "EXPIRED" | "DELETED";
export type PriorityEnum    = "CRITICAL" | "HIGH" | "MEDIUM";
export type StatusTypeEnum  = "published" | "paused";
export type DeleteModeEnum  = "instant" | "interval";

export interface LiveUpdate {
  id:         number;
  time:       string;
  text:       string;
  timestamp?: string;
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
  const res = await fetch("http://localhost:5001/api/news/create", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Bubble up the server error message so the UI can display it
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

// ─── GET ───────────────────────────────────────────────────────────────────────
export const fetchNewsBySlug = (slug: string) =>
  apiClient(`/api/news/${slug}`);

export const fetchNewsById = (id: string) =>
  apiClient(`/api/news/id/${id}`);

// ─── UPDATE ────────────────────────────────────────────────────────────────────
export const updateNews = (id: string, data: Partial<NewsPayload>) =>
  apiClient(`/api/news/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

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
export const appendLiveUpdate = (id: string, text: string) =>
  apiClient(`/api/news/${id}/live-update`, {
    method: "POST",
    body: JSON.stringify({ text }),
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