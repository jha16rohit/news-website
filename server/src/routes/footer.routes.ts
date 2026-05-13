import { Router } from "express";
import {
  getFooterSettings,
  updateFooterSettings,
  uploadFooterImageHandler,
  deleteFooterImage,
} from "../controllers/footer.controller";
import { uploadFooterImage } from "../middleware/footerupload.middleware";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// ─── Public: frontend reads footer data ───────────────────────────────────────
router.get("/", getFooterSettings);

// ─── Protected: save text + image list ───────────────────────────────────────
router.put("/", protect, updateFooterSettings);

// ─── Protected: upload a single image to Supabase, returns { url } ───────────
// Frontend sends: multipart/form-data with field "image"
router.post("/upload-image", protect, uploadFooterImage, uploadFooterImageHandler);

// ─── Protected: delete a single image from Supabase + DB ────────────────────
// Frontend sends: { imageUrl: "https://..." }
router.delete("/delete-image", protect, deleteFooterImage);

export default router;