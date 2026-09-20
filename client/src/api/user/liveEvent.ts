import { apiClient } from "../client";

// DEPRECATED: These functions now use the News API instead of the old LiveEvent API
// Kept for backward compatibility during transition

export const getLiveEvents = async () => {
  try {
    const response = await apiClient("/api/news?articleType=LIVE&status=PUBLISHED&limit=50");
    return response?.news || [];
  } catch (error) {
    console.error("getLiveEvents error:", error);
    throw error;
  }
};

export const getLiveEventById = async (eventId: string) => {
  try {
    const response = await apiClient(`/api/news/${eventId}`);
    if (response && response.articleType === "LIVE") {
      return response;
    }
    throw new Error("Not found");
  } catch (error) {
    console.error("getLiveEventById error:", error);
    throw error;
  }
};