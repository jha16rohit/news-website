// client/src/api/user/newsletter.ts
import { apiClient } from "../client";

export interface SubscribeResponse {
  message: string;
  alreadySubscribed?: boolean;
}

export interface UnsubscribeResponse {
  success: boolean;
  message: string;
  alreadyUnsubscribed?: boolean;
}

export const subscribeToNewsletter = (email: string): Promise<SubscribeResponse> =>
  apiClient("/api/newsletter/subscribe", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const unsubscribeFromNewsletter = (token: string): Promise<UnsubscribeResponse> =>
  apiClient("/api/newsletter/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ token }),
  });