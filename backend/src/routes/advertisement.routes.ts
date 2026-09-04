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

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

const router = Router();

// ── Advertisement Inquiries ──────────────────────────────────────────────────
// Admin-panel: view all advertisement inquiries

router.get(
  "/inquiries",
  protect,
  hasPermission("advertisement-manager"),
  getInquiries
);

router.get(
  "/inquiries/:id",
  protect,
  hasPermission("advertisement-manager"),
  getInquiry
);

// ── Site User: own advertisement inquiries ───────────────────────────────────

router.get(
  "/my-inquiries",
  protectSiteUser,
  getMyInquiries
);

router.post(
  "/inquiries",
  protectSiteUser,
  uploadAdvertisement,
  createInquiry
);

// ── Admin-panel: Advertisement Management ────────────────────────────────────

router.patch(
  "/inquiries/:id/status",
  protect,
  hasPermission("advertisement-manager"),
  updateInquiryStatus
);

router.delete(
  "/inquiries/:id",
  protect,
  hasPermission("advertisement-manager"),
  deleteInquiry
);

// ── Published Advertisements ─────────────────────────────────────────────────
// Public read — the website needs this to render live ads.

router.get(
  "/published-ads",
  getPublishedAds
);

// Admin-panel: publish advertisement

router.post(
  "/published-ads",
  protect,
  hasPermission("advertisement-manager"),
  publishAd
);

// Admin-panel: end advertisement

router.patch(
  "/published-ads/:id/end",
  protect,
  hasPermission("advertisement-manager"),
  endAdvertisement
);

// Admin-panel: renew advertisement

router.patch(
  "/published-ads/:id/renew",
  protect,
  hasPermission("advertisement-manager"),
  renewAdvertisement
);

export default router;