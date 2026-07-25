import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";

const multerFooter = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);

    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, png, gif, webp) are allowed."));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

export const uploadFooterImage = [

  (req: Request, res: Response, next: NextFunction) => {
    multerFooter.single("image")(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            message: "File too large. Maximum size is 50 MB.",
          });
        }

        return res.status(400).json({
          message: err.message,
        });
      }

      next();
    });
  },

  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided.",
      });
    }

    try {
      const base64 = req.file.buffer.toString("base64");

      const dataURI = `data:${req.file.mimetype};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "footer-images",
      });

      (req as any).uploadedFooterImageUrl = result.secure_url;

      next();
    } catch (err: any) {
      console.error(err);

      return res.status(500).json({
        message: err.message || "Failed to upload footer image.",
      });
    }
  },
];

export const deleteFooterImageFromStorage = async (
  imageUrl: string
): Promise<void> => {
  try {
    const publicId = imageUrl
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0];

    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Cloudinary delete warning:", err);
  }
};