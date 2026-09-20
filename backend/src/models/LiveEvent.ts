import mongoose, { Document, Schema } from "mongoose";

export interface ILiveEvent extends Document {
  title: string;
  category: string;
  status: "LIVE" | "ENDED" | "SCHEDULED";
  viewers: string;
  lastUpdated: string;
  videoUrl?: string;
  updates: Array<{
    id: string;
    time: string;
    title: string;
    content: string;
    isImportant: boolean;
    imageUrl?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LiveEventSchema = new Schema<ILiveEvent>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["LIVE", "ENDED", "SCHEDULED"],
      default: "LIVE",
    },
    viewers: { type: String, default: "0" },
    lastUpdated: { type: String, default: "Just now" },
    videoUrl: { type: String },
    updates: [
      {
        id: { type: String, required: true },
        time: { type: String, required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        isImportant: { type: Boolean, default: false },
        imageUrl: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.LiveEvent || mongoose.model<ILiveEvent>("LiveEvent", LiveEventSchema);