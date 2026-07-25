import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IAdInquiry extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;

  adType: "card" | "strip";

  imageUrl?: string;
imagePublicId?: string;
linkUrl?: string;
adTitle?: string;

  status:
    | "pending"
    | "published"
    | "rejected";

  rejectionReason?: string;

  publishedAt?: Date;
  expiresAt?: Date;

  submittedAt: Date;
}

const AdInquirySchema = new Schema<IAdInquiry>({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },

  phone: {
    type: String,
    trim: true,
  },

  company: {
    type: String,
    trim: true,
  },

  message: {
    type: String,
    trim: true,
  },

  adType: {
    type: String,
    enum: ["card", "strip"],
    required: true,
  },

  imageUrl: {
  type: String,
},

imagePublicId: {
  type: String,
},

  linkUrl: {
    type: String,
    trim: true,
  },

  adTitle: {
    type: String,
    trim: true,
  },

  status: {
    type: String,
    enum: [
      "pending",
      "published",
      "rejected",
    ],
    default: "pending",
  },

  rejectionReason: {
    type: String,
    trim: true,
},

  publishedAt: {
    type: Date,
  },

  expiresAt: {
    type: Date,
  },

  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

const AdInquiry = mongoose.model<IAdInquiry>(
  "AdInquiry",
  AdInquirySchema
);

export default AdInquiry;