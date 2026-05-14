/**
 * NewsProvider.tsx
 *
 * Replaces the old local-state provider.
 * Now wraps NewsProvider from NewsContext (the real API-backed event bus)
 * AND provides a thin backwards-compatible NewsStore shim so any component
 * still calling useNews() doesn't crash — it just reads from the real API.
 *
 * Migration path:
 *   - New pages: import { useNewsEvent, useNewsSubscription } from "NewsContext"
 *   - Old pages still on useNews(): they will work via the shim but should be
 *     migrated over time to use the API directly.
 */

import React, { useState, useEffect, useCallback } from "react";
import { NewsContext } from "../NewsStore/NewsStore";
import type { Article, Category, NewsStore } from "../NewsStore/NewsStore";
import { NewsProvider as EventBusProvider } from "../../../context/newscontext";
import {
  fetchAllNews,
  updateNews as apiUpdateNews,
  deleteNews as apiDeleteNews,
  appendLiveUpdate as apiAppendLiveUpdate,
} from "../../../api/news";
import {
  getCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
} from "../../../api/category.api";

// ─── Map API news → Article shape ─────────────────────────────────────────────
function mapApiToArticle(n: any, idx: number): Article {
  const isBreaking = n.articleType === "BREAKING";
  const isLive     = n.articleType === "LIVE";

  return {
    id:              idx + 1,          // local numeric ID for legacy consumers
    _dbId:           n.id,             // real UUID — used for all API calls
    title:           n.headline,
    subtitle:        n.shortTitle || n.headline.slice(0, 50),
    category:        isBreaking ? "Breaking News" : isLive ? "Live Updates" : "Standard Article",
    articleCategory: n.category?.name || "",
    authorFirst:     n.author?.name || "Admin",
    authorLast:      "",
    status:          n.status === "PUBLISHED" ? "Published"
                     : n.status === "DRAFT"     ? "Draft"
                     : n.status === "SCHEDULED" ? "Scheduled"
                     : n.status === "EXPIRED"   ? "Expired"
                     : n.status === "DELETED"   ? "Deleted"
                     : "Draft",
    statusType:      n.status === "PUBLISHED"
                       ? (isLive && n.statusType !== "ended" ? "live-published" : "published")
                       : n.status === "DRAFT"      ? "draft"
                       : n.status === "SCHEDULED"  ? "scheduled"
                       : n.status === "EXPIRED"    ? "expired"
                       : n.status === "DELETED"    ? "deleted"
                       : "draft",
    priority:        isBreaking ? "High" : "Normal",
    priorityType:    isBreaking ? "high" : "normal",
    published:       n.publishedAt
                       ? isLive && n.statusType !== "ended"
                         ? "Live"
                         : new Date(n.publishedAt).toLocaleDateString("en-IN")
                       : "-",
    views:           String(n.views ?? 0),
    tag:             isBreaking ? "Breaking" : isLive && n.statusType !== "ended" ? "Live" : undefined,
    tagType:         isBreaking ? "breaking" : isLive ? "live" : undefined,
    leftBorder:      isBreaking ? "breaking-left" : isLive ? "live-left" : undefined,
    isPinned:        false,
    isTopStory:      false,
    liveUpdates:     (n.liveUpdates ?? []).map((u: any, i: number) => ({
      id:        u.id ?? (i + 1),
      time:      u.time || "",
      text:      u.text || "",
      timestamp: u.timestamp,
    })),
    liveStartedAt:   isLive ? n.publishedAt : undefined,
    channels:        isBreaking ? ["web", "mobile"] : undefined,
    expiryTime:      n.expiryTime || undefined,
  } as Article & { _dbId: string };
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles,   setArticlesState]   = useState<Article[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);

  // ── Keep a UUID→localId map so mutations can find the real DB id ──────────
  const dbIdMap = React.useRef<Map<number, string>>(new Map());

  const getDbId = (localId: number): string | undefined => dbIdMap.current.get(localId);

  // ── Fetch all news from real API ──────────────────────────────────────────
  const loadArticles = useCallback(async () => {
    try {
      const data = await fetchAllNews({ limit: 100 });
      if (!data?.news) return;
      const mapped = data.news.map(mapApiToArticle);
      // Rebuild the UUID map
      dbIdMap.current.clear();
      data.news.forEach((n: any, i: number) => dbIdMap.current.set(i + 1, n.id));
      setArticlesState(mapped);
    } catch (err) {
      console.error("NewsProvider: failed to load articles", err);
    }
  }, []);

  // ── Fetch categories ──────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    try {
