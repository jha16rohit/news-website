import { createContext, useContext } from "react";

export type ArticleStatus   = "Published" | "Draft" | "Scheduled" | "Ended";
export type ArticlePriority = "High" | "Medium" | "Normal";

export interface LiveUpdate {
  id:        number;
  time:      string;   // e.g. "10:30 AM"
  text:      string;
  timestamp: string;   // ISO
}

export interface Article {
  id:              number;
  title:           string;
  subtitle:        string;
  category:        string;          // article type: "Breaking News", "Standard Article" etc.
  articleCategory: string;          // classification: "Sports", "Politics" etc.
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
  // Scheduling
  scheduledFor?:   string | null;   // ISO datetime
  publishedAt?:    string | null;   // ISO datetime
  // Breaking-specific
  channels?:       string[];        // ["web", "mobile", "push", "ticker"]
  expiryTime?:     string | null;   // ISO datetime for auto-expiry
  // Live-specific
  liveUpdates?:    LiveUpdate[];
  liveStartedAt?:  string | null;   // ISO datetime when live started
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
  articles:           Article[];
  setArticles:        (a: Article[]) => void;
  addArticle:         (a: Omit<Article, "id">) => void;
  updateArticle:      (id: number, patch: Partial<Article>) => void;
  deleteArticle:      (id: number) => void;
  convertToBreaking:  (id: number) => void;
  convertToLive:      (id: number) => void;
  endLive:            (id: number) => void;
  promoteToBreaking:  (ids: number[]) => void;
  addLiveUpdate:      (articleId: number, text: string) => void;
  togglePause:        (id: number) => void;
  increasePriority:   (id: number) => void;
  decreasePriority:   (id: number) => void;

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