// ─── routes/advertisement.routes.ts ──────────────────────────────────────────
import { Router } from "express";
import {
  getInquiries,
  getInquiry,
  createInquiry,
  getMyInquiries,
  updateInquiryStatus,
  deleteInquiry,
  getPublishedAds,
  publishAd,
  endAdvertisement,
  renewAdvertisement,
} from "../controllers/advertisement.controller";

import { uploadAdvertisement } from "../middleware/uploadAdvertisement.middleware";
import { protectSiteUser } from "../middleware/Siteuserauth.middleware";
import { protect, isAdmin } from "../middleware/auth.middleware";

const router = Router();

// ── Advertisement Inquiries ──────────────────────────────────────────────────
// NOTE: this "/inquiries" list is unfiltered (all users) — it's for the admin
// panel only, hence protect+isAdmin. Logged-in site users hit "/my-inquiries"
// below to see only their own requests.
router.get("/inquiries", protect, isAdmin, getInquiries);
router.get("/inquiries/:id", protect, isAdmin, getInquiry);

/** GET /api/advertisement/my-inquiries — the logged-in user's own ad requests only */
router.get("/my-inquiries", protectSiteUser, getMyInquiries);

router.post(
  "/inquiries",
  protectSiteUser,
  uploadAdvertisement,
  createInquiry
);

router.patch(
  "/inquiries/:id/status",
  protect,
  isAdmin,
  updateInquiryStatus
);

router.delete(
  "/inquiries/:id",
  protect,
  isAdmin,
  deleteInquiry
);

// ── Published Advertisements ─────────────────────────────────────────────────
// Public read (the site needs this to render live ads) — writes are admin-only.
router.get(
  "/published-ads",
  getPublishedAds
);

router.post(
  "/published-ads",
  protect,
  isAdmin,
  publishAd
);

router.patch(
  "/published-ads/:id/end",
  protect,
  isAdmin,
  endAdvertisement
);

router.patch(
  "/published-ads/:id/renew",
  protect,
  isAdmin,
  renewAdvertisement
);

export default router;