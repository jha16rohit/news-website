// client/src/api/user/advertise.ts
// ─────────────────────────────────────────────
// User-facing Advertise With Us API calls

import { apiClient } from "../client";

export interface AdPageSettings {
  whyEnabled: boolean;
  whyPoints: string[];
  packagesEnabled: boolean;
  packages: { label: string; price: string }[];
  contactEnabled: boolean;
  contactEmail: string;
  contactPhone: string;
  contactNote: string;
}

export interface AdInquiryPayload {
  name: string;
  email: string;
  phone: string;
  company?: string;
  message?: string;
  budget?: string;
  targetPage: string;
  duration: string;
  customDays?: string;
  adType: string;
  imageUrl?: string;
  linkUrl?: string;
  adTitle?: string;
}

export interface AdInquiryResponse {
  id: string;
  submittedAt: string;
  status: string;
  name: string;
  email: string;
}

// Get sidebar settings (public)
export const getAdPageSettings = (): Promise<AdPageSettings> =>
  apiClient("/api/advertisement/page-settings");

// Submit ad inquiry (public)
export const submitAdInquiry = (
  data: AdInquiryPayload
): Promise<AdInquiryResponse> =>
  apiClient("/api/advertisement/inquiries", {
    method: "POST",
    body: JSON.stringify(data),
  });