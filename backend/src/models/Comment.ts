// server/src/models/Comment.ts

import mongoose, { Document, Schema } from "mongoose";

export interface IReaction {
  userId: string;
  type: "like" | "dislike";
}

export interface IComment extends Document {
  content: string;
  userId: string;
  userName: string;
  userProfilePic?: string;
  newsId: string;
  parentId?: string | null;   // null = top-level comment, set = reply
  reactions: IReaction[];
  reportedBy: string[];       // array of userIds who reported
  status: "pending" | "approved" | "rejected";
  isVerified?: boolean;       // e.g. for official LocalNewz replies
  createdAt: Date;
  updatedAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
  {
    userId: { type: String, required: true },
    type:   { type: String, enum: ["like", "dislike"], required: true },
  },
  { _id: false }
);

const CommentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userProfilePic: {
      type: String,
      default: null,
    },
    newsId: {
      type: String,
      required: true,
      index: true,
    },
    parentId: {
      type: String,
      default: null,
      index: true,
    },
    reactions: {
      type: [ReactionSchema],
      default: [],
    },
    reportedBy: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",   // auto-approve; change to "pending" if you want moderation
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model<IComment>("Comment", CommentSchema);
export default Comment;