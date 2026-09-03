// client/src/api/client.ts
const BASE_URL = "http://localhost:5001";

export const getAuthToken = (): string | null => {
  try {
    return sessionStorage.getItem("auth-token");
  } catch {
    return null;
  }
};

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    const token = getAuthToken();
    const isFormData = options.body instanceof FormData;
    const isStringBody = typeof options.body === "string";

    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!isFormData && !("Content-Type" in headers)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      // IMPORTANT: no shared cookie session. Authentication is per-tab.
      credentials: "omit",
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
