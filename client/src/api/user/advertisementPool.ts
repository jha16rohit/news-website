// client/src/api/user/advertisementPool.ts

import { apiClient } from "../client";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Advertisement {
  _id: string;
  inquiryId: string;
  advertiser: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  adType: "card" | "strip";
  status: "active" | "expired" | "ended";
  durationDays: number;
  publishNotes?: string;
  publishedAt: string;
  expiresAt: string;
  renewedAt?: string;
  endedAt?: string;
  endReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdvertisementPoolRequest {
  cards: number;
  strips: number;
}

export interface AdvertisementPoolData {
  cards: Advertisement[];
  strips: Advertisement[];
}

export interface AdvertisementPoolResponse {
  success: boolean;
  message: string;
  data: AdvertisementPoolData;
}

// ─── GET ADVERTISEMENT POOL ───────────────────────────────────────────────────

export const getAdvertisementPool = async (
  params: AdvertisementPoolRequest
): Promise<AdvertisementPoolData> => {
  const qs = new URLSearchParams();

  qs.set("cards", String(params.cards));
  qs.set("strips", String(params.strips));

  const response: AdvertisementPoolResponse = await apiClient(
    `/api/advertisement-pool/pool?${qs.toString()}`
  );

  return response.data;
};