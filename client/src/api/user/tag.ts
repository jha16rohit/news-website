import { apiClient } from "../client";

export const getTrendingTags = async () => {
  try {
    const response = await apiClient(
      "/api/tags/trending"
    );

    return response;

  } catch (error) {
    console.error(
      "getTrendingTags error:",
      error
    );

    throw error;
  }
};