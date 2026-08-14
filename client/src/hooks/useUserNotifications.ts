// client/src/hooks/useUserNotifications.ts
// Only makes sense for a logged-in site user (the API requires auth).
// Pass `enabled: false` (e.g. when there's no user) to skip polling.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type UserNotificationItem,
} from "../api/user/notifications";

const POLL_INTERVAL_MS = 30_000;

export function useUserNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await getMyNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refresh();
    pollRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [enabled, refresh]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  }, []);

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead };
}