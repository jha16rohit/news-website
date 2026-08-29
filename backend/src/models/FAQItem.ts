import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IFAQItem
  extends Document {
  settingsId: string;

  question: string;
  answer: string;

  visible: boolean;
  position: number;

  updatedAt: Date;
}

const FAQItemSchema =
  new Schema<IFAQItem>(
    {
      settingsId: {
        type: String,
        required: true,
        index: true,
      },

      question: {
        type: String,
        required: true,
      },

      answer: {
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

const FAQItem =
  mongoose.model<IFAQItem>(
    "FAQItem",
    FAQItemSchema
  );

export default FAQItem;