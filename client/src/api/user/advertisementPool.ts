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
  try {
    const qs = new URLSearchParams();
    qs.set("cards", String(params.cards));
    qs.set("strips", String(params.strips));

    const response: AdvertisementPoolResponse = await apiClient(
      `/api/advertisement-pool/pool?${qs.toString()}`
    );

    // 👇 UNPACK AND PRINT THE ARRAYS DIRECTLY TO THE CONSOLE
    console.log("✅ AD DEBUG - Cards Found:", response.data?.cards);
    console.log("✅ AD DEBUG - Strips Found:", response.data?.strips);

    if (response && response.data) {
      return response.data;
    }

    return { cards: [], strips: [] };

  } catch (error: any) {
    console.error("❌ AD DEBUG - API Fetch Failed:", error);
    return { cards: [], strips: [] };
  }
};