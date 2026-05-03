import { apiClient } from "./client";

export interface Tag {
  id:         string;
  name:       string;
  slug:       string;
  isTrending: boolean;
  usageCount: number;
  createdAt?: string;
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

// ─── TRENDING TAGS (admin-set isTrending=true) ────────────────────────────────
export const getTrendingTags = async (): Promise<Tag[]> => {
  const res = await apiClient("/api/tags/trending");
  return res;
};

// ─── SET TRENDING ─────────────────────────────
export const setTagTrending = async (id: string, isTrending: boolean): Promise<Tag> => {
  const res = await apiClient(`/api/tags/${id}/trending`, {
    method: "PATCH",
    body: JSON.stringify({ isTrending }),
  });
  return res.tag;
};

// ─── DELETE TAG ───────────────────────────────
export const deleteTag = async (id: string) => {
  return await apiClient(`/api/tags/${id}`, {
    method: "DELETE",
  });
};