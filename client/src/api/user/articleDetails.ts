// src/api/user/articleDetails.ts

const BASE = "http://localhost:5001/api";

/** Fetch a single published article by its MongoDB _id */
export async function fetchArticleById(id: string) {
  const res = await fetch(`${BASE}/news/${id}`);
  if (!res.ok) throw new Error("Article not found");
  return res.json();
}

/** Fetch a single published article by its URL slug */
export async function fetchArticleBySlug(slug: string) {
  const res = await fetch(`${BASE}/news/slug/${slug}`);
  if (!res.ok) throw new Error("Article not found");
  return res.json();
}

/** Fetch recent published news (used in sidebar) */
export async function fetchRecentNews(limit = 6) {
  const res = await fetch(`${BASE}/news/recent?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch recent news");
  return res.json();
}

/** Fetch articles by category (for "Related News") */
export async function fetchRelatedNews(categoryId: string, excludeId: string, limit = 4) {
  const res = await fetch(
    `${BASE}/news?categoryId=${categoryId}&limit=${limit}&status=PUBLISHED`
  );
  if (!res.ok) throw new Error("Failed to fetch related news");
  const data = await res.json();
  // Exclude the current article
  return {
    ...data,
    news: (data.news || []).filter((n: any) => String(n._id || n.id) !== String(excludeId)),
  };
}