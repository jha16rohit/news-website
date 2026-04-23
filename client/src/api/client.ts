const BASE_URL = "http://localhost:5001"; // 🔥 IMPORTANT: add /api if your backend uses it

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include", // cookies auth
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    // 🔥 Handle empty response (important for DELETE)
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(data?.message || "Something went wrong");
    }

    return data;
  } catch (error: any) {
    console.error("API Error:", error.message);
    throw error;
  }
};