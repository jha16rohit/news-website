import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface INews extends Document {
  headline: string;
  shortTitle?: string;
  excerpt?: string;
  content: string;

  categoryId: string;

  categories: string[];

  language: string;
  location?: string;

  tags: string[];

  articleType:
    | "STANDARD"
    | "BREAKING"
    | "LIVE";

  breakingNewsTicker: boolean;
  breakingPushNotif: boolean;
  breakingHomepageAlert: boolean;

  expiryTime?: Date;

  priority?:
    | "CRITICAL"
    | "HIGH"
    | "MEDIUM";

  statusType?: string; // e.g. "published" | "paused" | "scheduled"

  liveUpdates?: any;

  featuredImage?: string;
  imageCaption?: string;
  photoCredit?: string;

  metaTitle?: string;
  metaDescription?: string;

  slug: string;

  displayOrder: number;
isPinned: boolean;

  keywords: string[];

  focusKeywords?: string;
  canonicalUrl?: string;

  status:
    | "DRAFT"
    | "PUBLISHED"
    | "SCHEDULED"
    | "EXPIRED"
    | "DELETED"
    | "ARCHIVED";

  publishedAt?: Date;
  scheduledAt?: Date;

  deletedAt?: Date;
  deleteAfter?: Date;

  authorId: string;

  topicProfileId?: string;

  views: number;

  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new Schema<INews>(
  {
    headline: {
      type: String,
      required: true,
      trim: true,
    },

    shortTitle: String,

    excerpt: String,

    content: {
      type: String,
      required: true,
    },

    categoryId: {
      type: String,
      required: true,
      index: true,
    },

    categories: {
      type: [String],
      default: [],
    },

    language: {
      type: String,
      default: "English",
    },

    location: String,

    tags: {
      type: [String],
      default: [],
    },

    articleType: {
      type: String,
      enum: [
        "STANDARD",
        "BREAKING",
        "LIVE",
      ],
      default: "STANDARD",
    },

    breakingNewsTicker: {
      type: Boolean,
      default: false,
    },

    breakingPushNotif: {
      type: Boolean,
      default: false,
    },

    breakingHomepageAlert: {
      type: Boolean,
      default: false,
    },

    expiryTime: Date,

    priority: {
      type: String,
      enum: [
        "CRITICAL",
        "HIGH",
        "MEDIUM",
      ],
    },

    statusType: {
      type: String,
      default: null,
    },

    liveUpdates: {
      type: Schema.Types.Mixed,
    },

    featuredImage: String,
    imageCaption: String,
    photoCredit: String,

    metaTitle: String,
    metaDescription: String,

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    displayOrder: {
  type: Number,
  default: 0,
  index: true,
},

isPinned: {
  type: Boolean,
  default: false,
  index: true,
},

    keywords: {
      type: [String],
      default: [],
    },

    focusKeywords: String,
    canonicalUrl: String,

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PUBLISHED",
        "SCHEDULED",
        "EXPIRED",
        "DELETED",
        "ARCHIVED",
      ],
      default: "DRAFT",
      index: true,
    },

    publishedAt: {
      type: Date,
      index: true,
    },

    scheduledAt: Date,

    deletedAt: Date,
    deleteAfter: Date,

    authorId: {
      type: String,
      required: true,
      index: true,
    },

    topicProfileId: {
      type: String,
      default: null,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const News = mongoose.model<INews>(
  "News",
  NewsSchema
);

export default News;