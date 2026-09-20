// src/api/admin/notifications.ts

import { API_BASE_URL } from "../utils/apiBase";

const BASE = `${API_BASE_URL}/notifications`;

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
  link?: string;
}

export interface FetchNotificationsParams {
  tab?: string;
  unreadOnly?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FetchNotificationsResponse {
  notifications: ApiNotification[];
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchNotifications(params?: FetchNotificationsParams): Promise<FetchNotificationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.tab) searchParams.set("tab", params.tab);
  if (params?.unreadOnly) searchParams.set("unreadOnly", "true");
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const url = `${BASE}?${searchParams.toString()}`;
  const res = await authFetch(url);
  if (!res.ok) throw new Error(`Notifications API error: fetch (${res.status})`);
  return res.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await authFetch(`${BASE}/mark-all-read`, { method: "POST" });
  if (!res.ok) throw new Error(`Notifications API error: mark-all-read (${res.status})`);
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await authFetch(`${BASE}/${id}/read`, { method: "PATCH" });
  if (!res.ok) throw new Error(`Notifications API error: mark-read (${res.status})`);
}

export async function markNotificationUnread(id: string): Promise<void> {
  const res = await authFetch(`${BASE}/${id}/unread`, { method: "PATCH" });
  if (!res.ok) throw new Error(`Notifications API error: mark-unread (${res.status})`);
}

export async function deleteNotification(id: string): Promise<void> {
  const res = await authFetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Notifications API error: delete (${res.status})`);
}
