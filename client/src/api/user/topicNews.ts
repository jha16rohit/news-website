import { apiClient } from "../client";

export const getTopicNews =
  async (slug: string) => {

    try {

      const response =
        await apiClient(
          `/api/news/topic/${slug}`
        );

      return response;

    } catch (error) {

      console.error(
        "getTopicNews error:",
        error
      );

      throw error;
    }
  };