import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IContactUsSettings
  extends Document {
  id: string;

  heroVisible: boolean;
  heroTitle?: string;
  heroSubtitle?: string;

  contactInfoVisible: boolean;

  formVisible: boolean;
  formTitle?: string;
  formSubtitle?: string;
  formSuccessMsg?: string;

  subjectOptions?: any[];

  faqVisible: boolean;
  faqTitle?: string;

  updatedAt: Date;
}

const ContactUsSettingsSchema =
  new Schema<IContactUsSettings>(
    {
      id: {
        type: String,
        default: "singleton",
      },

      heroVisible: {
        type: Boolean,
        default: true,
      },

      heroTitle: String,
      heroSubtitle: String,

      contactInfoVisible: {
        type: Boolean,
        default: true,
      },

      formVisible: {
        type: Boolean,
        default: true,
      },

      formTitle: String,
      formSubtitle: String,
      formSuccessMsg: String,

      subjectOptions: {
        type: [Schema.Types.Mixed],
        default: [],
      },

      faqVisible: {
        type: Boolean,
        default: true,
      },

      faqTitle: String,
    },
    {
      timestamps: {
        createdAt: false,
        updatedAt: true,
      },
    }
  );

const ContactUsSettings =
  mongoose.model<IContactUsSettings>(
    "ContactUsSettings",
    ContactUsSettingsSchema
  );

export default ContactUsSettings;