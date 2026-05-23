import mongoose, { Document, Schema } from "mongoose";

export interface ISiteUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  googleId?: string;
  profilePic?: string;

  role: "USER" | "ADMIN" | "EDITOR";

  isVerified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const SiteUserSchema = new Schema<ISiteUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
    },

    password: {
      type: String,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    profilePic: {
      type: String,
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN", "EDITOR"],
      default: "USER",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const SiteUser = mongoose.model<ISiteUser>(
  "SiteUser",
  SiteUserSchema
);

export default SiteUser;