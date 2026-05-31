import { apiClient } from "../client";

export const getTopicProfiles =
  async () => {
    try {
      const response =
        await apiClient(
          "/api/topic-profiles"
        );

      return response;

    } catch (error) {
      console.error(
        "getTopicProfiles error:",
        error
      );

      throw error;
    }
  };