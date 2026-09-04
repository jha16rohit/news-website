// client/src/client.ts
// Central API Client that handles all requests and automatically injects
// the Authorization token into the headers.

import { getMemoryToken } from "./user/userauth";

// 👇 EXPERT FIX: Added 'export' here so news.ts can use it!
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// 👇 EXPERT FIX: Export getAuthToken so news.ts can access tokens
export const getAuthToken = getMemoryToken;

interface ClientOptions extends RequestInit {
  data?: object;
}

export async function apiClient(endpoint: string, options: ClientOptions = {}) {
  const { data, headers: customHeaders, ...customConfig } = options;

  // Grab the token from localStorage via getMemoryToken
  const token = getMemoryToken();

  // 👇 THE MAGIC FIX: Check if a body payload exists in EITHER format
  const hasBody = Boolean(data || customConfig.body);

  const config: RequestInit = {
    method: "GET",
    headers: {
      // 👇 Forces the JSON header if ANY body is detected so the backend parses it!
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      
      // Attach the Authorization header if a token exists
      ...(token ? { Authorization: `Bearer ${token}` } : {}),

      // Allow overrides
      ...customHeaders,
    },
    ...customConfig,
  };

  // If there's a JSON body, stringify it
  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // If the response is not OK, throw an error with the backend message
    if (!response.ok) {
      let errorMessage = "An error occurred.";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Fallback to status text if JSON parsing fails
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    // Attempt to return JSON data
    return await response.json();
  } catch (error) {
    console.error("API Client Error:", error);
    throw error;
  }
}