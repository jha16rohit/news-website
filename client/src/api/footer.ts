// client/src/api/footer.ts  (admin)

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
// FIX: this used a raw `fetch()` with `credentials: "include"` and never
// attached the admin's Bearer token — same missing-auth-header bug found
// elsewhere in this app (comment.ts, before it was fixed). This is an
// admin-only route, so the upload was almost certainly 401ing.
// `apiClient` already handles FormData bodies correctly (it detects
// `instanceof FormData`, skips JSON-stringifying it, and skips forcing a
// Content-Type header so the browser sets the correct multipart boundary)
// and attaches the Bearer token automatically, so we just route through it.
export const uploadFooterImageToSupabase = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const json = await apiClient("/api/footer-settings/upload-image", {
    method: "POST",
    body: formData,
  });

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