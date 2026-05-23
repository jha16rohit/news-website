import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IContactInfo
  extends Document {
  settingsId: string;

  type: string;
  label: string;
  value: string;

  visible: boolean;
  position: number;

  updatedAt: Date;
}

const ContactInfoSchema =
  new Schema<IContactInfo>(
    {
      settingsId: {
        type: String,
        required: true,
        index: true,
      },

      type: {
        type: String,
        required: true,
      },

      label: {
        type: String,
        required: true,
      },

      value: {
        type: String,
        required: true,
      },

      visible: {
        type: Boolean,
        default: true,
      },

      position: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: {
        createdAt: false,
        updatedAt: true,
      },
    }
  );

const ContactInfo =
  mongoose.model<IContactInfo>(
    "ContactInfo",
    ContactInfoSchema
  );

export default ContactInfo;