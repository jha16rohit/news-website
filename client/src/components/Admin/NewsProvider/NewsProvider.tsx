import React, { useState, useEffect } from "react";
import { NewsContext } from "../NewsStore/NewsStore";
import type { Article, Category, NewsStore, LiveUpdate } from "../NewsStore/NewsStore";

const INITIAL_ARTICLES: Article[] = [
  {
    id: 1, title: "Parliament Session: Key Budget Amendments Passed...", subtitle: "Budget Amendments Passed",
    category: "Breaking News", articleCategory: "Politics",
    authorFirst: "Priya", authorLast: "Sharma",
    status: "Published", statusType: "published", priority: "High", priorityType: "high",
    published: "15 min ago", views: "145K", tag: "Breaking", tagType: "breaking",
    leftBorder: "breaking-left", isTopStory: true, isPinned: true,
    channels: ["web", "mobile", "ticker"],
    expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2, title: "Stock Markets Hit Record High: Sensex Crosses 85,000...", subtitle: "Sensex Crosses 85K",
    category: "Standard Article", articleCategory: "Business",
    authorFirst: "Rahul", authorLast: "Verma",
    status: "Published", statusType: "published", priority: "High", priorityType: "high",
    published: "42 min ago", views: "89K", isTopStory: false, isPinned: false,
  },
  {
    id: 3, title: "Opinion: Why India's Digital Infrastructure Needs a Rethink", subtitle: "Digital Infrastructure Opinion",
    category: "Standard Article", articleCategory: "Technology",
    authorFirst: "Dr. Amit", authorLast: "Kumar",
    status: "Draft", statusType: "draft", priority: "Normal", priorityType: "normal",
    published: "-", views: "-", isTopStory: false, isPinned: false,
  },
  {
    id: 4, title: "Weather Alert: IMD Issues Orange Warning for Multiple States", subtitle: "Weather Orange Alert",
    category: "Standard Article", articleCategory: "Politics",
    authorFirst: "Meera", authorLast: "Singh",
    status: "Scheduled", statusType: "scheduled", priority: "Medium", priorityType: "medium",
    published: "2:00 PM", views: "-", isTopStory: false, isPinned: false,
  },
  {
    id: 5, title: "Sports: India vs Australia Test Match Day 3 – Live Updates", subtitle: "Ind vs Aus Live",
    category: "Live Updates", articleCategory: "Sports",
    authorFirst: "Vikram", authorLast: "Patel",
    status: "Published", statusType: "published", priority: "High", priorityType: "high",
    published: "Live", views: "234K", tag: "Live", tagType: "live",
    leftBorder: "live-left", isTopStory: false, isPinned: false,
    liveStartedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    liveUpdates: [
      { id: 1, time: "2:00 PM", text: "Match begins. India batting first.", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: 2, time: "3:30 PM", text: "Virat Kohli hits a brilliant half-century!", timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
      { id: 3, time: "4:15 PM", text: "India 180/3 at 35 overs.", timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 6, title: "Entertainment: Bollywood's Biggest Film of the Year Breaks Records", subtitle: "Bollywood Box Office Record",
    category: "Standard Article", articleCategory: "Entertainment",
    authorFirst: "Karan", authorLast: "Mehta",
    status: "Published", statusType: "published", priority: "Normal", priorityType: "normal",
    published: "3 hrs ago", views: "78K", isTopStory: false, isPinned: false,
  },
  {
    id: 7, title: "Video Story: Inside India's New High-Speed Rail Project", subtitle: "Infrastructure Video Report",
    category: "Video Story", articleCategory: "Politics",
    authorFirst: "Ankit", authorLast: "Jain",
    status: "Published", statusType: "published", priority: "Medium", priorityType: "medium",
    published: "5 hrs ago", views: "61K", isTopStory: false, isPinned: false,
  },
  {
    id: 8, title: "Breaking: Supreme Court Delivers Landmark Verdict Today", subtitle: "Historic Court Decision",
    category: "Breaking News", articleCategory: "Politics",
    authorFirst: "Suresh", authorLast: "Iyer",
    status: "Published", statusType: "published", priority: "High", priorityType: "high",
    published: "5 min ago", views: "198K", tag: "Breaking", tagType: "breaking",
    leftBorder: "breaking-left", isTopStory: false, isPinned: false,
    channels: ["web", "mobile"],
    expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 9, title: "Union Budget 2025 Parliament Session – Live Coverage", subtitle: "Budget Parliament Live",
    category: "Live Updates", articleCategory: "Politics",
    authorFirst: "Nisha", authorLast: "Reddy",
    status: "Published", statusType: "published", priority: "High", priorityType: "high",
    published: "Live", views: "189K", tag: "Live", tagType: "live",
    leftBorder: "live-left", isTopStory: false, isPinned: false,
    liveStartedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    liveUpdates: [
      { id: 1, time: "11:00 AM", text: "Session begins. Finance Minister takes the floor.", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
      { id: 2, time: "12:30 PM", text: "Major infrastructure allocation announced.", timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 10, title: "Election Night Results – State Assembly 2025", subtitle: "State Assembly Results",
    category: "Live Updates", articleCategory: "Politics",
    authorFirst: "Aditya", authorLast: "Ghosh",
    status: "Ended", statusType: "ended", priority: "High", priorityType: "high",
    published: "Feb 14, 2025", views: "1240K", tag: "Live", tagType: "live",
    leftBorder: "live-left", isTopStory: false, isPinned: false,
    liveStartedAt: new Date("2025-02-14T08:00:00").toISOString(),
    liveUpdates: [],
  },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: "Politics",      description: "National and international political news",  articles: "1,245", views: "2.5M", featured: true,  enabled: true, color: "#dc2626", parentId: null },
  { id: 2, name: "Business",      description: "Markets, economy, and corporate news",        articles: "987",   views: "1.9M", featured: true,  enabled: true, color: "#2563eb", parentId: null },
  { id: 3, name: "Sports",        description: "Cricket, football, and all sports coverage",  articles: "1,567", views: "3.2M", featured: true,  enabled: true, color: "#16a34a", parentId: null },
  { id: 4, name: "Entertainment", description: "Bollywood, Hollywood, and celebrity news",    articles: "2,134", views: "4.5M", featured: false, enabled: true, color: "#9333ea", parentId: null },
  { id: 5, name: "Technology",    description: "Tech news, gadgets, and innovations",         articles: "1,024", views: "2.1M", featured: true,  enabled: true, color: "#0ea5e9", parentId: null },
];

const STORAGE_KEY    = "localNewzCategories";
const SCHEMA_VERSION = "v2";

function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (parsed.__version !== SCHEMA_VERSION) return INITIAL_CATEGORIES;
    return parsed.data as Category[];
  } catch {
    return INITIAL_CATEGORIES;
  }
}

function saveCategories(cats: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ __version: SCHEMA_VERSION, data: cats }));
  } catch { /* quota exceeded or private-browsing */ }
}

