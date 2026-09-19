export function getApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_URL?.trim();

  if (value) {
    return value.replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    return "/api"; // Uses Vite proxy
  }

  throw new Error("VITE_API_URL is not configured");
}

export function getBaseUrl(): string {
  const value = import.meta.env.VITE_API_URL?.trim();
  if (value) {
    return value.replace(/\/api\/?$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:5001";
}

export const API_BASE_URL = getApiBaseUrl();
export const BASE_URL = getBaseUrl();