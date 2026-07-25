import mongoose, { Document, Schema } from "mongoose";

export interface IAdvertisementPool extends Document {
  publishedAdId: string;

  adType: "card" | "strip";

  queueOrder: number;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementPoolSchema =
  new Schema<IAdvertisementPool>(
    {
      publishedAdId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      adType: {
        type: String,
        enum: ["card", "strip"],
        required: true,
      },

      queueOrder: {
        type: Number,
        required: true,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model<IAdvertisementPool>(
  "AdvertisementPool",
  AdvertisementPoolSchema
);