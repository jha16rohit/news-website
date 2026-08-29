import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IFooterSettings
  extends Document {
  id: string;

  sectionTitle: string;

  descriptionText: string;

  trustedText: string;

images: mongoose.Schema.Types.Mixed[];

  updatedAt: Date;
}

const FooterSettingsSchema =
  new Schema<IFooterSettings>(
    {
      id: {
        type: String,
        default: "singleton",
      },

      sectionTitle: {
        type: String,
        default: "STAY UPDATED",
      },

      descriptionText: {
        type: String,
        default:
          "Get the latest headlines, breaking news, and exclusive updates delivered straight to your inbox.",
      },

      trustedText: {
        type: String,
        default:
          "Your trusted source for accurate and timely news coverage around the clock.",
      },
images: {
  type: [Schema.Types.Mixed],
  default: [],
},
    },
    {
      timestamps: {
        createdAt: false,
        updatedAt: true,
      },
    }
  );

const FooterSettings =
  mongoose.model<IFooterSettings>(
    "FooterSettings",
    FooterSettingsSchema
  );

export default FooterSettings;