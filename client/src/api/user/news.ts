// client/src/api/user/news.ts

import { apiClient } from "../client";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface Author {
  id: string;
  name: string;
  role?: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  shortTitle?: string;
  excerpt?: string;
  content: string;
  slug: string;
  featuredImage?: string;
  imageCaption?: string;
  photoCredit?: string;
  articleType: "STANDARD" | "BREAKING" | "LIVE";
  language?: string;
  location?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  category?: Category;
  author?: Author;
  // Breaking extras
  breakingNewsTicker?: boolean;
  statusType?: string;
  priority?: string;
  // Live extras
  liveUpdates?: any[];
}

export interface NewsResponse {
  news: NewsArticle[];
  total?: number;
  page?: number;
  pages?: number;
}

// ─── GET ALL (PUBLISHED) ──────────────────────────────────────────────────────
// Accepts optional filters; always hits the public endpoint.
export const getAllNews = async (params?: {
  articleType?: "STANDARD" | "BREAKING" | "LIVE";
  categoryId?:  string;
  search?:      string;
  page?:        number;
  limit?:       number;
}): Promise<NewsResponse> => {
  const qs = new URLSearchParams();
  if (params?.articleType) qs.set("articleType", params.articleType);
  if (params?.categoryId)  qs.set("categoryId",  params.categoryId);
  if (params?.search)      qs.set("search",       params.search);
  if (params?.page)        qs.set("page",         String(params.page));
  if (params?.limit)       qs.set("limit",        String(params.limit));

  const query = qs.toString();
  return apiClient(`/api/news${query ? `?${query}` : ""}`);
};

// Returns maximum 5 pinned published articles.
export const getHomepageNews = async (): Promise<NewsResponse> =>
  apiClient("/api/news/homepage");

// ─── GET SINGLE ARTICLE BY SLUG ───────────────────────────────────────────────
export const getNewsBySlug = async (slug: string): Promise<NewsArticle> =>
  apiClient(`/api/news/${slug}`);

// ─── BREAKING NEWS ────────────────────────────────────────────────────────────
export const getBreakingNews = async (): Promise<NewsResponse> =>
  apiClient("/api/news?articleType=BREAKING");

// ─── BREAKING NEWS TICKER (headline strip) ────────────────────────────────────
// FIX: this previously only existed in the admin api client (client/src/api/news.ts),
// so public/user-facing components had no correct place to import it from without
// reaching into the admin module (which doesn't export searchNews/NewsArticle and
// caused TS2305 errors in UserNavbar.tsx). It hits the same public, unauthenticated
// "/api/news/breaking-ticker" route — just exposed from the public client too.
export const getBreakingTickerNews = async (): Promise<{ success: boolean; headlines: string[] }> =>
  apiClient("/api/news/breaking-ticker");

// ─── LIVE NEWS ────────────────────────────────────────────────────────────────
export const getLiveNews = async (): Promise<NewsResponse> =>
  apiClient("/api/news?articleType=LIVE");

// ─── NEWS BY CATEGORY ─────────────────────────────────────────────────────────
export const getNewsByCategory = async (
  categoryId: string,
  params?: { page?: number; limit?: number }
): Promise<NewsResponse> => {
  const qs = new URLSearchParams({ categoryId });
  if (params?.page)  qs.set("page",  String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  return apiClient(`/api/news?${qs.toString()}`);
};

// ─── SEARCH NEWS ──────────────────────────────────────────────────────────────
export const searchNews = async (
  query: string,
  params?: { page?: number; limit?: number }
): Promise<NewsResponse> => {
  const qs = new URLSearchParams({ search: query });
  if (params?.page)  qs.set("page",  String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  return apiClient(`/api/news?${qs.toString()}`);
};