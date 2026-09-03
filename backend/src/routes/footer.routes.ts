import { Router } from "express";

import {
  getFooterSettings,
  updateFooterSettings,
  uploadFooterImageHandler,
  deleteFooterImage,
} from "../controllers/footer.controller";

import { uploadFooterImage } from "../middleware/Footerupload.middleware";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

const router = Router();

// ─── Public: frontend reads footer data ───────────────────────────────────────

router.get(
  "/",
  getFooterSettings
);

// ─── Protected: save text + image list ───────────────────────────────────────

router.put(
  "/",
  protect,
  hasPermission("footer-management"),
  updateFooterSettings
);

// ─── Protected: upload a single image to Supabase ────────────────────────────

router.post(
  "/upload-image",
  protect,
  hasPermission("footer-management"),
  uploadFooterImage,
  uploadFooterImageHandler
);

// ─── Protected: delete a single image from Supabase + DB ─────────────────────

router.delete(
  "/delete-image",
  protect,
  hasPermission("footer-management"),
  deleteFooterImage
);

export default router;