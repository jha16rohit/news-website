// client/src/api/auth.ts
import { apiClient, getAuthToken } from "./client";

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

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// The JWT is stored in sessionStorage by this tab only.
export const loginUser = async (data: {
  emailOrUserId: string;
  password: string;
}) => {
  const response = await apiClient("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (response?.token) {
    sessionStorage.setItem("auth-token", response.token);
  }

  if (response?.user) {
    sessionStorage.setItem("auth-user", JSON.stringify(response.user));
  }

  return response;
};

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
// Short-circuits when there's no token yet (e.g. the login page checking for
// an existing session on mount) instead of firing a network request that's
// guaranteed to 401 and console.error from apiClient.
export const getMe = () => {
  if (!getAuthToken()) {
    return Promise.reject(new Error("Not authorized, no token"));
  }
  return apiClient("/api/auth/me");
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
export const logoutUser = async () => {
  try {
    await apiClient("/api/auth/logout", { method: "POST" });
  } finally {
    sessionStorage.removeItem("auth-token");
    sessionStorage.removeItem("auth-user");
  }
};

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

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
export const forgotPassword = (data: {
  method: "email" | "phone";
  contact: string;
}) =>
  apiClient("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ─── VERIFY OTP ──────────────────────────────────────────────────────────────
export const verifyOtp = (data: {
  method: "email" | "phone";
  contact: string;
  otp: string;
}) =>
  apiClient("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────
export const resetPassword = (data: {
  resetToken: string;
  newPassword: string;
}) =>
  apiClient("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });