import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IPublishedAd extends Document {
  inquiryId: string;

  imageUrl: string;

  linkUrl?: string;
  altText?: string;

  advertiser: string;

  adType: "card" | "strip";

  status: "active" | "expired" | "ended";

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

const PublishedAdSchema = new Schema<IPublishedAd>(
  {
    inquiryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    linkUrl: {
      type: String,
    },

    altText: {
      type: String,
    },

    advertiser: {
      type: String,
      required: true,
    },


    adType: {
      type: String,
      enum: ["card", "strip"],
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "ended"],
      default: "active",
      required: true,
    },

    durationDays: {
      type: Number,
      required: true,
    },

    publishNotes: {
      type: String,
    },

    publishedAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    renewedAt: {
      type: Date,
    },

    endedAt: {
      type: Date,
    },

    endReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const PublishedAd = mongoose.model<IPublishedAd>(
  "PublishedAd",
  PublishedAdSchema
);

export default PublishedAd;