// client/src/api/user/news.ts

import { apiClient } from "../client";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

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
}

export interface NewsResponse {
  news: NewsArticle[];
  total?: number;
  page?: number;
  pages?: number;
}

// ─────────────────────────────────────────────────────────────
// GET ALL NEWS
// Used for:
// - Homepage
// - Hero section
// - Latest news
// - Trending sections
// ─────────────────────────────────────────────────────────────

export const getAllNews = async (): Promise<NewsResponse> => {
  return apiClient("/api/news");
};

// ─────────────────────────────────────────────────────────────
// GET SINGLE ARTICLE BY SLUG
// Used for:
// /news/:slug page
// ─────────────────────────────────────────────────────────────

export const getNewsBySlug = async (
  slug: string
): Promise<NewsArticle> => {
  return apiClient(`/api/news/${slug}`);
};

// ─────────────────────────────────────────────────────────────
// GET BREAKING NEWS
// Used for:
// - Breaking ticker
// - Alert sections
// ─────────────────────────────────────────────────────────────

export const getBreakingNews = async (): Promise<NewsResponse> => {
  return apiClient("/api/news?articleType=BREAKING");
};

// ─────────────────────────────────────────────────────────────
// GET LIVE NEWS
// Used for:
// - Live updates page
// - Live cards
// ─────────────────────────────────────────────────────────────

export const getLiveNews = async (): Promise<NewsResponse> => {
  return apiClient("/api/news?articleType=LIVE");
};

// ─────────────────────────────────────────────────────────────
// GET NEWS BY CATEGORY
// Used for:
// - Sports page
// - Politics page
// - Technology page
// ─────────────────────────────────────────────────────────────

export const getNewsByCategory = async (
  categoryId: string
): Promise<NewsResponse> => {
  return apiClient(`/api/news?categoryId=${categoryId}`);
};

// ─────────────────────────────────────────────────────────────
// SEARCH NEWS
// Used for:
// - Search page
// - Navbar search
// ─────────────────────────────────────────────────────────────

export const searchNews = async (
  query: string
): Promise<NewsResponse> => {
  return apiClient(
    `/api/news?search=${encodeURIComponent(query)}`
  );
};