const data = await getCategories();     
setCategoriesState(data.categories || data || []);
    } catch {
      // categories API may not exist yet — silently ignore
    }
  }, []);

  useEffect(() => {
    loadArticles();
    loadCategories();
  }, [loadArticles, loadCategories]);

  // ── Article mutations — all hit the real API then reload ──────────────────

  const setArticles = (a: Article[]) => setArticlesState(a);

  const addArticle = (_article: Omit<Article, "id">) => {
    // Creating articles goes through CreateNewArticle page directly.
    // This is a no-op shim — new articles appear after next loadArticles().
    loadArticles();
  };

  const updateArticle = async (id: number, patch: Partial<Article>) => {
    const dbId = getDbId(id);
    if (!dbId) return;
    // Optimistic local update
    setArticlesState(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    try {
      // Map local patch fields to API payload fields
      const payload: Record<string, unknown> = {};
      if (patch.status)     payload.status     = patch.status.toUpperCase();
      if (patch.statusType) payload.statusType = patch.statusType;
      if (patch.category === "Breaking News") payload.articleType = "BREAKING";
      if (patch.category === "Live Updates")  payload.articleType = "LIVE";
      if (patch.category === "Standard Article") payload.articleType = "STANDARD";
      await apiUpdateNews(dbId, payload as any);
      await loadArticles();
    } catch (err) {
      console.error("updateArticle failed:", err);
      await loadArticles(); // reload to restore correct state
    }
  };

  const deleteArticle = async (id: number) => {
    const dbId = getDbId(id);
    if (!dbId) return;
    setArticlesState(prev => prev.filter(a => a.id !== id));
    try {
      await apiDeleteNews(dbId);
    } catch (err) {
      console.error("deleteArticle failed:", err);
      await loadArticles();
    }
  };

  const convertToBreaking = async (id: number) => {
    const dbId = getDbId(id);
    if (!dbId) return;
    setArticlesState(prev => prev.map(a => a.id !== id ? a : {
      ...a, category: "Breaking News", tag: "Breaking", tagType: "breaking",
      leftBorder: "breaking-left", priority: "High" as const, priorityType: "high",
    }));
    try {
      await apiUpdateNews(dbId, { articleType: "BREAKING", status: "PUBLISHED" } as any);
      await loadArticles();
    } catch (err) { console.error(err); await loadArticles(); }
  };

  const convertToLive = async (id: number) => {
    const dbId = getDbId(id);
    if (!dbId) return;
    setArticlesState(prev => prev.map(a => a.id !== id ? a : {
      ...a, category: "Live Updates", tag: "Live", tagType: "live",
      leftBorder: "live-left", status: "Published", statusType: "published",
      published: "Live", liveStartedAt: new Date().toISOString(),
    }));
    try {
      await apiUpdateNews(dbId, { articleType: "LIVE", status: "PUBLISHED" } as any);
      await loadArticles();
    } catch (err) { console.error(err); await loadArticles(); }
  };

  const endLive = async (id: number) => {
    const dbId = getDbId(id);
    if (!dbId) return;
    setArticlesState(prev => prev.map(a => a.id !== id ? a : {
      ...a, status: "Ended", statusType: "ended",
      published: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
    }));
    try {
      await apiUpdateNews(dbId, { status: "PUBLISHED", statusType: "ended" } as any);
      await loadArticles();
    } catch (err) { console.error(err); await loadArticles(); }
  };

  const promoteToBreaking = async (ids: number[]) => {
    for (const id of ids) await convertToBreaking(id);
  };

  const addLiveUpdate = async (articleId: number, text: string) => {
    if (!text.trim()) return;
    const dbId = getDbId(articleId);
    if (!dbId) return;
    try {
      await apiAppendLiveUpdate(dbId, { text: text.trim() });
      await loadArticles();
    } catch (err) { console.error("addLiveUpdate failed:", err); }
  };

  const togglePause = async (id: number) => {
    const dbId = getDbId(id);
    if (!dbId) return;
    const article = articles.find(a => a.id === id);
    const isPaused = article?.statusType === "paused";
    setArticlesState(prev => prev.map(a => a.id !== id ? a : {
      ...a, statusType: isPaused ? "published" : "paused",
    }));
    try {
      await apiUpdateNews(dbId, { statusType: isPaused ? "published" : "paused" } as any);
    } catch (err) { console.error(err); await loadArticles(); }
  };

  // Priority is a local-only UI concept not stored in DB as High/Medium/Normal text
  const increasePriority = (id: number) =>
    setArticlesState(prev => prev.map(a => {
      if (a.id !== id) return a;
      const order: Article["priority"][] = ["High", "Medium", "Normal"];
      const idx = order.indexOf(a.priority);
      if (idx <= 0) return a;
      const next = order[idx - 1];
      return { ...a, priority: next, priorityType: next.toLowerCase() };
    }));

  const decreasePriority = (id: number) =>
    setArticlesState(prev => prev.map(a => {
      if (a.id !== id) return a;
      const order: Article["priority"][] = ["High", "Medium", "Normal"];
      const idx = order.indexOf(a.priority);
      if (idx >= order.length - 1) return a;
      const next = order[idx + 1];
      return { ...a, priority: next, priorityType: next.toLowerCase() };
    }));

  // ── Category mutations ─────────────────────────────────────────────────────

  const addCategory = async (category: Omit<Category, "id">) => {
    try {
      await apiCreateCategory(category);
      await loadCategories();
    } catch {
      // fallback: add locally with temp id
      setCategoriesState(prev => [...prev, { ...category, id: `temp-${Date.now()}` }]);
    }
  };

  const updateCategory = async (id: string, patch: Partial<Category>) => {
    setCategoriesState(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    try {
      await apiUpdateCategory(id, patch);
    } catch (err) { console.error(err); await loadCategories(); }
  };

  const deleteCategory = async (id: string) => {
    setCategoriesState(prev => prev.filter(c => c.id !== id && c.parentId !== id));
    try {
      await apiDeleteCategory(id);
    } catch (err) { console.error(err); await loadCategories(); }
  };

  // ── Store ──────────────────────────────────────────────────────────────────

  const store: NewsStore = {
    articles, setArticles, addArticle, updateArticle, deleteArticle,
    convertToBreaking, convertToLive, endLive, promoteToBreaking,
    addLiveUpdate, togglePause, increasePriority, decreasePriority,
    categories, addCategory, updateCategory, deleteCategory,
  };

  // Wrap with EventBusProvider so all pages can use useNewsEvent() too
  return (
    <EventBusProvider>
      <NewsContext.Provider value={store}>
        {children}
      </NewsContext.Provider>
    </EventBusProvider>
  );
};