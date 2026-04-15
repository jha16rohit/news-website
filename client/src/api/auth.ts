import { apiClient } from "./client";

// ✅ REGISTER
export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
}) => {
  return apiClient("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// ✅ LOGIN
export const loginUser = (data: {
  email: string;
  password: string;
}) => {
  return apiClient("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// ✅ GET CURRENT USER
export const getMe = () => {
  return apiClient("/api/auth/me");
};

// ✅ LOGOUT
export const logoutUser = () => {
  return apiClient("/api/auth/logout", {
    method: "POST",
  });
};

// ✅ UPDATE PROFILE
export const updateProfile = (data: {
  name?: string;
  email?: string;
  phone?: string;
}) => {
  return apiClient("/api/auth/update-profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// ✅ CHANGE PASSWORD
export const changePassword = (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  return apiClient("/api/auth/change-password", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};