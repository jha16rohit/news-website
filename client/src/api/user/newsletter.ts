// client/src/api/user/newsletter.ts
import { apiClient } from "../client";

export interface SubscribeResponse {
  message: string;
  alreadySubscribed?: boolean;
}

export const subscribeToNewsletter = (email: string): Promise<SubscribeResponse> =>
  apiClient("/api/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify({ email }),
  });