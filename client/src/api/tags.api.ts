import { apiClient } from "./client";// your existing fetch wrapper

export interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: {
    articles: number;
  };
}

// ─── GET ALL TAGS ─────────────────────────────
export const getAllTags = async (): Promise<Tag[]> => {
  const res = await apiClient("/api/tags");
  return res;
};

// ─── CREATE TAG ───────────────────────────────
export const createTag = async (name: string): Promise<Tag> => {
  const res = await apiClient("/api/tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.tag;
};

// ─── TRENDING TAGS ────────────────────────────
export const getTrendingTags = async (): Promise<Tag[]> => {
  const res = await apiClient("/api/tags/trending");
  return res;
};

// ─── DELETE TAG ───────────────────────────────
export const deleteTag = async (id: string) => {
  return await apiClient(`/api/tags/${id}`, {
    method: "DELETE",
  });
};