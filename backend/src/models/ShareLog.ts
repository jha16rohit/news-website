import mongoose, { Document, Schema } from "mongoose";

export interface IShareLog extends Document {
  userId: string;
  newsId: string;
  platform: "whatsapp" | "facebook" | "instagram" | "twitter" | "linkedin" | "other";
  sharedAt: Date;
}

const ShareLogSchema = new Schema<IShareLog>({
  userId: { type: String, required: true, index: true },
  newsId: { type: String, required: true, index: true },
  platform: {
    type: String,
    enum: ["whatsapp", "facebook", "twitter", "linkedin", "other"],
    required: true,
  },
  sharedAt: { type: Date, default: Date.now, index: true },
});

const ShareLog = mongoose.model<IShareLog>("ShareLog", ShareLogSchema);
export default ShareLog;