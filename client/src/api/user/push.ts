// client/src/api/user/push.ts
import { apiClient } from "../client";

export interface VapidKeyResponse {
  publicKey: string;
}

export const getVapidPublicKey = (): Promise<VapidKeyResponse> =>
  apiClient("/api/push/vapid-public-key", { method: "GET" });

export const subscribeToPush = (
  subscription: PushSubscriptionJSON,
  email?: string
): Promise<{ message: string }> =>
  apiClient("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ subscription, email }),
  });

export const unsubscribeFromPush = (endpoint: string): Promise<{ message: string }> =>
  apiClient("/api/push/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint }),
  });