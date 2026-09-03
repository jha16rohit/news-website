// client/src/api/client.ts

import { getMemoryToken } from "../api/user/userauth";

const BASE_URL = "http://localhost:5001";

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    // Bearer token (user routes)
    const memToken = getMemoryToken();

    const authHeader: Record<string, string> = memToken
      ? { Authorization: `Bearer ${memToken}` }
      : {};

    const isFormData = options.body instanceof FormData;
    const isStringBody = typeof options.body === "string";

    const headers: Record<string, string> = {
  ...authHeader,
  ...(options.headers as Record<string, string> || {}),
};

    // Only add JSON content-type when NOT uploading files
    if (!isFormData && !("Content-Type" in headers)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers,
      body: isFormData
        ? options.body
        : isStringBody
        ? options.body
        : options.body != null
        ? JSON.stringify(options.body)
        : undefined,
    });

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
    console.error("API Error:", error);
    throw error;
  }
};