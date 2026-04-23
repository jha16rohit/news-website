import { apiClient } from "./client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ArticleTypeEnum = "STANDARD" | "BREAKING" | "LIVE" | "VIDEO";
export type StatusEnum      = "DRAFT" | "PUBLISHED" | "SCHEDULED";

export interface LiveUpdate {
  id:        number;
  time:      string;
  text:      string;
  timestamp?: string;
}

export interface NewsPayload {
  headline:    string;
  shortTitle?: string;
  content:     string;
  category:    string;
  language?:   string;
  location?:   string;
  tags?:       string[];
  articleType?: ArticleTypeEnum;

  // Breaking News extras
  breakingNewsTicker?:    boolean;
  breakingPushNotif?:     boolean;
  breakingHomepageAlert?: boolean;

  // Live Updates extras
  liveUpdates?: LiveUpdate[];

  // Video Story extras
  videoUrl?:      string;
  videoDuration?: string;
  videoQuality?:  string;

  // Featured media
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
  publishAt?: string; // ISO datetime string — used when status === "SCHEDULED"
}

// ─── API calls ─────────────────────────────────────────────────────────────────

/** Create a new article */
export const createNews = async (data: NewsPayload) =>
apiClient("/api/news/create", {
      method: "POST",
    body:   JSON.stringify(data),
  });

/** Fetch paginated/filtered list */
export const fetchAllNews = async (params?: {
  category?:    string;
  search?:      string;
  articleType?: ArticleTypeEnum;
  status?:      StatusEnum;
  page?:        number;
  limit?:       number;
}) => {
  const qs = new URLSearchParams();
  if (params?.category)    qs.set("category",    params.category);
  if (params?.search)      qs.set("search",      params.search);
  if (params?.articleType) qs.set("articleType", params.articleType);
  if (params?.status)      qs.set("status",      params.status);
  if (params?.page)        qs.set("page",        String(params.page));
  if (params?.limit)       qs.set("limit",       String(params.limit));
  return apiClient(`/api/news?${qs.toString()}`);
};

// ✅ Fetch by slug
export const fetchNewsBySlug = async (slug: string) =>
  apiClient(`/api/news/${slug}`);

// ✅ Fetch by ID
export const fetchNewsById = async (id: string) =>
  apiClient(`/api/news/id/${id}`);

// ✅ Update
export const updateNews = async (id: string, data: Partial<NewsPayload>) =>
  apiClient(`/api/news/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

// ✅ Delete
export const deleteNews = async (id: string) =>
  apiClient(`/api/news/${id}`, { method: "DELETE" });

// ✅ Live update
export const appendLiveUpdate = async (id: string, text: string) =>
  apiClient(`/api/news/${id}/live-update`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });