import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface INewsLike
  extends Document {
  userId: string;
  newsId: string;

  createdAt: Date;
}

const NewsLikeSchema =
  new Schema<INewsLike>(
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

NewsLikeSchema.index(
  {
    userId: 1,
    newsId: 1,
  },
  {
    unique: true,
  }
);

const NewsLike =
  mongoose.model<INewsLike>(
    "NewsLike",
    NewsLikeSchema
  );

export default NewsLike;