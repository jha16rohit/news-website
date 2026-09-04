// client/src/api/client.ts
export const BASE_URL = "http://localhost:5001";

export const getAuthToken = (): string | null => {
  try {
    return sessionStorage.getItem("auth-token");
  } catch {
    return null;
  }
};

// FIX: `RequestInit["body"]` is DOM's strict `BodyInit` type (string |
// Blob | FormData | ...), which doesn't allow a plain object. The runtime
// code below already JSON.stringifies anything that isn't FormData or a
// string, so callers passing `body: { foo: "bar" }` have always worked —
// TypeScript just didn't know that. This widened type lets callers pass a
// plain object/array directly (as comment.ts, advertise.ts etc. do)
// without the compiler flagging it as an error.
export interface ApiClientOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
}

export const apiClient = async (
  endpoint: string,
  options: ApiClientOptions = {}
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
      ...(options as RequestInit),
      // IMPORTANT: no shared cookie session. Authentication is per-tab.
      credentials: "omit",
      headers,
      body: isFormData
        ? (options.body as FormData)
        : isStringBody
        ? (options.body as string)
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