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
  // Backend may return: Tag[] | { tags: Tag[] } | { data: Tag[] }
  const arr: any[] = Array.isArray(res)
    ? res
    : Array.isArray(res?.tags) ? res.tags
    : Array.isArray(res?.data) ? res.data
    : [];
  return arr.map((t: any) => ({ ...t, id: t.id ?? String(t._id) }));
};

// ─── CREATE TAG ───────────────────────────────
// Idempotent: backend returns 200 with existing tag if name/slug already taken.
// Falls back to tag lookup on any unexpected error so the UI never breaks.
export const createTag = async (name: string): Promise<Tag> => {
  try {
    const res = await apiClient("/api/tags", {
      method: "POST",
      body: JSON.stringify({ name: name.trim() }),
    });
    // Backend returns: { success, tag } | { success, tag, message: "already exists" }
    const t = res?.tag ?? res?.data ?? res;
    if (!t?.name) throw new Error("Invalid response from server");
    return { ...t, id: t.id ?? String(t._id) };
  } catch (err: any) {
    // Network error or unexpected 500 — try to find existing tag by name
    try {
      const all = await getAllTags();
      const existing = all.find(
        (t) => t.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (existing) return existing;
    } catch {
      // getAllTags also failed — return a minimal local object so UI doesn't crash
    }
    throw err;
  }
};

// ─── TRENDING TAGS (admin-set isTrending=true) ────────────────────────────────
export const getTrendingTags = async (): Promise<Tag[]> => {
  const res = await apiClient("/api/tags/trending");
  // Backend may return: Tag[] | { tags: Tag[] } | { data: Tag[] }
  const arr: any[] = Array.isArray(res)
    ? res
    : Array.isArray(res?.tags) ? res.tags
    : Array.isArray(res?.data) ? res.data
    : [];
  return arr.map((t: any) => ({ ...t, id: t.id ?? String(t._id) }));
};

// ─── SET TRENDING ─────────────────────────────
export const setTagTrending = async (id: string, isTrending: boolean): Promise<Tag> => {
  const res = await apiClient(`/api/tags/${id}/trending`, {
    method: "PATCH",
    body: JSON.stringify({ isTrending }),
  });
  // Backend may return: Tag | { tag: Tag } | { data: Tag }
  const t = res?.tag ?? res?.data ?? res;
  return { ...t, id: t.id ?? String(t._id) };
};

// ─── DELETE TAG ───────────────────────────────
export const deleteTag = async (id: string) => {
  return await apiClient(`/api/tags/${id}`, {
    method: "DELETE",
  });
};