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
router.post("/register", register);
router.post("/login",    login);
router.post("/logout",   logout);

// ── Forgot password flow (no auth required) ───────────────────────────────────
router.post("/forgot-password", forgotPassword);  // Step 1: send OTP
router.post("/verify-otp",      verifyOtp);       // Step 2: verify OTP → get resetToken
router.post("/reset-password",  resetPassword);   // Step 3: set new password

// ── Protected ─────────────────────────────────────────────────────────────────
router.get("/me",              protect, getMe);
router.put("/update-profile",  protect, updateProfile);
router.put("/change-password", protect, changePassword);

export default router;