import { apiClient } from "./client";

export const getProfiles = () =>
  apiClient("/api/topic-profiles");

export const createProfile = (data: any) =>
  apiClient("/api/topic-profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const updateProfile = (id: string, data: any) =>
  apiClient(`/api/topic-profiles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const deleteProfile = (id: string) =>
  apiClient(`/api/topic-profiles/${id}`, {
    method: "DELETE",
  });