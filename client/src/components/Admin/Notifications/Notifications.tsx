import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Notifications.css";
import {
  type ApiNotification,
  type FetchNotificationsParams,
} from "../../../api/notification";
import { useAdminNotifications } from "../../../hooks/useAdminNotifications";

type FilterTab = "All" | "Unread" | "Breaking" | "Comments" | "Scheduled" | "Trending";
type SortOrder = "latest" | "oldest";

type NotificationType =
  | "breaking"
  | "comment"
  | "scheduled"
  | "trending"
  | "flagged"
  | "published"
  | "reminder"
  | "traffic";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

const IconPublished = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);



const IconMore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const IconExternalLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconDelete = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
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
    default:
      return { icon: <IconPublished />, bgColor: "#f3f4f6", color: "#6b7280" };
  }
};

const TABS: FilterTab[] = ["All", "Unread", "Breaking", "Comments", "Scheduled", "Trending"];

const SORT_OPTIONS = [
  { value: "latest" as SortOrder, label: "Latest first" },
  { value: "oldest" as SortOrder, label: "Oldest first" },
];

// Custom Sort Dropdown Component
const SortDropdown: React.FC<{
  value: SortOrder;
  onChange: (value: SortOrder) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = SORT_OPTIONS.find((o) => o.value === value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  if (disabled) {
    return (
      <div className="notif-sort-dropdown notif-sort-dropdown--disabled" tabIndex={0} onKeyDown={handleKeyDown}>
        <span className="notif-sort-dropdown-label">{selectedOption?.label}</span>
        <span className="notif-sort-dropdown-chevron"><IconChevronDown /></span>
      </div>
    );
  }

  return (
    <div className="notif-sort-dropdown" ref={dropdownRef} tabIndex={0} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={`notif-sort-dropdown-trigger${isOpen ? " notif-sort-dropdown-trigger--open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Sort order"
      >
        <span className="notif-sort-dropdown-label">{selectedOption?.label}</span>
        <span className="notif-sort-dropdown-chevron"><IconChevronDown /></span>
      </button>
      {isOpen && (
        <ul className="notif-sort-dropdown-menu" role="listbox" aria-label="Sort options">
          {SORT_OPTIONS.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className={`notif-sort-dropdown-item${opt.value === value ? " notif-sort-dropdown-item--selected" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const {
    notifications: allNotifications,
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
  } = useAdminNotifications();

  // Compute statistics for summary cards
  const stats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    return {
      unread: unreadCount,
      total: allNotifications.length,
      thisWeek: allNotifications.filter((n) => new Date(n.createdAt).getTime() > weekAgo).length,
      today: allNotifications.filter((n) => new Date(n.createdAt).getTime() > dayAgo).length,
    };
  }, [allNotifications, unreadCount]);

  // Filter notifications based on active tab and search
  const filteredNotifications = useMemo(() => {
    let result = allNotifications;

    // Tab filter
    if (activeTab === "Unread") {
      result = result.filter((n) => n.unread);
    } else if (activeTab !== "All") {
      result = result.filter((n) => n.tab === activeTab);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [allNotifications, activeTab, searchQuery, sortOrder]);

  // Close menu on outside click
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotificationClick = (notification: ApiNotification) => {
    if (notification.link) {
      navigate(notification.link);
    }
    if (notification.unread) {
      markRead(notification._id);
    }
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markRead(id);
    setOpenMenuId(null);
  };

  const handleMarkUnread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markUnread(id);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this notification?")) {
      await removeNotification(id);
    }
    setOpenMenuId(null);
  };

  const handleView = (notification: ApiNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.link) {
      navigate(notification.link);
    }
    setOpenMenuId(null);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    loadNotifications({ tab: tab === "All" || tab === "Unread" ? undefined : tab, unreadOnly: tab === "Unread" });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadNotifications({ ...currentParams, page });
  };

  const currentParams: FetchNotificationsParams = useMemo(() => ({
    tab: activeTab === "All" || activeTab === "Unread" ? undefined : activeTab,
    unreadOnly: activeTab === "Unread",
    search: searchQuery || undefined,
    sort: sortOrder,
    page: pagination.page,
    limit: 20,
  }), [activeTab, searchQuery, sortOrder, pagination.page]);

  // Load notifications when params change
  useEffect(() => {
    loadNotifications(currentParams);
  }, [currentParams]);

  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      All: allNotifications.length,
      Unread: unreadCount,
      Breaking: allNotifications.filter((n) => n.tab === "Breaking").length,
      Comments: allNotifications.filter((n) => n.tab === "Comments").length,
      Scheduled: allNotifications.filter((n) => n.tab === "Scheduled").length,
      Trending: allNotifications.filter((n) => n.tab === "Trending").length,
    };
    return counts;
  }, [allNotifications, unreadCount]);

  return (
    <div className="notif-page">
      {/* Header */}
      <div className="notif-headerr">
        <div className="notif-header-left">
          <h1 className="notif-title">Notifications</h1>
          <p className="notif-subtitle">
            Stay updated with important activities across your news platform.
          </p>
        </div>
        <button
          className="notif-mark-all"
          onClick={handleMarkAllRead}
          disabled={loading || unreadCount === 0}
        >
          <IconCheck />
          Mark all as read
        </button>
      </div>

      {/* Summary Cards */}
      <div className="notif-summary">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon stat-icon--unread">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className="stat-value">{stats.unread}</div>
          </div>
          <div className="stat-label">Unread Notifications</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon stat-icon--total">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-label">Total Notifications</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon stat-icon--week">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="stat-value">{stats.thisWeek}</div>
          </div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon stat-icon--today">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-value">{stats.today}</div>
          </div>
          <div className="stat-label">Today</div>
        </div>
      </div>

      {/* Filter / Control Bar */}
      <div className="notif-controls">
        <div className="notif-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`notif-tab${activeTab === tab ? " notif-tab--active" : ""}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
              {tabCounts[tab] > 0 && (
                <span className="notif-tab-badge">{tabCounts[tab]}</span>
              )}
            </button>
          ))}
        </div>
        <div className="notif-search-sort">
          <div className="notif-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <SortDropdown value={sortOrder} onChange={setSortOrder} />
        </div>
      </div>

      {/* Notifications List */}
      <div className="notif-list-container">
        {error && (
          <div className="notif-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>Couldn't load notifications: {error}</p>
            <button onClick={refresh} className="notif-retry-btn">Retry</button>
          </div>
        )}

        {loading && filteredNotifications.length === 0 && (
          <div className="notif-loading">
            <div className="notif-spinner" />
            <p>Loading notifications…</p>
          </div>
        )}

        {!loading && !error && filteredNotifications.length === 0 && (
          <div className="notif-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>{activeTab === "All" ? "No notifications" : `No notifications in this category.`}</p>
            {activeTab !== "All" && <p className="notif-empty-hint">Try selecting "All" or adjusting your filters.</p>}
          </div>
        )}

        {!loading && !error && filteredNotifications.length > 0 && (
          <>
            <div className="notif-list">
              {filteredNotifications.map((n) => {
                const { icon, bgColor, color } = getIconConfig(n.type as NotificationType);
                return (
                  <div
                    key={n._id}
                    className={`notif-item${n.unread ? " notif-item--unread" : ""}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    {n.unread && <div className="notif-unread-indicator" />}
                    <div className="notif-icon" style={{ background: bgColor, color }}>
                      {icon}
                    </div>
                    <div className="notif-content">
                      <div className="notif-item-header">
                        <div className="notif-item-title-row">
                          <span className="notif-item-title">{n.title}</span>
                          <span className={`notif-type-badge notif-type-badge--${n.tab.toLowerCase()}`}>{n.tab}</span>
                        </div>
                        <div className="notif-item-actions">
                          <button
                            className="notif-menu-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === n._id ? null : n._id);
                            }}
                            aria-label="More options"
                          >
                            <IconMore />
                          </button>
                          {openMenuId === n._id && (
                            <div className="notif-dropdown">
                              {n.unread ? (
                                <button className="notif-dropdown-item" onClick={(e) => handleMarkRead(n._id, e)}>
                                  <IconCheck /> Mark as read
                                </button>
                              ) : (
                                <button className="notif-dropdown-item" onClick={(e) => handleMarkUnread(n._id, e)}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                  </svg>
                                  Mark as unread
                                </button>
                              )}
                              {n.link && (
                                <button className="notif-dropdown-item" onClick={(e) => handleView(n, e)}>
                                  <IconExternalLink /> Open
                                </button>
                              )}
                              <div className="notif-dropdown-divider" />
                              <button className="notif-dropdown-item notif-dropdown-item--danger" onClick={(e) => handleDelete(n._id, e)}>
                                <IconDelete /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="notif-desc">{n.description}</div>
                      <div className="notif-meta">
                        <span className="notif-time">{timeAgo(n.createdAt)}</span>
                        <span className="notif-date">{formatDate(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="notif-pagination">
                <button
                  className="notif-page-btn"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </button>
                <span className="notif-page-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="notif-page-btn"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;