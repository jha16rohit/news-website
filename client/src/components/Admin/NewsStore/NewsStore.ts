import { createContext, useContext } from "react";

export type ArticleStatus   = "Published" | "Draft" | "Scheduled";
export type ArticlePriority = "High" | "Medium" | "Normal";

export interface Article {
  id:              number;
  title:           string;
  subtitle:        string;
  category:        string;          // article type: "Breaking News", "Standard Article" etc.
  articleCategory: string;          // classification category: "Sports", "Sports / Cricket" etc.
  authorFirst:     string;
  authorLast:      string;
  status:          ArticleStatus;
  statusType:      string;
  priority:        ArticlePriority;
  priorityType:    string;
  published:       string;
  views:           string;
  tag?:            string;
  tagType?:        string;
  leftBorder?:     string;
  isTopStory:      boolean;
  isPinned:        boolean;
  // New scheduling fields
  scheduledFor?:   string | null;   // ISO datetime string, set when status = "Scheduled"
  publishedAt?:    string | null;   // ISO datetime string, set when status = "Published"
}

export interface Category {
  id:          number;
  name:        string;
  description: string;
  articles:    string;
  views:       string;
  featured:    boolean;
  enabled:     boolean;
  color:       string;
  parentId?:   number | null;
}

export interface NewsStore {
  articles:      Article[];
  setArticles:   (a: Article[]) => void;
  addArticle:    (a: Omit<Article, "id">) => void;
  updateArticle: (id: number, patch: Partial<Article>) => void;
  deleteArticle: (id: number) => void;

  categories:     Category[];
  addCategory:    (c: Omit<Category, "id">) => void;
  updateCategory: (id: number, patch: Partial<Category>) => void;
  deleteCategory: (id: number) => void;
}

export const NewsContext = createContext<NewsStore | null>(null);

export const useNews = (): NewsStore => {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be inside NewsProvider");
  return ctx;
};