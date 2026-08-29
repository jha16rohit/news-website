import { Types } from "mongoose";

export type AdvertisementType = "card" | "strip";

export type AdvertisementStatus =
  | "active"
  | "expired"
  | "ended";

export interface PoolAdvertisement {
  _id: Types.ObjectId;

  inquiryId: Types.ObjectId;

  imageUrl: string;

  linkUrl?: string;

  altText?: string;

  advertiser: string;

  adType: AdvertisementType;

  status: AdvertisementStatus;

  durationDays: number;

  publishNotes?: string;

  publishedAt: Date;

  expiresAt: Date;

  renewedAt?: Date;

  endedAt?: Date;

  endReason?: string;

  createdAt: Date;

  updatedAt: Date;
}

export interface PoolRequest {
  cards: number;
  strips: number;
}

export interface PoolResponse {
  cards: PoolAdvertisement[];
  strips: PoolAdvertisement[];
}