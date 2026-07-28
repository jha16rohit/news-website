import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import "./Notifications.css";
import {
  fetchNotifications,
  markAllNotificationsRead,
} from "../../../api/notification";
import type { ApiNotification } from "../../../api/notification";
type FilterTab = "All" | "Breaking" | "Comments" | "Scheduled" | "Trending";

type NotificationType =
  | "breaking"
  | "comment"
  | "scheduled"
  | "trending"
  | "flagged"
  | "published"
  | "reminder"
  | "traffic";

const SOCKET_URL = "http://localhost:5001";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

const tabs: FilterTab[] = ["All", "Breaking", "Comments", "Scheduled", "Trending"];

// ---- Icons ----
const IconBreaking = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconComment = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconScheduled = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconTrending = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

type IconConfig = { icon: React.ReactNode; bgColor: string; color: string };

const getIconConfig = (type: NotificationType): IconConfig => {
  switch (type) {
    case "breaking":
    case "published":
      return { icon: <IconBreaking />, bgColor: "#fdecea", color: "#d32f2f" };
    case "comment":
    case "flagged":
      return { icon: <IconComment />, bgColor: "#e8f0fe", color: "#3b5bdb" };
    case "scheduled":
    case "reminder":
      return { icon: <IconScheduled />, bgColor: "#fff8e1", color: "#e65100" };
    case "trending":
    case "traffic":
      return { icon: <IconTrending />, bgColor: "#e8f5e9", color: "#2e7d32" };
  }
};

const Notifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchNotifications()
      .then(({ notifications: list }) => {
        if (!cancelled) setNotifications(list);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "Failed to load notifications.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const sock = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = sock;

    sock.on("connect", () => sock.emit("admin:subscribe-notifications"));
    sock.on("notifications:new", (n: ApiNotification) => {
      // Prepend the freshly generated notification, guarding against a rare
      // double-delivery (e.g. reconnect) by de-duping on _id.
      setNotifications((prev) => (prev.some((p) => p._id === n._id) ? prev : [n, ...prev]));
    });

    return () => { sock.disconnect(); };
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => n.tab === activeTab);

  const handleMarkAllRead = async () => {
    // Optimistic update — revert isn't strictly necessary since this is a
    // low-stakes UI action, but we log failures so silent drops are visible.
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  return (
    <div className="notif-page">
      {/* Header */}
      <div className="notif-header">
        <div>
          <h1 className="notif-title">Notifications</h1>
          <p className="notif-subtitle">
            {loading ? "Loading…" : `You have ${unreadCount} unread notifications`}
          </p>
        </div>
        <button className="notif-mark-all" onClick={handleMarkAllRead} disabled={loading || unreadCount === 0}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="notif-tabs">
        <span className="notif-filter-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </span>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`notif-tab${activeTab === tab ? " notif-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "All" && (
              <span className="notif-tab-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="notif-list">
        {error ? (
          <div className="notif-empty">Couldn't load notifications: {error}</div>
        ) : loading ? (
          <div className="notif-empty">Loading notifications…</div>
        ) : filtered.length === 0 ? (
          <div className="notif-empty">No notifications in this category.</div>
        ) : (
          filtered.map((n) => {
            const { icon, bgColor, color } = getIconConfig(n.type as NotificationType);
            return (
              <div
                className={`notif-item${n.unread ? " notif-item--unread" : ""}`}
                key={n._id}
              >
                <div className="notif-icon" style={{ background: bgColor, color }}>
                  {icon}
                </div>
                <div className="notif-content">
                  <div className="notif-item-title">
                    {n.title}
                    {n.unread && <span className="notif-unread-dot" />}
                  </div>
                  <div className="notif-desc">{n.description}</div>
                  <div className="notif-time">{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;