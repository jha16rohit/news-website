// client/src/api/user/notifications.ts
import { apiClient } from "../client";

export interface UserNotificationItem {
  id: string;
  type: "new_article" | "comment_reply" | "comment_like" | "ad_response";
  title: string;
  message: string;
  link: string;
  createdAt: string;
  read: boolean;
}

export interface MyNotificationsResponse {
  notifications: UserNotificationItem[];
  unreadCount: number;
}

// `_=${Date.now()}` cache-busts the URL itself, and `cache: "no-store"` tells
// fetch not to consult the HTTP cache at all. Belt-and-suspenders alongside
// the server's no-cache headers -- this endpoint is polled every 60s and must
// never be allowed to serve a stale (possibly empty) cached body.
export const getMyNotifications = (): Promise<MyNotificationsResponse> =>
  apiClient(`/api/user-notifications?_=${Date.now()}`, { cache: "no-store" });

export const markNotificationRead = (id: string): Promise<{ ok: boolean }> =>
  apiClient(`/api/user-notifications/${id}/read`, { method: "POST" });

export const markAllNotificationsRead = (): Promise<{ ok: boolean }> =>
  apiClient("/api/user-notifications/mark-all-read", { method: "POST" });