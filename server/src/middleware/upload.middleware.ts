import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { Request, Response, NextFunction } from "express";

// ─── Supabase client ──────────────────────────────────────────────────────────
// Add to your .env:
//   SUPABASE_URL=https://rgmgvcgpxbwrcyqzdybg.supabase.co
//   SUPABASE_SERVICE_KEY=<service_role key from Supabase dashboard → Settings → API>
//
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BUCKET = "news-images"; // must match the bucket you created in Supabase dashboard

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
export const uploadToSupabase = [
  // Step 1: parse the multipart form into memory
  multerMemory.single("image"),

  // Step 2: stream buffer → Supabase Storage
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.file) return next(); // no image attached — fine, just continue

    try {
      const ext      = path.extname(req.file.originalname).toLowerCase();
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert:      false,
        });

      if (error) throw error;

      // Attach the permanent public URL to the request for the controller to use
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      (req as any).uploadedImageUrl = data.publicUrl;

      next();
    } catch (err) {
      next(err);
    }
  },
];