// server/src/models/NewsletterSubscriber.ts
// Stores footer/newsletter email subscribers who get a welcome email on
// signup and a notification email whenever a new article is published.

import mongoose, { Document, Schema } from "mongoose";

export interface INewsletterSubscriber extends Document {
  email: string;
  isActive: boolean;         // false after unsubscribe
  unsubscribeToken: string;  // used in the one-click unsubscribe link
  subscribedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  unsubscribeToken: {
    type: String,
    required: true,
    unique: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
});

const NewsletterSubscriber = mongoose.model<INewsletterSubscriber>(
  "NewsletterSubscriber",
  NewsletterSubscriberSchema
);

export default NewsletterSubscriber;