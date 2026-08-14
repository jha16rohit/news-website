// server/src/models/PushSubscription.ts
// Stores browser push subscriptions (device notifications). Kept separate
// from NewsletterSubscriber because enabling browser notifications is a
// per-device browser permission, not an email opt-in — a visitor can have
// one, both, or neither.

import mongoose, { Document, Schema } from "mongoose";

export interface IPushSubscription extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  email?: string;        // optional — set if we know who this device belongs to
  userAgent?: string;
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  endpoint: {
    type: String,
    required: true,
    unique: true,
  },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PushSubscriptionModel = mongoose.model<IPushSubscription>(
  "PushSubscription",
  PushSubscriptionSchema
);

export default PushSubscriptionModel;