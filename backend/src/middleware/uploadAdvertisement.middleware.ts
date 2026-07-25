import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";

// Multer configuration (store file in memory)
const multerMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;

    const extOk = allowed.test(
      path.extname(file.originalname).toLowerCase()
    );

    const mimeOk = allowed.test(file.mimetype);

    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP images are allowed."
        )
      );
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// Advertisement Upload Middleware
export const uploadAdvertisement = [
  multerMemory.single("adImage"),

  async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    if (!req.file) return next();

    try {
      const base64 = req.file.buffer.toString("base64");

      const dataURI = `data:${req.file.mimetype};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "advertisement-images",
      });

      (req as any).uploadedImageUrl = result.secure_url;
      (req as any).uploadedImagePublicId = result.public_id;

      next();
    } catch (err) {
      next(err);
    }
  },
];