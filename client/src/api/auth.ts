// client/src/api/auth.ts (admin-side auth API)

import { apiClient } from "./client";

// ─── REGISTER ────────────────────────────────────────────────────────────────

export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
}) =>
  apiClient("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export const loginUser = (data: {
  emailOrUserId: string;
  password: string;
}) =>
  apiClient("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ─── GET CURRENT USER ────────────────────────────────────────────────────────

export const getMe = () => apiClient("/api/auth/me");

// ─── LOGOUT ──────────────────────────────────────────────────────────────────

export const logoutUser = () =>
  apiClient("/api/auth/logout", { method: "POST" });

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────

export const updateProfile = (data: {
  name?: string;
  email?: string;
  phone?: string;
}) =>
  apiClient("/api/auth/update-profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────

export const changePassword = (data: {
  currentPassword: string;
  newPassword: string;
}) =>
  apiClient("/api/auth/change-password", {
    method: "PUT",
    body: JSON.stringify(data),
  });

// ─── FORGOT PASSWORD (step 1 — sends OTP) ────────────────────────────────────
// method: "email" | "phone"
// contact: the email address or phone number

export const forgotPassword = (data: {
  method: "email" | "phone";
  contact: string;
}) =>
  apiClient("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ─── VERIFY OTP (step 2 — returns resetToken) ────────────────────────────────

export const verifyOtp = (data: {
  method: "email" | "phone";
  contact: string;
  otp: string;
}) =>
  apiClient("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ─── RESET PASSWORD (step 3) ─────────────────────────────────────────────────

export const resetPassword = (data: {
  resetToken: string;
  newPassword: string;
}) =>
  apiClient("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });