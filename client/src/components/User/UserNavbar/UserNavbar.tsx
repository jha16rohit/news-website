// client/src/components/User/UserNavbar/UserNavbar.tsx
// ──────────────────────────────────────────────────────────────
// Merged version: keeps the real, API-backed live search (debounced,
// request-race-safe, trending tags from /api/tags/trending) from the
// second draft, AND restores the full working Notification Center
// (tabs, unread dot, mark-as-read, "See All") from the first draft.
// User state is kept in React state only (no localStorage).

import React, { useState, useEffect, useRef, useMemo } from "react";
import "./UserNavbar.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, User, Menu, X, Search, ChevronDown, LogOut,
  Newspaper, MessageCircle, Heart, Megaphone
} from "lucide-react";
import logo from "../../../assets/Logo.png";
import { useCategories } from "../../../hooks/useCategories";
import { useAuth } from "../../../context/AuthContext";

import type { Category } from "../../../types/category";
import { getBreakingTickerNews, searchNews, type NewsArticle } from "../../../api/user/news";
import { getTrendingTags } from "../../../api/user/tag";
import {
  getMyNotifications,
  markNotificationRead,
  type UserNotificationItem,
} from "../../../api/user/notifications";

// Shape returned by GET /api/tags/trending (see tags.controller.ts's getTrendingTags)
interface TrendingTag {
  id: string;
  name: string;
  slug: string;
  isTrending?: boolean;
  _count?: { articles: number };
}

// ── Notification presentation helpers ─────────────────────────
// The backend only stores `type` + `createdAt`; the icon, the
// Today/This Week/Earlier bucket, and the "3h ago" label are all
// derived on the client so the panel stays live without needing
// the server to recompute buckets on every request.
const NOTIF_ICONS: Record<UserNotificationItem["type"], React.ElementType> = {
  new_article: Newspaper,
  comment_reply: MessageCircle,
  comment_like: Heart,
  ad_response: Megaphone,
};

type NotifBucket = "Today" | "This Week" | "Earlier";

const getNotifBucket = (createdAt: string): NotifBucket => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return "Today";
  if (diffDays < 7) return "This Week";
  return "Earlier";
};

const getTimeLabel = (createdAt: string): string => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return `${Math.floor(day / 7)}w ago`;
};

const UserNavbar: React.FC = () => {
  const { user, openLogin, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // ── Notification center state (real, API-backed) ───────────────
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifTab, setNotifTab] = useState<"Today" | "This Week" | "Earlier" | "All">("Today");

  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const filteredNotifs = useMemo(
    () => (notifTab === "All"
      ? notifications
      : notifications.filter(n => getNotifBucket(n.createdAt) === notifTab)),
    [notifications, notifTab]
  );

  const fetchNotifications = async () => {
    setNotifLoading(true);
    setNotifError(null);
    try {
      const data = await getMyNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : "Couldn't load notifications.");
    } finally {
      setNotifLoading(false);
    }
  };

  // Fetch on login, then poll every 60s so the bell stays current
  // (new article published, someone replied/liked, ad request answered).
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    markNotificationRead(id).catch(err => {
      console.error("Failed to mark notification read:", err);
      // Revert on failure so the UI doesn't lie about server state.
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
    });
  };

  const handleNotificationClick = (notif: UserNotificationItem) => {
    if (!notif.read) handleMarkAsRead(notif.id);
    setIsNotificationOpen(false);
    navigate(notif.link);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(prev => !prev);
  };

  const { categories } = useCategories();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [mobileMenuOpen,    setMobileMenuOpen]    = useState(false);
  const [isSearchOpen,      setIsSearchOpen]      = useState(false);
  const [weekday,           setWeekday]           = useState("");
  const [date,              setDate]              = useState("");
  const [openDropdown,      setOpenDropdown]      = useState<string | null>(null);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);

  const searchInputRef   = useRef<HTMLInputElement>(null);
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [headlines, setHeadlines] = useState<string[]>([]);

  // ── Trending tags state ─────────────────────────────────────
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);

  // ── Search state ────────────────────────────────────────────
  const [searchQuery,     setSearchQuery]     = useState("");
  const [searchResults,   setSearchResults]   = useState<NewsArticle[]>([]);
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [searchError,     setSearchError]     = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestId   = useRef(0);

  const runSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }
    const thisRequest = ++searchRequestId.current;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await searchNews(trimmed, { limit: 8 });
      if (thisRequest !== searchRequestId.current) return; // stale response, ignore
      setSearchResults(res.news || []);
    } catch (err) {
      if (thisRequest !== searchRequestId.current) return;
      setSearchError(err instanceof Error ? err.message : "Search failed. Please try again.");
      setSearchResults([]);
    } finally {
      if (thisRequest === searchRequestId.current) setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => runSearch(value), 350);
  };

  const handleSearchSubmit = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    runSearch(searchQuery);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  };

  const goToArticle = (slug: string) => {
    closeSearch();
    navigate(`/article/${slug}`);
  };

  useEffect(() => {
    const fetchTickerNews = async () => {
      try {
        const data = await getBreakingTickerNews();
        setHeadlines(data.headlines || []);
      } catch (error) {
        console.error("Failed to fetch ticker news:", error);
      }
    };
    fetchTickerNews();
  }, []);

  // ── Trending tags (search panel "Trending:" chips) ────────────
  useEffect(() => {
    const fetchTrendingTags = async () => {
      try {
        const data = await getTrendingTags();
        setTrendingTags((data || []).slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch trending tags:", error);
      }
    };
    fetchTrendingTags();
  }, []);

  // ── Date ────────────────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    setWeekday(now.toLocaleDateString("en-US", { weekday: "long" }));
    setDate(now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  }, []);

  // ── Focus search ─────────────────────────────────────────────
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // ── Click outside profile dropdown & notification panel ──────
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Mobile category highlight ────────────────────────────────
  useEffect(() => {
    const currentSlug = location.pathname.split("/").pop();
    if (currentSlug && location.pathname.includes("/category/")) {
      const activeCategory = categories.find(c => c.slug === currentSlug);
      if (activeCategory) {
        setExpandedMobileCat(
          activeCategory.parentId != null
            ? String(activeCategory.parentId)
            : String(activeCategory.id)
        );
      }
    }
  }, [location.pathname, categories]);

  // ── Close search on route change ───────────────────────────────
  useEffect(() => {
    closeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ── Logout ───────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate("/");
  };

  // ── Nav helpers ───────────────────────────────────────────────
  const childrenOf = (parentId: string): Category[] =>
    categories.filter(c => String(c.parentId) === parentId && c.enabled);

  const featuredTopLevel = categories.filter(c => !c.parentId && c.enabled && c.featured);
  const allTopLevel      = categories.filter(c => !c.parentId && c.enabled);

  const handleMouseEnter = (id: string) => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setOpenDropdown(id);
  };

  const handleMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const handleSubscribeClick = () => {
    // Gate: an unauthenticated visitor must sign in before they can
    // subscribe. Previously this scrolled straight to the footer for
    // anyone, signed in or not — no auth check existed at all.
    if (!user) {
      openLogin();
      return;
    }
    const el = document.querySelector(".site-footer") || document.querySelector("footer");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleMobileCat = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setExpandedMobileCat(prev => (prev === id ? null : id));
  };

  const handleProfileClick = () => {
    setIsProfileOpen(false);
    window.open("/profile", "_blank", "noopener,noreferrer");
  };

  const handleTagClick = (tagText: string) => {
    setSearchQuery(tagText);
    if (searchInputRef.current) searchInputRef.current.focus();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    runSearch(tagText);
  };

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div className="navbar-wrapper">

      {/* ── BREAKING BAR ────────────────────────── */}
      <div className="breaking-bar">
        <div className="breaking-container">
          <span className="breaking-label">BREAKING NEWS</span>
          <div className="ticker">
            <div className="ticker-track">
              {[...headlines, ...headlines].map((h, i) => (
                <React.Fragment key={i}>
                  <span className="ticker-text">{h}</span>
                  <span className="ticker-separator">|</span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <span className="breaking-date">
            {weekday},<br />
            {date}
          </span>
        </div>
      </div>

      {/* ── MAIN NAVBAR ─────────────────────────── */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <button
              className="hamburger-btn-xx"
              onClick={() => setMobileMenuOpen(true)}
              style={{ opacity: mobileMenuOpen ? 0 : 1, visibility: mobileMenuOpen ? "hidden" : "visible" }}
            >
              <Menu size={28} />
            </button>

            <div className={`menu-overlay${mobileMenuOpen ? " open" : ""}`} onClick={() => setMobileMenuOpen(false)} />

            <div className="logo">
              <NavLink to="/" onClick={handleHomeClick}>
                <img src={logo} alt="Local Newz Logo" className="navbar-logo-img" />
              </NavLink>
            </div>

            {/* ── DESKTOP NAV ─────────────────── */}
            <nav className="nav-links">
              <NavLink to="/" end onClick={handleHomeClick}>Home</NavLink>

              {featuredTopLevel.map(cat => {
                const catId       = String(cat.id);
                const children    = childrenOf(catId);
                const hasChildren = children.length > 0;

                return (
                  <div
                    key={catId}
                    className="nav-item-wrapper"
                    onMouseEnter={() => handleMouseEnter(catId)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <NavLink
                      to={`/category/${cat.slug}`}
                      className={({ isActive }) => isActive ? "active" : ""}
                    >
                      {cat.name}
                      {hasChildren && <ChevronDown size={14} style={{ marginLeft: 3 }} />}
                    </NavLink>

                    {hasChildren && openDropdown === catId && (
                      <div className="nav-dropdown">
                        {children.map(child => (
                          <NavLink
                            key={String(child.id)}
                            to={`/category/${child.slug}`}
                            className="nav-dropdown-item"
                          >
                            {child.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* ── MOBILE DRAWER ───────────────── */}
            <div className={`hamburger-dropdown${mobileMenuOpen ? " open" : ""}`}>
              <button className="close-drawer-btn" onClick={() => setMobileMenuOpen(false)}>
                <X size={26} />
              </button>

              <NavLink to="/" className="mobile-link" onClick={e => { setMobileMenuOpen(false); handleHomeClick(e); }}>
                Home
              </NavLink>

              {allTopLevel.map(cat => {
                const catId       = String(cat.id);
                const children    = childrenOf(catId);
                const hasChildren = children.length > 0;
                const isExpanded  = expandedMobileCat === catId;

                const isActiveGroup =
                  location.pathname === `/category/${cat.slug}` ||
                  children.some(c => location.pathname === `/category/${c.slug}`);

                return (
                  <div key={catId} className="mobile-cat-group">
                    <div className={`mobile-cat-header ${isActiveGroup ? "active-group" : ""}`}>
                      <NavLink
                        to={`/category/${cat.slug}`}
                        className="mobile-link mobile-link--parent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.name}
                      </NavLink>
                      {hasChildren && (
                        <button className="mobile-expand-btn" onClick={e => toggleMobileCat(catId, e)}>
                          <ChevronDown size={18} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }} />
                        </button>
                      )}
                    </div>
                    {hasChildren && (
                      <div className={`mobile-subcats-grid ${isExpanded ? "open" : ""}`}>
                        {children.map(child => (
                          <NavLink
                            key={String(child.id)}
                            to={`/category/${child.slug}`}
                            className="mobile-sub-link"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="mobile-sub-dash">•</span> {child.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <NavLink to="/Topic"   className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Topic</NavLink>
              <div className="dropdown-divider" />
              <NavLink to="/about"   className="mobile-link" onClick={() => setMobileMenuOpen(false)}>About Us</NavLink>
              <NavLink to="/contact" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Contact Us</NavLink>
              <NavLink to="/advertise"        className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Advertise With Us</NavLink>
            </div>
          </div>

          {/* ── RIGHT ACTIONS ─────────────────── */}
          <div className="nav-actions">

            {/* ── SEARCH TOGGLE BUTTON ── */}
            <button
              className="open-search-btn"
              onClick={() => (isSearchOpen ? closeSearch() : setIsSearchOpen(true))}
              title="Search"
            >
              {isSearchOpen ? <X size={24} /> : <Search size={22} />}
            </button>

            {/* ── NOTIFICATION CENTER ── */}
            <div className="notification-wrapper" ref={notificationRef}>
              <button
                className="nav-icon-btn"
                onClick={toggleNotification}
              >
                {isNotificationOpen ? <X size={20} /> : <Bell size={20} />}
                {!isNotificationOpen && unreadCount > 0 && (
                  <span className="notification-dot" />
                )}
              </button>

              <div className={`notif-panel ${isNotificationOpen ? "open" : ""}`}>

                {/* Header */}
                <div className="notif-header">
                  <h3 className="notif-title-main">Notification Center</h3>
                  <button
                    className={`notif-see-all ${notifTab === "All" ? "active" : ""}`}
                    onClick={() => setNotifTab("All")}
                    style={{
                      background: notifTab === "All" ? "#f8fafc" : "transparent",
                      color: notifTab === "All" ? "#0f172a" : "#64748b",
                      borderColor: notifTab === "All" ? "#cbd5e1" : "#e2e8f0"
                    }}
                  >
                    See All
                  </button>
                </div>

                {/* Tabs */}
                <div className="notif-tabs-wrapper">
                  <div className="notif-tabs">
                    {(["Today", "This Week", "Earlier"] as const).map(tab => (
                      <button
                        key={tab}
                        className={`notif-tab ${notifTab === tab ? "active" : ""}`}
                        onClick={() => setNotifTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List Items */}
                <div className="notif-list">
                  {notifLoading && notifications.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: "14px" }}>
                      Loading notifications…
                    </div>
                  ) : notifError ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#dc2626", fontSize: "14px" }}>
                      {notifError}
                    </div>
                  ) : filteredNotifs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: "14px" }}>
                      No notifications to show.
                    </div>
                  ) : (
                    filteredNotifs.map(notif => {
                      const Icon = NOTIF_ICONS[notif.type] || Bell;
                      return (
                        <div
                          key={notif.id}
                          className="notif-item"
                          onClick={() => handleNotificationClick(notif)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="notif-icon"><Icon size={20} strokeWidth={1.5} /></div>
                          <div className="notif-content">
                            <div className="notif-top">
                              <span className="notif-subj">
                                {!notif.read && <span className="notif-dot">•</span>}
                                {notif.title}
                              </span>
                              <span className="notif-time">{getTimeLabel(notif.createdAt)}</span>
                            </div>
                            <p className="notif-desc">{notif.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Subscribe */}
            <button className="subscribe-btn" onClick={handleSubscribeClick}>Subscribe</button>

            {/* Profile / Sign-in */}
            {user ? (
              <div className="nav-profile-container" ref={profileDropdownRef}>
                <button
                  className={`nav-profile-btn ${isProfileOpen ? "active" : ""}`}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="nav-avatar">
                    {user.profilePic
                      ? <img src={user.profilePic} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      : user.name
                          .split(" ")
                          .map(word => word[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                  </div>
                  <span className="nav-username">{user.name}</span>
                </button>

                {isProfileOpen && (
                  <div className="profile-dropdown-menu">
                    <div className="pd-header">
                      <span className="pd-name">{user.name}</span>
                      <span className="pd-email">{user.email}</span>
                    </div>
                    <div className="pd-divider" />
                    <button className="pd-item" onClick={handleProfileClick}>
                      <User size={16} /><span>Profile</span>
                    </button>
                    <div className="pd-divider" />
                    <button className="pd-item pd-logout" onClick={handleLogout}>
                      <LogOut size={16} /><span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="nav-signin-btn" onClick={openLogin}>
                <User size={16} /><span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* ── MEGA SEARCH DROP-DOWN PANEL ── */}
        <div className={`search-mega-panel ${isSearchOpen ? "open" : ""}`}>
          <div className="smp-container">
            <div className="smp-input-group">
              <div className="smp-input-wrapper">
                <Search size={20} className="smp-icon" />
                <input
                  type="text"
                  placeholder="Search for latest news, topics, or events..."
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(); }}
                />
              </div>
              <button className="smp-submit-btn" onClick={handleSearchSubmit}>Search</button>
            </div>

            {/* ── LIVE RESULTS ── */}
            {searchQuery.trim() !== "" && (
              <div className="smp-results" role="listbox">
                {searchLoading && (
                  <div className="smp-results-status">Searching…</div>
                )}
                {!searchLoading && searchError && (
                  <div className="smp-results-status smp-results-error">{searchError}</div>
                )}
                {!searchLoading && !searchError && searchResults.length === 0 && (
                  <div className="smp-results-status">No articles found for "{searchQuery}".</div>
                )}
                {!searchLoading && !searchError && searchResults.map((article) => (
                  <button
                    key={article.id}
                    className="smp-result-item"
                    onClick={() => goToArticle(article.slug)}
                  >
                    {article.featuredImage && (
                      <img src={article.featuredImage} alt="" className="smp-result-thumb" />
                    )}
                    <div className="smp-result-text">
                      <span className="smp-result-headline">{article.headline}</span>
                      {article.category?.name && (
                        <span className="smp-result-category">{article.category.name}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── TRENDING TAGS (real data from /api/tags/trending) ── */}
            {trendingTags.length > 0 && (
              <div className="smp-trending">
                <span className="smp-trending-label">Trending:</span>
                <div className="smp-tags">
                  {trendingTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="smp-tag"
                      onClick={() => handleTagClick(tag.name)}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </header>
    </div>
  );
};

export default UserNavbar;