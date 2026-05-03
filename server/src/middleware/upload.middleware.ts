import multer, { StorageEngine, FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// ─── Auto-create the uploads directory if it doesn't exist ────────────────────
// Place this file at:  server/src/middleware/upload.middleware.ts
// The uploads folder will be created at:  server/uploads/
//
// Also add this line to your main server file (e.g. index.ts / app.ts) so the
// folder is served as static files:
//
//   import path from "path";
//   app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
//
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`[upload] Created uploads directory at: ${UPLOADS_DIR}`);
}

// ─── Storage config ────────────────────────────────────────────────────────────
const storage: StorageEngine = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, UPLOADS_DIR);
  },

  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// ─── File type filter (images only) ───────────────────────────────────────────
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg/;
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk  = allowed.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, png, gif, webp, svg) are allowed."));
  }
};

// ─── Export ────────────────────────────────────────────────────────────────────
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
});