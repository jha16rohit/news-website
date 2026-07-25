// src/api/admin/notifications.ts

const BASE = "/api/notifications";

export interface ApiNotification {
  _id: string;
  type: string;
  tab: "Breaking" | "Comments" | "Scheduled" | "Trending";
  title: string;
  description: string;
  unread: boolean;
  createdAt: string;
}

export async function fetchNotifications(): Promise<{
  notifications: ApiNotification[];
  unreadCount: number;
}> {
  const res = await fetch(BASE, { credentials: "include" });
  if (!res.ok) throw new Error("Notifications API error: fetch");
  return res.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${BASE}/mark-all-read`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Notifications API error: mark-all-read");
}