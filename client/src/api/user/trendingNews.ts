import { apiClient } from "../client";

export const getTrendingNews =
  async (signal?: AbortSignal) => {
    return await apiClient(
      "/api/news/trending-news",
      { signal }
    );
  };