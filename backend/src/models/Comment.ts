import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IComment
  extends Document {
  content: string;

  userId: string;
  newsId: string;

  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema =
  new Schema<IComment>(
    {
      content: {
        type: String,
        required: true,
        trim: true,
      },

      userId: {
        type: String,
        required: true,
        index: true,
      },

      newsId: {
        type: String,
        required: true,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

const Comment =
  mongoose.model<IComment>(
    "Comment",
    CommentSchema
  );

export default Comment;