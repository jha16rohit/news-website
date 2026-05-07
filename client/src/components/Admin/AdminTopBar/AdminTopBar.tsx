import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminTopBar.css";
import { Bell, Plus, Search, ChevronDown, Settings, LogOut, Menu, X } from "lucide-react";
import { useNews } from "../NewsStore/NewsStore";
import { logoutUser } from "../../../api/auth"; // ✅ import logout API call

interface AdminTopBarProps {
  onMenuClick: () => void;
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ onMenuClick }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const navigate = useNavigate();
  const { articles } = useNews();

  // Count articles that are currently live:
  // tagType === "live" AND statusType is not "ended"
  const liveCount = articles.filter(
    (a) => a.tagType === "live" && a.statusType !== "ended"
  ).length;

  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (searchRef.current  && !searchRef.current.contains(e.target as Node))  setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ✅ Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logoutUser(); // clears the cookie on the server
    } catch (error) {
      console.error("Logout error:", error);
      // Even if the API call fails, we still redirect to login
    } finally {
      setProfileOpen(false);
      navigate("/admin/login-xyzsft"); // ✅ redirect to admin login page
    }
  };

  return (
    <div className="admin-topbar">
      {/* Hamburger — visible only on small screens */}
      <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
      </button>

      {/* Search */}
      <div className={`topbar-search ${searchOpen ? "search-expanded" : ""}`} ref={searchRef}>
        {!searchOpen && (
          <button className="search-icon-btn" onClick={() => setSearchOpen(true)}>
            <Search size={18} />
          </button>
        )}
        <div className={`search-input-wrap ${searchOpen ? "search-input-wrap-visible" : ""}`}>
          <Search size={15} className="search-prefix-icon" />
          <input placeholder="Search articles, authors, categories..." autoFocus={searchOpen} />
          <button className="search-clear-btn" onClick={() => setSearchOpen(false)}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        <div className="live-badge">
          <span className="live-dot" />
          <span className="live-text">{liveCount} Live</span>
        </div>

        <div className="notification" onClick={() => navigate("/admin/notification")}>
          <Bell size={20} />
          <span className="notification-count">3</span>
        </div>

        {/* Add News — direct link, no dropdown */}
        <button className="add-news-btn" onClick={() => navigate("/admin/news/create")}>
          <Plus size={18} />
          <span className="btn-label">Add News</span>
        </button>

        {/* Profile */}
        <div className="profile-wrapper" ref={profileRef}>
          <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
            <div className="user-avatar">ED</div>
            <ChevronDown size={16} className="profile-chevron" />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-header"><strong>Editor Admin</strong></div>
              <div className="profile-item" onClick={() => { navigate("/admin/setting"); setProfileOpen(false); }}>
                <Settings size={18} /> Settings
              </div>
              <div className="profile-divider" />
              {/* ✅ Sign out now calls handleSignOut */}
              <div className="profile-item danger" onClick={handleSignOut}>
                <LogOut size={18} /> Sign out
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;