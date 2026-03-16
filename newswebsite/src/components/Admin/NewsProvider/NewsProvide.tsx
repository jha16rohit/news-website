// NewsProvider.tsx — wraps the app and provides shared article state
import React, { useState } from "react";
import { NewsContext } from "../NewsStore/NewsStore";
import type { Article, NewsStore } from "../NewsStore/NewsStore";

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

let nextId = INITIAL_ARTICLES.length + 1;

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticlesState] = useState<Article[]>(INITIAL_ARTICLES);

  const setArticles = (a: Article[]) => setArticlesState(a);

  const addArticle = (article: Omit<Article, "id">) => {
    setArticlesState((prev) => [{ ...article, id: nextId++ }, ...prev]);
  };

  const updateArticle = (id: number, patch: Partial<Article>) => {
    setArticlesState((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const deleteArticle = (id: number) => {
    setArticlesState((prev) => prev.filter((a) => a.id !== id));
  };

  const store: NewsStore = { articles, setArticles, addArticle, updateArticle, deleteArticle };

  return <NewsContext.Provider value={store}>{children}</NewsContext.Provider>;
};