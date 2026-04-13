import React, { useState, useEffect } from "react";
import { NewsContext } from "../NewsStore/NewsStore";
import type { Article, Category, NewsStore } from "../NewsStore/NewsStore";

const INITIAL_ARTICLES: Article[] = [
  {
    id: 1, title: "Parliament Session: Key Budget Amendments Passed...", subtitle: "Budget Amendments Passed",
    category: "Breaking News", articleCategory: "Politics",
    authorFirst: "Priya", authorLast: "Sharma",
    status: "Published", statusType: "published", priority: "High", priorityType: "high",
    published: "15 min ago", views: "145K", tag: "Breaking", tagType: "breaking",
    leftBorder: "breaking-left", isTopStory: true, isPinned: true,
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
  } catch {
    // quota exceeded or private-browsing — silently ignore
  }
}

let nextArticleId  = INITIAL_ARTICLES.length  + 1;
let nextCategoryId = INITIAL_CATEGORIES.length + 1;

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles,   setArticlesState]   = useState<Article[]>(INITIAL_ARTICLES);
  const [categories, setCategoriesState] = useState<Category[]>(loadCategories);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  const setArticles = (a: Article[]) => setArticlesState(a);

  const addArticle = (article: Omit<Article, "id">) =>
    setArticlesState(prev => [{ ...article, id: nextArticleId++ }, ...prev]);

  const updateArticle = (id: number, patch: Partial<Article>) =>
    setArticlesState(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));

  const deleteArticle = (id: number) =>
    setArticlesState(prev => prev.filter(a => a.id !== id));

  const addCategory = (category: Omit<Category, "id">) =>
    setCategoriesState(prev => [...prev, { ...category, id: nextCategoryId++ }]);

  const updateCategory = (id: number, patch: Partial<Category>) =>
    setCategoriesState(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const deleteCategory = (id: number) =>
    setCategoriesState(prev => prev.filter(c => c.id !== id && c.parentId !== id));

  const store: NewsStore = {
    articles, setArticles, addArticle, updateArticle, deleteArticle,
    categories, addCategory, updateCategory, deleteCategory,
  };

  return <NewsContext.Provider value={store}>{children}</NewsContext.Provider>;
};