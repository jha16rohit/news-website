import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  color?: string;

  parentId?: string;

  featured: boolean;
  showcase: boolean;
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
    },

    color: {
      type: String,
    },

    parentId: {
      type: String,
      default: null,
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    showcase: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model<ICategory>(
  "Category",
  CategorySchema
);

export default Category;