import { apiClient } from "../client";

export const getTagNews = async (
  slug: string
) => {
  try {

    const response =
      await apiClient(
        `/api/news/tag/${slug}`
      );

    return response;

  } catch (error) {

    console.error(
      "getTagNews error:",
      error
    );

    throw error;
  }
};