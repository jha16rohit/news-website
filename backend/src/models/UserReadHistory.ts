import mongoose, { Document, Schema } from "mongoose";

export interface IUserReadHistory extends Document {
  userId: string;
  newsId: string;
  readAt: Date;
  durationSeconds: number; // ← NEW
}

const UserReadHistorySchema = new Schema<IUserReadHistory>({
  userId: { type: String, required: true, index: true },
  newsId: { type: String, required: true, index: true },
  readAt: { type: Date, default: Date.now, index: true },
  durationSeconds: { type: Number, default: 0 }, // ← NEW
});

UserReadHistorySchema.index({ userId: 1, newsId: 1 }, { unique: true });
UserReadHistorySchema.index({ userId: 1, readAt: -1 }); // ← NEW, speeds up 7-day queries

const UserReadHistory = mongoose.model<IUserReadHistory>("UserReadHistory", UserReadHistorySchema);
export default UserReadHistory;