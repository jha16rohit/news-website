import { apiClient } from "../client";

// ─── GET ALL ACTIVE CATEGORIES (public) ────────────────────────────────────
// Used for the public nav / category menu / filters. Only ever returns
// categories the admin/editor has marked active.
export const getPublicCategories = async () => {
  try {
    const response = await apiClient(
      `/api/categories/public`
    );

    return response;

  } catch (error) {
    console.error(
      "getPublicCategories error:",
      error
    );

    throw error;
  }
};

// ─── GET NEWS FOR ONE CATEGORY (public) ────────────────────────────────────
export const getCategoryNews = async (
  slug: string
) => {
  try {
    const response = await apiClient(
      `/api/categories/public/${slug}/news`
    );

    return response;

  } catch (error) {
    console.error(
      "getCategoryNews error:",
      error
    );

    throw error;
  }
};