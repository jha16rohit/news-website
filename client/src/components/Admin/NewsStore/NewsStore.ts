// NewsStore.ts  — full type definitions + context

import { createContext, useContext } from "react";

// ─── LiveUpdate ────────────────────────────────────────────────────────────────
export interface LiveUpdate {
  id:         number;
  time:       string;
  text:       string;
  timestamp?: string;
}

// ─── Article ───────────────────────────────────────────────────────────────────
export interface Article {
  id:             number;
  title:          string;
  subtitle?:      string;
  category:       string;
  articleCategory?: string;
  authorFirst?:   string;
  authorLast?:    string;
  status:         string;
  statusType:     string;
  priority:       "High" | "Medium" | "Normal";
  priorityType:   string;
  published:      string;
  views:          string;
  tag?:           string;
  tagType?:       string;
  leftBorder?:    string;
  isTopStory?:    boolean;
  isPinned?:      boolean;

  // Breaking-specific
  channels?:      string[];
  expiryTime?:    string;

  // Live-specific
  liveStartedAt?: string;
  liveUpdates?:   LiveUpdate[];
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id:          string;           // ← string (UUID), NOT number
  name:        string;
  description?: string;
  articles?:   string;
  views?:      string;
  featured?:   boolean;
  enabled?:    boolean;
  color?:      string;
  parentId?:   string | null;
  inShowcase?: boolean;
  _count?: {
    news: number;
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────
export interface NewsStore {
  articles:         Article[];
  setArticles:      (a: Article[]) => void;
  addArticle:       (article: Omit<Article, "id">) => void;
  updateArticle:    (id: number, patch: Partial<Article>) => void;
  deleteArticle:    (id: number) => void;
  convertToBreaking:(id: number) => void;
  convertToLive:    (id: number) => void;
  endLive:          (id: number) => void;
  promoteToBreaking:(ids: number[]) => void;
  addLiveUpdate:    (articleId: number, text: string) => void;
  togglePause:      (id: number) => void;
  increasePriority: (id: number) => void;
  decreasePriority: (id: number) => void;

  categories:       Category[];
  addCategory:      (category: Omit<Category, "id">) => void;
  updateCategory:   (id: string, patch: Partial<Category>) => void;
  deleteCategory:   (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
export const NewsContext = createContext<NewsStore | null>(null);

export function useNews(): NewsStore {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used inside <NewsProvider>");
  return ctx;
}