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
  toggleAdActive,
  deleteAd,
  getAdPageSettings,
  updateAdPageSettings,
} from "../controllers/advertisement.controller";

const router = Router();

// Inquiries
router.get("/inquiries", getInquiries);
router.get("/inquiries/:id", getInquiry);
router.post("/inquiries", createInquiry);
router.patch("/inquiries/:id/status", updateInquiryStatus);
router.delete("/inquiries/:id", deleteInquiry);

// Published Ads
router.get("/published-ads", getPublishedAds);
router.post("/published-ads", publishAd);
router.patch("/published-ads/:id/toggle", toggleAdActive);
router.delete("/published-ads/:id", deleteAd);

// Page Settings
router.get("/page-settings", getAdPageSettings);
router.put("/page-settings", updateAdPageSettings);

export default router;