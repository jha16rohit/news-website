// server/src/models/LoginLog.ts
// Records every successful site-user login (password or Google).
// New model — nothing tracked logins before this. Powers "Login Activity"
// and "Average Login Per User" on the User Insights page. Data accrues
// going forward from when this ships; it can't reconstruct past logins.

import mongoose, { Document, Schema } from "mongoose";

export type LoginMethod = "password" | "google" | "register";

export interface ILoginLog extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  method: LoginMethod;
  createdAt: Date;
}

const LoginLogSchema = new Schema<ILoginLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "SiteUser", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    method: { type: String, enum: ["password", "google", "register"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LoginLogSchema.index({ createdAt: 1 });

const LoginLog = mongoose.model<ILoginLog>("LoginLog", LoginLogSchema);
export default LoginLog;