const PRIORITY_ORDER: Article["priority"][] = ["High", "Medium", "Normal"];

let nextArticleId  = INITIAL_ARTICLES.length  + 1;
let nextCategoryId = INITIAL_CATEGORIES.length + 1;
let nextUpdateId   = 1000;

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles,   setArticlesState]   = useState<Article[]>(INITIAL_ARTICLES);
  const [categories, setCategoriesState] = useState<Category[]>(loadCategories);

  useEffect(() => { saveCategories(categories); }, [categories]);

  const setArticles = (a: Article[]) => setArticlesState(a);

  const addArticle = (article: Omit<Article, "id">) =>
    setArticlesState(prev => [{ ...article, id: nextArticleId++ }, ...prev]);

  const updateArticle = (id: number, patch: Partial<Article>) =>
    setArticlesState(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));

  const deleteArticle = (id: number) =>
    setArticlesState(prev => prev.filter(a => a.id !== id));

  /** Convert any article to Breaking News mode — keeps ID, stats, history intact */
  const convertToBreaking = (id: number) =>
    setArticlesState(prev => prev.map(a => {
      if (a.id !== id) return a;
      return {
        ...a,
        category:   "Breaking News",
        tag:        "Breaking",
        tagType:    "breaking",
        leftBorder: "breaking-left",
        priority:   "High",
        priorityType: "high",
        channels:   a.channels?.length ? a.channels : ["web", "mobile"],
        expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        // Clear live-specific fields if switching away from live
        liveUpdates: a.tagType === "live" ? a.liveUpdates : a.liveUpdates,
      };
    }));

  /** Remove Breaking mode — converts back to Standard Article */
  // const removeBreaking = (id: number) =>
  //   setArticlesState(prev => prev.map(a => {
  //     if (a.id !== id) return a;
  //     return {
  //       ...a,
  //       category:    "Standard Article",
  //       tag:         undefined,
  //       tagType:     undefined,
  //       leftBorder:  undefined,
  //       priority:    "Normal",
  //       priorityType: "normal",
  //       channels:    undefined,
  //       expiryTime:  undefined,
  //     };
  //   }));

  /** Convert any article to Live Updates mode */
  const convertToLive = (id: number) =>
    setArticlesState(prev => prev.map(a => {
      if (a.id !== id) return a;
      return {
        ...a,
        category:     "Live Updates",
        tag:          "Live",
        tagType:      "live",
        leftBorder:   "live-left",
        status:       "Published",
        statusType:   "published",
        published:    "Live",
        liveStartedAt: new Date().toISOString(),
        liveUpdates:  a.liveUpdates ?? [],
        // Clear breaking-specific fields
        channels:    undefined,
        expiryTime:  undefined,
      };
    }));

  /** End a live story — moves to Ended/Past Live */
  const endLive = (id: number) =>
    setArticlesState(prev => prev.map(a => {
      if (a.id !== id) return a;
      return {
        ...a,
        status:     "Ended",
        statusType: "ended",
        published:  new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
      };
    }));

  /** Promote multiple articles to breaking at once */
  const promoteToBreaking = (ids: number[]) =>
    setArticlesState(prev => prev.map(a => {
      if (!ids.includes(a.id)) return a;
      return {
        ...a,
        category:    "Breaking News",
        tag:         "Breaking",
        tagType:     "breaking",
        leftBorder:  "breaking-left",
        priority:    "High",
        priorityType: "high",
        channels:    a.channels?.length ? a.channels : ["web", "mobile"],
        expiryTime:  new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      };
    }));

  /** Add a live update entry to a live article */
  const addLiveUpdate = (articleId: number, text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const update: LiveUpdate = {
      id:        nextUpdateId++,
      time:      now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      text:      text.trim(),
      timestamp: now.toISOString(),
    };
    setArticlesState(prev => prev.map(a =>
      a.id === articleId
        ? { ...a, liveUpdates: [update, ...(a.liveUpdates ?? [])] }
        : a
    ));
  };

  /** Toggle paused status for a breaking article */
  const togglePause = (id: number) =>
    setArticlesState(prev => prev.map(a => {
      if (a.id !== id) return a;
      const isPaused = a.statusType === "paused";
      return {
        ...a,
        status:     isPaused ? "Published" : "Published",
        statusType: isPaused ? "published" : "paused",
        published:  isPaused ? "Live" : "Paused",
      };
    }));

  /** Increase article priority one step */
  const increasePriority = (id: number) =>
    setArticlesState(prev => prev.map(a => {
      if (a.id !== id) return a;
      const idx = PRIORITY_ORDER.indexOf(a.priority);
      if (idx <= 0) return a;
      const next = PRIORITY_ORDER[idx - 1];
      return { ...a, priority: next, priorityType: next.toLowerCase() };
    }));

  /** Decrease article priority one step */
  const decreasePriority = (id: number) =>
    setArticlesState(prev => prev.map(a => {
      if (a.id !== id) return a;
      const idx = PRIORITY_ORDER.indexOf(a.priority);
      if (idx >= PRIORITY_ORDER.length - 1) return a;
      const next = PRIORITY_ORDER[idx + 1];
      return { ...a, priority: next, priorityType: next.toLowerCase() };
    }));

  const addCategory = (category: Omit<Category, "id">) =>
    setCategoriesState(prev => [...prev, { ...category, id: nextCategoryId++ }]);

  const updateCategory = (id: number, patch: Partial<Category>) =>
    setCategoriesState(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const deleteCategory = (id: number) =>
    setCategoriesState(prev => prev.filter(c => c.id !== id && c.parentId !== id));

  const store: NewsStore = {
    articles, setArticles, addArticle, updateArticle, deleteArticle,
    convertToBreaking, convertToLive, endLive, promoteToBreaking,
    addLiveUpdate, togglePause, increasePriority, decreasePriority,
    categories, addCategory, updateCategory, deleteCategory,
  };

  return <NewsContext.Provider value={store}>{children}</NewsContext.Provider>;
};