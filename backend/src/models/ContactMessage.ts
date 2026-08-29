import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IContactMessage
  extends Document {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;

  read: boolean;
  replied: boolean;
  replyText?: string;

  receivedAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema =
  new Schema<IContactMessage>(
    {
      name: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      phone: String,

      subject: String,

      message: {
        type: String,
        required: true,
      },

      read: {
        type: Boolean,
        default: false,
      },

      replied: {
        type: Boolean,
        default: false,
      },

      replyText: String,

      receivedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: {
        createdAt: false,
        updatedAt: true,
      },
    }
  );

const ContactMessage =
  mongoose.model<IContactMessage>(
    "ContactMessage",
    ContactMessageSchema
  );

export default ContactMessage;