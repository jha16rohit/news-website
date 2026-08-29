import { apiClient } from "./client";

// ─── CATEGORY TYPES ────────────────────────────────────────────────
export interface CategoryPayload {
  name: string;
  description?: string;
  color?: string;
  parentId?: string | null;

  featured?: boolean;
  enabled?: boolean;
  inShowcase?: boolean;

  active?: boolean;
  showcase?: boolean;
}

// ─── GET ALL CATEGORIES ────────────────────────────────────────────
export const getCategories = (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
  }
) => {
  const qs = new URLSearchParams();

  if (params?.page) {
    qs.set("page", String(params.page));
  }

  if (params?.limit) {
    qs.set("limit", String(params.limit));
  }

  if (params?.search) {
    qs.set("search", params.search);
  }

  const query = qs.toString();

  return apiClient(
    query
      ? `/api/categories?${query}`
      : "/api/categories"
  );
};

// ─── GET SINGLE CATEGORY ───────────────────────────────────────────
export const getCategoryById = (id: string) =>
  apiClient(`/api/categories/${id}`);

// ─── CREATE CATEGORY ───────────────────────────────────────────────
export const createCategory = (data: CategoryPayload) =>
  apiClient("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

// ─── UPDATE CATEGORY ───────────────────────────────────────────────
export const updateCategory = (
  id: string,
  data: Partial<CategoryPayload>
) =>
  apiClient(`/api/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

// ─── DELETE CATEGORY ───────────────────────────────────────────────
export const deleteCategory = (id: string) =>
  apiClient(`/api/categories/${id}`, {
    method: "DELETE",
  });

// ─── TOGGLE FEATURED ───────────────────────────────────────────────
export const toggleFeatured = (id: string) =>
  apiClient(`/api/categories/${id}/featured`, {
    method: "PATCH",
  });

// ─── TOGGLE ACTIVE ─────────────────────────────────────────────────
export const toggleActive = (id: string) =>
  apiClient(`/api/categories/${id}/active`, {
    method: "PATCH",
  });