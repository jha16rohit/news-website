// NewsStore.ts — full type definitions + context

import { createContext, useContext } from "react";

// ─── LiveUpdate ────────────────────────────────────────────────────────────────
export interface LiveUpdate {
  id:         string | number; // Updated to match flexible backend dynamic UUIDs
  time:       string;
  text:       string;
  timestamp?: string;
}

// ─── Article ───────────────────────────────────────────────────────────────────
export interface Article {
  id:             string; // ← CHANGED FROM number TO string TO MATCH MONGO/_ID
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
  id:          string;           
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
  updateArticle:    (id: string, patch: Partial<Article>) => void; // ← Changed id type to string
  deleteArticle:    (id: string) => void;                          // ← Changed id type to string
  convertToBreaking:(id: string) => void;                          // ← Changed id type to string
  convertToLive:    (id: string) => void;                          // ← Changed id type to string
  endLive:          (id: string) => void;                          // ← Changed id type to string
  promoteToBreaking:(ids: string[]) => void;                       // ← Changed id type to string[]
  addLiveUpdate:    (articleId: string, text: string) => void;     // ← Changed id type to string
  togglePause:      (id: string) => void;                          // ← Changed id type to string
  increasePriority: (id: string) => void;                          // ← Changed id type to string
  decreasePriority: (id: string) => void;                          // ← Changed id type to string

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