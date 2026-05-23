import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IAdInquiry
  extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  budget?: string;

  targetPage?: string;
  duration?: string;
  customDays?: number;
  adType?: string;

  imageUrl?: string;
  linkUrl?: string;
  adTitle?: string;

  status:
    | "pending"
    | "reviewed"
    | "approved"
    | "published"
    | "rejected";

  adminNote?: string;

  publishedAt?: Date;
  expiresAt?: Date;

  submittedAt: Date;
}

const AdInquirySchema =
  new Schema<IAdInquiry>(
    {
      name: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      phone: String,
      company: String,
      message: String,
      budget: String,

      targetPage: String,
      duration: String,

      customDays: Number,

      adType: String,

      imageUrl: String,
      linkUrl: String,
      adTitle: String,

      status: {
        type: String,
        enum: [
          "pending",
          "reviewed",
          "approved",
          "published",
          "rejected",
        ],
        default: "pending",
      },

      adminNote: String,

      publishedAt: Date,
      expiresAt: Date,

      submittedAt: {
        type: Date,
        default: Date.now,
      },
    }
  );

const AdInquiry =
  mongoose.model<IAdInquiry>(
    "AdInquiry",
    AdInquirySchema
  );

export default AdInquiry;