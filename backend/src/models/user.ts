import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  userId: string;
  name: string;
  email: string;
  password: string;
  phone?: string;

  role: "ADMIN" | "EDITOR";

  permissions: string[];

  status: "Active" | "Inactive" | "Deleted";

  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
    },

    role: {
      type: String,
      enum: ["ADMIN", "EDITOR"],
      default: "EDITOR",
    },

    permissions: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Deleted"],
      default: "Active",
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

const User = mongoose.model<IUser>("User", UserSchema);

export default User;