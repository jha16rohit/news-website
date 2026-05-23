import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IPublishedAd
  extends Document {
  inquiryId: string;

  imageUrl: string;

  linkUrl?: string;
  altText?: string;

  targetPage?: string;
  adTitle?: string;
  advertiser?: string;

  isActive: boolean;

  publishedAt: Date;
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PublishedAdSchema =
  new Schema<IPublishedAd>(
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

      linkUrl: String,

      altText: String,

      targetPage: String,
      adTitle: String,
      advertiser: String,

      isActive: {
        type: Boolean,
        default: true,
      },

      publishedAt: {
        type: Date,
        required: true,
      },

      expiresAt: {
        type: Date,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

const PublishedAd =
  mongoose.model<IPublishedAd>(
    "PublishedAd",
    PublishedAdSchema
  );

export default PublishedAd;