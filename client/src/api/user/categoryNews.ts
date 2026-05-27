import { apiClient } from "../client";

export const getCategoryNews = async (
  slug: string
) => {
  try {
    const response = await apiClient(
      `/api/categories/${slug}/news`
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