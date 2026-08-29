import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary";

// ─── Supabase client ──────────────────────────────────────────────────────────
// Add to your .env:
//   SUPABASE_URL=https://rgmgvcgpxbwrcyqzdybg.supabase.co
//   SUPABASE_SERVICE_KEY=<service_role key from Supabase dashboard → Settings → API>
//

 // must match the bucket you created in Supabase dashboard

// ─── multer: keep file in memory, never touch disk ───────────────────────────
const multerMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk  = allowed.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error("Only image files (jpg, png, gif, webp, svg) are allowed."));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─── Combined middleware: parse → upload to Supabase → attach public URL ──────
//
// Usage in routes:  router.post("/create", uploadToSupabase, createNews);
//
// After this runs, the controller can read:
//   (req as any).uploadedImageUrl  →  full public Supabase URL, or undefined
//
export const uploadToCloudinary = [
  multerMemory.single("image"),

  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.file) return next();

    try {
      const base64 = req.file.buffer.toString("base64");

      const dataURI = `data:${req.file.mimetype};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "news-images",
      });

      (req as any).uploadedImageUrl = result.secure_url;

      next();
    } catch (err) {
      next(err);
    }
  },
];