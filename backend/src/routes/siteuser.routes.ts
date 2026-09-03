import { Router } from "express";

import {
  registerUser,
  loginUser,
  googleAuthUser,
  logoutUser,
  getMe,
  updateMe,
  changePassword,
  trackRead,
  trackShare,
  getReadingHistory,
  getAnalytics,
} from "../controllers/siteusercontroller";

import { protectSiteUser } from "../middleware/Siteuserauth.middleware";

const router = Router();

// ─── Public ──────────────────────────────────────────────────────────────────

router.post(
  "/register",
  registerUser
);

router.post(
  "/login",
  loginUser
);

router.post(
  "/google",
  googleAuthUser
);

router.post(
  "/logout",
  logoutUser
);

// ─── Protected Site User Routes ──────────────────────────────────────────────

router.get(
  "/me",
  protectSiteUser,
  getMe
);

router.put(
  "/me",
  protectSiteUser,
  updateMe
);

router.put(
  "/change-password",
  protectSiteUser,
  changePassword
);

router.post(
  "/track-read",
  protectSiteUser,
  trackRead
);

router.post(
  "/track-share",
  protectSiteUser,
  trackShare
);

router.get(
  "/reading-history",
  protectSiteUser,
  getReadingHistory
);

router.get(
  "/analytics",
  protectSiteUser,
  getAnalytics
);

export default router;