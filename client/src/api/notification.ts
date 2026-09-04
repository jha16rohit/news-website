// src/api/admin/notifications.ts

const BASE = "/api/notifications";

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("auth-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    headers: { ...(init.headers || {}), ...getAuthHeaders() },
    credentials: "include",
  });
}

export interface ApiNotification {
  _id: string;
  type: string;
  tab: "Breaking" | "Comments" | "Scheduled" | "Trending";
  title: string;
  description: string;
  unread: boolean;
  createdAt: string;
}

export async function fetchNotifications(): Promise<{ notifications: ApiNotification[]; unreadCount: number }> {
  const res = await authFetch(BASE);
  if (!res.ok) throw new Error(`Notifications API error: fetch (${res.status})`);
  return res.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await authFetch(`${BASE}/mark-all-read`, { method: "POST" });
  if (!res.ok) throw new Error(`Notifications API error: mark-all-read (${res.status})`);
}
