import React, { useState, useEffect } from "react";
import { NewsContext } from "../NewsStore/NewsStore";
import type { Article, Category, NewsStore } from "../NewsStore/NewsStore";

// ─── Seed data ───────────────────────────────────────────────────────────────

const INITIAL_ARTICLES: Article[] = [
  {
    id: 1, title: "Parliament Session: Key Budget Amendments Passed...", subtitle: "Budget Amendments Passed",
    category: "Breaking News", authorFirst: "Priya", authorLast: "Sharma",
    status: "Published", statusType: "published", priority: "High", priorityType: "high",
    published: "15 min ago", views: "145K", tag: "Breaking", tagType: "breaking",
    leftBorder: "breaking-left", isTopStory: true, isPinned: true,
  },
  {
    id: 2, title: "Stock Markets Hit Record High: Sensex Crosses 85,000...", subtitle: "Sensex Crosses 85K",
    category: "Standard Article", authorFirst: "Rahul", authorLast: "Verma",
    status: "Published", statusType: "published", priority: "High", priorityType: "high",
    published: "42 min ago", views: "89K", isTopStory: false, isPinned: false,
  },
  {
    id: 3, title: "Exclusive: Inside the Tech Startup That's Revolutionizing...", subtitle: "Healthcare Tech Revolution",
    category: "Exclusive Story", authorFirst: "Neha", authorLast: "Gupta",
    status: "Published", statusType: "published", priority: "Medium", priorityType: "medium",
    published: "1 hr ago", views: "56K", tag: "Exclusive", tagType: "exclusive",
    leftBorder: "exclusive-left", isTopStory: false, isPinned: false,
  },
  {
    id: 4, title: "Opinion: Why India's Digital Infrastructure Needs a Rethink", subtitle: "Digital Infrastructure Opinion",
    category: "Opinion / Editorial", authorFirst: "Dr. Amit", authorLast: "Kumar",
    status: "Draft", statusType: "draft", priority: "Normal", priorityType: "normal",
    published: "-", views: "-", tag: "Opinion", tagType: "opinion", isTopStory: false, isPinned: false,
  },
  {
    id: 5, title: "Weather Alert: IMD Issues Orange Warning for Multiple States", subtitle: "Weather Orange Alert",
    category: "Standard Article", authorFirst: "Meera", authorLast: "Singh",
    status: "Scheduled", statusType: "scheduled", priority: "Medium", priorityType: "medium",
    published: "2:00 PM", views: "-", isTopStory: false, isPinned: false,
  },
  {
    id: 6, title: "Sports: India vs Australia Test Match Day 3 – Live Updates", subtitle: "Ind vs Aus Live",
    category: "Live Updates", authorFirst: "Vikram", authorLast: "Patel",
    status: "Published", statusType: "published", priority: "High", priorityType: "high",
    published: "Live", views: "234K", tag: "Live", tagType: "live",
    leftBorder: "live-left", isTopStory: false, isPinned: false,
  },
  {
    id: 7, title: "Entertainment: Bollywood's Biggest Film of the Year Breaks Records", subtitle: "Bollywood Box Office Record",
    category: "Standard Article", authorFirst: "Karan", authorLast: "Mehta",
    status: "Published", statusType: "published", priority: "Normal", priorityType: "normal",
    published: "3 hrs ago", views: "78K", isTopStory: false, isPinned: false,
  },
  {
    id: 8, title: "Video Story: Inside India's New High-Speed Rail Project", subtitle: "Infrastructure Video Report",
    category: "Video Story", authorFirst: "Ankit", authorLast: "Jain",
    status: "Published", statusType: "published", priority: "Medium", priorityType: "medium",
    published: "5 hrs ago", views: "61K", isTopStory: false, isPinned: false,
  },
  {
    id: 9, title: "Breaking: Supreme Court Delivers Landmark Verdict Today", subtitle: "Historic Court Decision",
    category: "Breaking News", authorFirst: "Suresh", authorLast: "Iyer",
    status: "Published", statusType: "published", priority: "High", priorityType: "high",
    published: "5 min ago", views: "198K", tag: "Breaking", tagType: "breaking",
    leftBorder: "breaking-left", isTopStory: false, isPinned: false,
  },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: "Politics",      description: "National and international political news",  articles: "1,245", views: "2.5M", featured: true,  enabled: true, color: "#dc2626" },
  { id: 2, name: "Business",      description: "Markets, economy, and corporate news",        articles: "987",   views: "1.9M", featured: true,  enabled: true, color: "#2563eb" },
  { id: 3, name: "Sports",        description: "Cricket, football, and all sports coverage",  articles: "1,567", views: "3.2M", featured: true,  enabled: true, color: "#16a34a" },
  { id: 4, name: "Entertainment", description: "Bollywood, Hollywood, and celebrity news",    articles: "2,134", views: "4.5M", featured: false, enabled: true, color: "#9333ea" },
  { id: 5, name: "Technology",    description: "Tech news, gadgets, and innovations",         articles: "1,024", views: "2.1M", featured: true,  enabled: true, color: "#0ea5e9" },
];

// ─── ID counters ─────────────────────────────────────────────────────────────

let nextArticleId  = INITIAL_ARTICLES.length  + 1;
let nextCategoryId = INITIAL_CATEGORIES.length + 1;

// ─── Helper: load categories from localStorage (fallback to seed) ─────────────

function loadCategories(): Category[] {
  try {
    const saved = localStorage.getItem("localNewzCategories");
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // Articles — in-memory only (no persistence needed per original design)
  const [articles, setArticlesState] = useState<Article[]>(INITIAL_ARTICLES);

  // Categories — seeded from localStorage, synced back on every change
  const [categories, setCategoriesState] = useState<Category[]>(loadCategories);

  // ── Keep localStorage in sync whenever categories change ─────────────────
  useEffect(() => {
    localStorage.setItem("localNewzCategories", JSON.stringify(categories));
  }, [categories]);

  // ── Article CRUD ──────────────────────────────────────────────────────────

  const setArticles = (a: Article[]) => setArticlesState(a);

  const addArticle = (article: Omit<Article, "id">) => {
    setArticlesState((prev) => [{ ...article, id: nextArticleId++ }, ...prev]);
  };

  const updateArticle = (id: number, patch: Partial<Article>) => {
    setArticlesState((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const deleteArticle = (id: number) => {
    setArticlesState((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────

  const addCategory = (category: Omit<Category, "id">) => {
    setCategoriesState((prev) => [...prev, { ...category, id: nextCategoryId++ }]);
  };

  const updateCategory = (id: number, patch: Partial<Category>) => {
    setCategoriesState((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const deleteCategory = (id: number) => {
    setCategoriesState((prev) => prev.filter((c) => c.id !== id));
  };

  // ── Compose store ─────────────────────────────────────────────────────────

  const store: NewsStore = {
    articles,
    setArticles,
    addArticle,
    updateArticle,
    deleteArticle,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
  };

  return <NewsContext.Provider value={store}>{children}</NewsContext.Provider>;
};