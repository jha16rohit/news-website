import { apiClient } from "../client";

export const getLiveEvents = async () => {
  try {
    const response = await apiClient("/api/live-events/public");
    return response;
  } catch (error) {
    console.error("getLiveEvents error:", error);
    throw error;
  }
};

export const getLiveEventById = async (eventId: string) => {
  try {
    const response = await apiClient(`/api/live-events/public/${eventId}`);
    return response;
  } catch (error) {
    console.error("getLiveEventById error:", error);
    throw error;
  }
};