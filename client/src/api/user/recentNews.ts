import { apiClient } from "../client";

export const getRecentNews =
  async () => {

    try {

      const response =
        await apiClient(
          "/api/news/recent"
        );

      return response;

    } catch (error) {

      console.error(
        "getRecentNews error:",
        error
      );

      throw error;
    }
};