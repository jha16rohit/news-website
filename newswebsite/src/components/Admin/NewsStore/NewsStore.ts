// newsStore.ts — shared article store (React Context + localStorage)
import { createContext, useContext } from "react";

export type ArticleStatus = "Published" | "Draft" | "Scheduled";
export type ArticlePriority = "High" | "Medium" | "Normal";

export interface Article {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  authorFirst: string;
  authorLast: string;
  status: ArticleStatus;
  statusType: string;
  priority: ArticlePriority;
  priorityType: string;
  published: string;
  views: string;
  tag?: string;
  tagType?: string;
  leftBorder?: string;
  isTopStory: boolean;
  isPinned: boolean;
}

export interface NewsStore {
  articles: Article[];
  setArticles: (articles: Article[]) => void;
  addArticle: (article: Omit<Article, "id">) => void;
  updateArticle: (id: number, patch: Partial<Article>) => void;
  deleteArticle: (id: number) => void;
}

export const NewsContext = createContext<NewsStore | null>(null);

export const useNews = (): NewsStore => {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used inside NewsProvider");
  return ctx;
};