import { Router } from "express";

import {
  register,
  login,
  logout,
  getMe,
  changePassword,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../controllers/auth.controller";

import { protect } from "../middleware/auth.middleware";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

router.post(
  "/logout",
  logout
);

// ── Forgot password flow ──────────────────────────────────────────────────────

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/verify-otp",
  verifyOtp
);

router.post(
  "/reset-password",
  resetPassword
);

// ── Protected ─────────────────────────────────────────────────────────────────

// Used by Admin/Editor frontend to retrieve:
// userId, name, email, role, permissions

router.get(
  "/me",
  protect,
  getMe
);

router.put(
  "/update-profile",
  protect,
  updateProfile
);

router.put(
  "/change-password",
  protect,
  changePassword
);

export default router;