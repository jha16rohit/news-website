// client/src/api/footer.ts  (admin)

const BASE_URL = "http://localhost:5001";

import { apiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FooterImage {
  id:         string;
  url:        string;
  name:       string;
  resolution: string;
  isActive:   boolean;
}

export interface FooterSettingsPayload {
  sectionTitle?:    string;
  descriptionText?: string;
  trustedText?:     string;
  images?:          FooterImage[];
}

export interface FooterSettingsResponse extends FooterSettingsPayload {
  id:        string;
  updatedAt: string | null;
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export const fetchFooterSettings = (): Promise<FooterSettingsResponse> =>
  apiClient("/api/footer-settings");

// ─── SAVE ────────────────────────────────────────────────────────────────────
export const saveFooterSettings = (
  data: FooterSettingsPayload
): Promise<{ success: boolean; settings: FooterSettingsResponse }> =>
  apiClient("/api/footer-settings", {
    method: "PUT",
    body:   JSON.stringify(data),
  });

// ─── UPLOAD image file → Supabase via your backend ───────────────────────────
// Must NOT use apiClient here because multipart/form-data
// cannot have Content-Type: application/json set on it
export const uploadFooterImageToSupabase = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${BASE_URL}/api/footer-settings/upload-image`, {
    method:      "POST",
    body:        formData,
    credentials: "include",
    // ⚠️ Do NOT set Content-Type here — browser sets it automatically
    // with the correct multipart boundary when using FormData
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Upload failed (${res.status})`);

  return json.url as string;
};

// ─── DELETE image from Supabase + DB ─────────────────────────────────────────
export const deleteFooterImageFromDB = (
  imageUrl: string
): Promise<{ success: boolean }> =>
  apiClient("/api/footer-settings/delete-image", {
    method: "DELETE",
    body:   JSON.stringify({ imageUrl }),
  });