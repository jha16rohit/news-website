import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { Request, Response, NextFunction } from "express";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const FOOTER_BUCKET = "footer-images"; // Must exist in Supabase dashboard as a PUBLIC bucket

// ─── multer: memory storage, 50 MB limit ─────────────────────────────────────
const multerFooter = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk  = allowed.test(file.mimetype);
    if (extOk && mimeOk) cb(null, true);
    else cb(new Error("Only image files (jpg, png, gif, webp) are allowed."));
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─── Middleware array ─────────────────────────────────────────────────────────
export const uploadFooterImage = [

  // Step 1: Parse multipart form — catch multer errors (e.g. file too large)
  (req: Request, res: Response, next: NextFunction) => {
    multerFooter.single("image")(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ message: "File too large. Maximum size is 50 MB." });
        }
        return res.status(400).json({ message: err.message || "File upload error." });
      }
      next();
    });
  },

  // Step 2: Upload buffer → Supabase Storage
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided." });
    }

    try {
      const ext      = path.extname(req.file.originalname).toLowerCase();
      const filename = `footer-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      const { error } = await supabase.storage
        .from(FOOTER_BUCKET)
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert:      false,
        });

      if (error) throw error;

      const { data } = supabase.storage.from(FOOTER_BUCKET).getPublicUrl(filename);
      (req as any).uploadedFooterImageUrl = data.publicUrl;

      next();
    } catch (err: any) {
      console.error("Supabase footer upload error:", err);
      return res.status(500).json({
        message: err?.message || "Failed to upload image to storage.",
      });
    }
  },
];

// ─── Helper: delete a footer image from Supabase Storage ─────────────────────
export const deleteFooterImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    const filename = imageUrl.split(`/${FOOTER_BUCKET}/`).pop();
    if (!filename) return;

    const { error } = await supabase.storage.from(FOOTER_BUCKET).remove([filename]);
    if (error) console.warn("Supabase footer image delete warning:", error.message);
  } catch (err) {
    console.warn("Could not delete footer image from Supabase Storage:", err);
  }
};