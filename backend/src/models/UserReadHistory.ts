import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IUserReadHistory
  extends Document {
  userId: string;
  newsId: string;

  readAt: Date;
}

const UserReadHistorySchema =
  new Schema<IUserReadHistory>(
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

      readAt: {
        type: Date,
        default: Date.now,
      },
    }
  );

UserReadHistorySchema.index(
  {
    userId: 1,
    newsId: 1,
  },
  {
    unique: true,
  }
);

const UserReadHistory =
  mongoose.model<IUserReadHistory>(
    "UserReadHistory",
    UserReadHistorySchema
  );

export default UserReadHistory;