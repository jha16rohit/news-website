import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IAdPageSettings
  extends Document {
  id: string;

  whyEnabled: boolean;
  whyPoints: mongoose.Schema.Types.Mixed[];

  packagesEnabled: boolean;
  packages: mongoose.Schema.Types.Mixed[];

  contactEnabled: boolean;
  contactEmail?: string;
  contactPhone?: string;
  contactNote?: string;

  updatedAt: Date;
}

const AdPageSettingsSchema =
  new Schema<IAdPageSettings>(
    {
      id: {
        type: String,
        default: "singleton",
      },

      whyEnabled: {
        type: Boolean,
        default: true,
      },

      whyPoints: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },

      packagesEnabled: {
        type: Boolean,
        default: true,
      },

      packages: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },

      contactEnabled: {
        type: Boolean,
        default: true,
      },

      contactEmail: String,
      contactPhone: String,
      contactNote: String,
    },
    {
      timestamps: {
        createdAt: false,
        updatedAt: true,
      },
    }
  );

const AdPageSettings =
  mongoose.model<IAdPageSettings>(
    "AdPageSettings",
    AdPageSettingsSchema
  );

export default AdPageSettings;