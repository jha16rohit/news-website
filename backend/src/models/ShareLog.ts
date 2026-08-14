import mongoose, { Document, Schema } from "mongoose";

export interface IShareLog extends Document {
  userId: string;
  newsId: string;
<<<<<<< HEAD
  platform: "whatsapp" | "facebook" | "instagram" | "twitter" | "linkedin" | "other";
=======
  platform: "whatsapp" | "facebook" | "twitter" | "linkedin" | "instagram" | "other";
>>>>>>> Testing
  sharedAt: Date;
}

const ShareLogSchema = new Schema<IShareLog>({
  userId: { type: String, required: true, index: true },
  newsId: { type: String, required: true, index: true },
  platform: {
    type: String,
<<<<<<< HEAD
    enum: ["whatsapp", "facebook", "twitter", "linkedin", "other"],
=======
    enum: ["whatsapp", "facebook", "twitter", "linkedin", "instagram", "other"],
>>>>>>> Testing
    required: true,
  },
  sharedAt: { type: Date, default: Date.now, index: true },
});

const ShareLog = mongoose.model<IShareLog>("ShareLog", ShareLogSchema);
export default ShareLog;