// client/src/api/client.ts
import { getMemoryToken } from "../api/user/userauth"; // user-facing token helper

const BASE_URL = "http://localhost:5001";

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    // Attach in-memory bearer token when available (for /api/users/* routes).
    // Admin routes rely on the httpOnly cookie so no token is needed there.
    const memToken = getMemoryToken();
    const authHeader: Record<string, string> = memToken
      ? { Authorization: `Bearer ${memToken}` }
      : {};

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include", // still send cookies (admin auth)
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...(options.headers || {}),
      },
    });

    // Handle empty response (important for DELETE and 204s)
    let data: any = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => null);
    }

    if (!res.ok) {
      throw new Error(data?.message || `HTTP ${res.status}`);
    }

    return data;
  } catch (error: any) {
    console.error("API Error:", error.message);
    throw error;
  }
};