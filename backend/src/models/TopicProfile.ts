import mongoose, { Document, Schema } from "mongoose";

export interface ITopicProfile extends Document {
  name: string;
  slug: string;
  caption?: string;
  description: string;

  instagram?: string;
  facebook?: string;
  twitter?: string;

  imageUrl?: string;

  authorId: string;

  createdAt: Date;
}

const TopicProfileSchema =
  new Schema<ITopicProfile>(
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

      caption: String,

      description: {
        type: String,
        required: true,
      },

      instagram: String,
      facebook: String,
      twitter: String,

      imageUrl: String,

      authorId: {
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

const TopicProfile =
  mongoose.model<ITopicProfile>(
    "TopicProfile",
    TopicProfileSchema
  );

export default TopicProfile;