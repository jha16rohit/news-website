// server/src/models/AdRequest.ts
// Tracks advertisement/sponsorship requests submitted to the site.
// New model — nothing like this existed yet.

import mongoose, { Document, Schema } from "mongoose";

export type AdRequestStatus = "pending" | "approved" | "rejected";

export interface IAdRequest extends Document {
  businessName: string;
  contactEmail: string;
  contactPhone?: string;
  message?: string;
  status: AdRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AdRequestSchema = new Schema<IAdRequest>(
  {
    businessName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String },
    message: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

const AdRequest = mongoose.model<IAdRequest>("AdRequest", AdRequestSchema);
export default AdRequest;