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
  const arr = Array.isArray(res) ? res : [];
  return arr.map((t: any) => ({ ...t, id: t.id ?? String(t._id) }));
};

// ─── CREATE TAG ───────────────────────────────
export const createTag = async (name: string): Promise<Tag> => {
  const res = await apiClient("/api/tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  const t = res.tag;
  return { ...t, id: t.id ?? String(t._id) };
};

// ─── TRENDING TAGS (admin-set isTrending=true) ────────────────────────────────
export const getTrendingTags = async (): Promise<Tag[]> => {
  const res = await apiClient("/api/tags/trending");
  const arr = Array.isArray(res) ? res : [];
  return arr.map((t: any) => ({ ...t, id: t.id ?? String(t._id) }));
};

// ─── SET TRENDING ─────────────────────────────
export const setTagTrending = async (id: string, isTrending: boolean): Promise<Tag> => {
  const res = await apiClient(`/api/tags/${id}/trending`, {
    method: "PATCH",
    body: JSON.stringify({ isTrending }),
  });
  const t = res.tag;
  return { ...t, id: t.id ?? String(t._id) };
};

// ─── DELETE TAG ───────────────────────────────
export const deleteTag = async (id: string) => {
  return await apiClient(`/api/tags/${id}`, {
    method: "DELETE",
  });
};