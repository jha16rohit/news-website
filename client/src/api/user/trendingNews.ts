import { apiClient } from "../client";

export const getTrendingNews =
  async () => {
    return await apiClient(
      "/api/news/trending-news"
    );
  };