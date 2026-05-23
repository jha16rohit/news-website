import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IBookmark
  extends Document {
  userId: string;
  newsId: string;

  createdAt: Date;
}

const BookmarkSchema =
  new Schema<IBookmark>(
    {
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
      timestamps: {
        createdAt: true,
        updatedAt: false,
      },
    }
  );

BookmarkSchema.index(
  {
    userId: 1,
    newsId: 1,
  },
  {
    unique: true,
  }
);

const Bookmark =
  mongoose.model<IBookmark>(
    "Bookmark",
    BookmarkSchema
  );

export default Bookmark;