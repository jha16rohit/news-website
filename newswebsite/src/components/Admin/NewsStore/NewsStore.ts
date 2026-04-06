// newsStore.ts — shared article + category store (React Context)
import { createContext, useContext } from "react";

// ─── Article ──────────────────────────────────────────────────────────────────

export type ArticleStatus   = "Published" | "Draft" | "Scheduled";
export type ArticlePriority = "High" | "Medium" | "Normal";

export interface Article {
  id:          number;
  title:       string;
  subtitle:    string;
  category:    string;
  authorFirst: string;
  authorLast:  string;
  status:      ArticleStatus;
  statusType:  string;
  priority:    ArticlePriority;
  priorityType: string;
  published:   string;
  views:       string;
  tag?:        string;
  tagType?:    string;
  leftBorder?: string;
  isTopStory:  boolean;
  isPinned:    boolean;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id:          number;
  name:        string;
  description: string;
  articles:    string;
  views:       string;
  featured:    boolean;
  enabled:     boolean;
  color:       string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface NewsStore {
  // Articles
  articles:      Article[];
  setArticles:   (articles: Article[]) => void;
  addArticle:    (article: Omit<Article, "id">) => void;
  updateArticle: (id: number, patch: Partial<Article>) => void;
  deleteArticle: (id: number) => void;

  // Categories
  categories:      Category[];
  addCategory:     (category: Omit<Category, "id">) => void;
  updateCategory:  (id: number, patch: Partial<Category>) => void;
  deleteCategory:  (id: number) => void;
}

// ─── Context + hook ───────────────────────────────────────────────────────────

export const NewsContext = createContext<NewsStore | null>(null);

export const useNews = (): NewsStore => {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used inside NewsProvider");
  return ctx;
};