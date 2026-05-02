import { apiClient } from "./client";

// ─── GET ALL CATEGORIES ─────────────────────────────────────────────
export const getCategories = (search?: string) =>
  apiClient(
    search
      ? `/api/categories?search=${encodeURIComponent(search)}`
      : "/api/categories"
  );

// ─── GET SINGLE CATEGORY ────────────────────────────────────────────
export const getCategoryById = (id: string) =>
  apiClient(`/api/categories/${id}`);

// ─── CREATE CATEGORY ────────────────────────────────────────────────
export const createCategory = (data: any) =>
  apiClient("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

// ─── UPDATE CATEGORY ────────────────────────────────────────────────
export const updateCategory = (id: string, data: any) =>
  apiClient(`/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

// ─── DELETE CATEGORY ────────────────────────────────────────────────
export const deleteCategory = (id: string) =>
  apiClient(`/api/categories/${id}`, {
    method: "DELETE",
  });

// ─── TOGGLE FEATURED ────────────────────────────────────────────────
export const toggleFeatured = (id: string) =>
  apiClient(`/api/categories/${id}/featured`, {
    method: "PATCH",
  });

// ─── TOGGLE ACTIVE ──────────────────────────────────────────────────
export const toggleActive = (id: string) =>
  apiClient(`/api/categories/${id}/active`, {
    method: "PATCH",
  });