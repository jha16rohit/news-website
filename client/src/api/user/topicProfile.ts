import { apiClient } from "../client";

export const getTopicProfiles =
  async () => {
    try {
      const response =
        await apiClient(
          "/api/topic-profiles/public"
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

export const getTopicProfileBySlug =
  async (slug: string) => {
    try {
      const response =
        await apiClient(
          `/api/topic-profiles/public/${slug}`
        );

      return response;

    } catch (error) {
      console.error(
        "getTopicProfileBySlug error:",
        error
      );

      throw error;
    }
  };