import { apiClient } from "./client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ArticleTypeEnum = "STANDARD" | "BREAKING" | "LIVE" | "VIDEO";
export type StatusEnum      = "DRAFT" | "PUBLISHED" | "SCHEDULED";
export type PriorityEnum    = "CRITICAL" | "HIGH" | "MEDIUM";
export type StatusTypeEnum  = "published" | "paused";

export interface LiveUpdate {
  id:         number;
  time:       string;
  text:       string;
  timestamp?: string;
}

export interface NewsPayload {
  headline:    string;
  shortTitle?: string;
  content:     string;

  // ── Category — send UUID (categoryId) from the DB ──
  categoryId?: string;  // preferred: UUID from Category table
  category?:  string;   // legacy fallback (name string); controller auto-resolves

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
  expiryTime?: string; // ISO datetime

  // Live
  liveUpdates?: LiveUpdate[];

  // Video
  videoUrl?:      string;
  videoDuration?: string | number;
  videoQuality?:  string;

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
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const createNews = (data: NewsPayload) =>
  apiClient("/api/news/create", { method: "POST", body: JSON.stringify(data) });

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
  if (params?.categoryId)                                        qs.set("categoryId",  params.categoryId);
  if (params?.category)                                          qs.set("category",    params.category);
  if (params?.search)                                            qs.set("search",      params.search);
  if (params?.articleType)                                       qs.set("articleType", params.articleType);
  if (params?.status)                                            qs.set("status",      params.status);
  if (params?.priority && params.priority !== "All Priority")    qs.set("priority",    params.priority);
  if (params?.page)                                              qs.set("page",        String(params.page));
  if (params?.limit)                                             qs.set("limit",       String(params.limit));
  return apiClient(`/api/news?${qs.toString()}`);
};

export const fetchNewsBySlug = (slug: string) =>
  apiClient(`/api/news/${slug}`);

export const fetchNewsById = (id: string) =>
  apiClient(`/api/news/id/${id}`);

export const updateNews = (id: string, data: Partial<NewsPayload>) =>
  apiClient(`/api/news/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteNews = (id: string) =>
  apiClient(`/api/news/${id}`, { method: "DELETE" });

/** Toggle pause/resume for a BREAKING article */
export const togglePauseBreaking = (id: string) =>
  apiClient(`/api/news/${id}/pause-toggle`, { method: "PATCH" });

export const appendLiveUpdate = (id: string, text: string) =>
  apiClient(`/api/news/${id}/live-update`, {
    method: "POST",
    body:   JSON.stringify({ text }),
  });