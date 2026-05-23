import mongoose, { Document, Schema } from "mongoose";

export interface ITag extends Document {
  name: string;
  usageCount: number;
  slug: string;
  isTrending: boolean;

  createdAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    isTrending: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

const Tag = mongoose.model<ITag>(
  "Tag",
  TagSchema
);

export default Tag;