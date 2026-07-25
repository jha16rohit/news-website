// ─── routes/advertisement.routes.ts ──────────────────────────────────────────
import { Router } from "express";
import {
  getInquiries,
  getInquiry,
  createInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getPublishedAds,
  publishAd,
  endAdvertisement,
  renewAdvertisement,
} from "../controllers/advertisement.controller";

import { uploadAdvertisement } from "../middleware/uploadAdvertisement.middleware";

const router = Router();

// ── Advertisement Inquiries ──────────────────────────────────────────────────
router.get("/inquiries", getInquiries);
router.get("/inquiries/:id", getInquiry);

router.post(
  "/inquiries",
  uploadAdvertisement,
  createInquiry
);

router.patch(
  "/inquiries/:id/status",
  updateInquiryStatus
);

router.delete(
  "/inquiries/:id",
  deleteInquiry
);

// ── Published Advertisements ─────────────────────────────────────────────────
router.get(
  "/published-ads",
  getPublishedAds
);

router.post(
  "/published-ads",
  publishAd
);

router.patch(
  "/published-ads/:id/end",
  endAdvertisement
);

router.patch(
  "/published-ads/:id/renew",
  renewAdvertisement
);

export default router;