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

export interface AdInquiryResponse {
  id: string;
  submittedAt: string;
  status: string;
  name: string;
  email: string;
}

export interface MyAdInquiry {
  id: string;
  adType: "card" | "strip";
  status: "pending" | "published" | "rejected";
  submittedAt: string;
  rejectionReason?: string;
  price?: string;
  durationDays?: number;
  expiresAt?: string;
}

// Get sidebar settings
export const getAdPageSettings = (): Promise<AdPageSettings> =>
  apiClient("/api/advertisement/page-settings");

// Submit advertisement inquiry
export const submitAdInquiry = (
  data: FormData
): Promise<AdInquiryResponse> =>
  apiClient("/api/advertisement/inquiries", {
    method: "POST",
    body: data,
  });

// Get my advertisement requests
export const getMyAdInquiries = (): Promise<MyAdInquiry[]> =>
  apiClient("/api/advertisement/my-inquiries");