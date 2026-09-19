// client/src/hooks/useAdminNotifications.ts
// Shared notification state + Socket.IO for Admin TopBar and Notifications page

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  deleteNotification,
  type ApiNotification,
  type FetchNotificationsParams,
  type FetchNotificationsResponse,
} from "../api/notification";

interface UseAdminNotificationsReturn {
  notifications: ApiNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  fetchNotifications: (params?: FetchNotificationsParams) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<ApiNotification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export function useAdminNotifications(): UseAdminNotificationsReturn {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const socketRef = useRef<Socket | null>(null);
  const currentParamsRef = useRef<FetchNotificationsParams>({});
  const isMountedRef = useRef(true);

  // Fetch notifications from API
  const loadNotifications = useCallback(async (params?: FetchNotificationsParams) => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);
    currentParamsRef.current = params || {};
    try {
      const data: FetchNotificationsResponse = await fetchNotifications(params);
      if (isMountedRef.current) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setPagination({
          page: data.page,
          totalPages: data.totalPages,
          total: data.total,
        });
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.message || "Failed to load notifications");
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  // Initial load + Socket.IO setup
  useEffect(() => {
    isMountedRef.current = true;
    loadNotifications();

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
    const sock = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = sock;

    sock.on("connect", () => {
      sock.emit("admin:subscribe-notifications");
      // Refresh on reconnect to ensure sync
      loadNotifications(currentParamsRef.current);
    });

    sock.on("notifications:new", (n: ApiNotification) => {
      if (!isMountedRef.current) return;
      // Deduplicate by _id
      setNotifications((prev) => (prev.some((p) => p._id === n._id) ? prev : [n, ...prev]));
      // Increment unread count for current user
      setUnreadCount((prev) => prev + 1);
    });

    // Listen for mark-all-read from other components
    const handleMarkAllRead = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(0);
    };
    window.addEventListener("admin-notifications-mark-all-read", handleMarkAllRead);

    return () => {
      isMountedRef.current = false;
      sock.disconnect();
      window.removeEventListener("admin-notifications-mark-all-read", handleMarkAllRead);
    };
  }, [loadNotifications]);

  // Mark single notification as read
  const markRead = useCallback(async (id: string) => {
    const notification = notifications.find((n) => n._id === id);
    if (notification?.unread) {
      try {
        await markNotificationRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, unread: false } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }
  }, [notifications]);

  // Mark single notification as unread
  const markUnread = useCallback(async (id: string) => {
    const notification = notifications.find((n) => n._id === id);
    if (notification && !notification.unread) {
      try {
        await markNotificationUnread(id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, unread: true } : n))
        );
        setUnreadCount((prev) => prev + 1);
      } catch (err) {
        console.error("Failed to mark notification unread:", err);
      }
    }
  }, [notifications]);

  // Delete (soft delete) notification
  const removeNotification = useCallback(async (id: string) => {
    try {
      await deleteNotification(id);
      const notification = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (notification?.unread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }, [notifications]);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(0);
      // Notify other components
      window.dispatchEvent(new CustomEvent("admin-notifications-mark-all-read"));
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  }, []);

  // Refresh with current params
  const refresh = useCallback(async () => {
    await loadNotifications(currentParamsRef.current);
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications: loadNotifications,
    markRead,
    markUnread,
    deleteNotification: removeNotification,
    markAllRead,
    refresh,
    setNotifications,
    setUnreadCount,
  };
}