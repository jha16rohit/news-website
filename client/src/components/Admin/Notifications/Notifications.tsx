import React, { useState } from "react";
import "./Notifications.css";

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

interface Notification {
  id: number;
  type: NotificationType;
  tab: FilterTab;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
}

const notifications: Notification[] = [
  {
    id: 1,
    type: "breaking",
    tab: "Breaking",
    title: "Breaking News Pending",
    description: "A breaking news article is waiting for your approval before going live.",
    time: "2 minutes ago",
    unread: true,
  },
  {
    id: 2,
    type: "comment",
    tab: "Comments",
    title: "New Comments",
    description: "15 new comments on 'Election Results 2025' need moderation.",
    time: "5 minutes ago",
    unread: true,
  },
  {
    id: 3,
    type: "scheduled",
    tab: "Scheduled",
    title: "Article Scheduled",
    description: "'Tech Industry Layoffs Continue' is scheduled to publish at 3:00 PM today.",
    time: "10 minutes ago",
    unread: true,
  },
  {
    id: 4,
    type: "trending",
    tab: "Trending",
    title: "Article Trending",
    description: "'AI Revolution in Healthcare' is trending with 12K views in the last hour.",
    time: "25 minutes ago",
    unread: true,
  },
  {
    id: 5,
    type: "flagged",
    tab: "Comments",
    title: "Comment Flagged",
    description: "A comment on 'Budget Analysis' has been flagged for review.",
    time: "2 hours ago",
  },
  {
    id: 6,
    type: "published",
    tab: "Breaking",
    title: "Breaking Published",
    description: "'Major Policy Announcement' has been published as breaking news.",
    time: "3 hours ago",
  },
  {
    id: 7,
    type: "reminder",
    tab: "Scheduled",
    title: "Publish Reminder",
    description: "'Weekend Sports Roundup' will auto-publish tomorrow at 8:00 AM.",
    time: "5 hours ago",
  },
  {
    id: 8,
    type: "traffic",
    tab: "Trending",
    title: "Traffic Spike",
    description: "Your site is experiencing a 340% traffic spike from social media referrals.",
    time: "6 hours ago",
  },
];

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

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => n.tab === activeTab);

  return (
    <div className="notif-page">
      {/* Header */}
      <div className="notif-header">
        <div>
          <h1 className="notif-title">Notifications</h1>
          <p className="notif-subtitle">You have {unreadCount} unread notifications</p>
        </div>
        <button className="notif-mark-all">
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
        {filtered.length === 0 ? (
          <div className="notif-empty">No notifications in this category.</div>
        ) : (
          filtered.map((n) => {
            const { icon, bgColor, color } = getIconConfig(n.type);
            return (
              <div
                className={`notif-item${n.unread ? " notif-item--unread" : ""}`}
                key={n.id}
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
                  <div className="notif-time">{n.time}</div>
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