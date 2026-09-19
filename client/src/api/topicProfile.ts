import { apiClient } from "./client";

const normalizeProfile = (profile: any) => ({
  ...profile,
  id: profile.id ?? profile._id,
  authorId: profile.authorId,
});

export const getProfiles = async () => {
  const data = await apiClient("/api/topic-profiles");

  return Array.isArray(data)
    ? data.map(normalizeProfile)
    : [];
};

export const createProfile = async (data: any) => {
  const profile = await apiClient("/api/topic-profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return normalizeProfile(profile);
};

export const updateProfile = async (id: string, data: any) => {
  const profile = await apiClient(`/api/topic-profiles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return normalizeProfile(profile);
};

export const deleteProfile = (id: string) =>
  apiClient(`/api/topic-profiles/${id}`, {
    method: "DELETE",
  });