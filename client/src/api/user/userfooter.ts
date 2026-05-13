// client/src/api/user/footer.ts

import { apiClient } from "../client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FooterImage {
  id:         string;
  url:        string;
  name:       string;
  resolution: string;
  isActive:   boolean;
}

export interface FooterSettingsData {
  id:              string;
  sectionTitle:    string;
  descriptionText: string;
  trustedText:     string;
  images:          FooterImage[];
  updatedAt:       string | null;
}

// ─── GET footer settings (public — no auth needed) ───────────────────────────
export const getFooterSettings = (): Promise<FooterSettingsData> =>
  apiClient("/api/footer-settings");