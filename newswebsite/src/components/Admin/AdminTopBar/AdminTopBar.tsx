import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminTopBar.css";
import {
  Bell,
  Plus,
  Search,
  ChevronDown,
  FileText,
  Zap,
  Video,
  Image,
  Settings,
  LogOut,
  Star, 
  MessageSquare 
} from "lucide-react";

const AdminTopBar: React.FC = () => {
  const [newsOpen, setNewsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const newsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (newsRef.current && !newsRef.current.contains(e.target as Node)) {
        setNewsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="admin-topbar">
      {/* Search */}
      <div className="topbar-search">
        <Search className="search-icon" size={18} />
        <input placeholder="Search articles, authors, categories..." />
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        <div className="live-badge">
          <span className="live-dot" />
          3 Live
        </div>

        <div
          className="notification"
          onClick={() => navigate("/admin/notification")}
        >
          <Bell size={20} />
          <span className="notification-count">3</span>
        </div>


        {/* Add News */}
        <div className="add-news-wrapper" ref={newsRef}>
          <button
            className="add-news-btn"
            onClick={() => setNewsOpen(!newsOpen)}
          >
            <Plus size={18} />
            Add News
            <ChevronDown size={16} />
          </button>

          {newsOpen && (
            <div className="add-news-dropdown">
              <div
                className="dropdown-item"
                onClick={() => {
                  navigate("/admin/news/create");
                  setNewsOpen(false);
                }}
              >
                <FileText size={18} />
                Standard Article
              </div>

              <div
                className="dropdown-item danger"
                onClick={() => {
                  navigate("/admin/news/create?type=breaking");
                  setNewsOpen(false);
                }}
              >
                <Zap size={18} />
                Breaking News
              </div>

              <div
                className="dropdown-item danger"
                onClick={() => {
                  navigate("/admin/news/create?type=exclusive");
                  setNewsOpen(false);
                }}
              >
                <Star size={18} />
                Exclusive Story
              </div>

              <div
                className="dropdown-item"
                onClick={() => {
                  navigate("/admin/news/create?type=opinion");
                  setNewsOpen(false);
                }}
              >
                <MessageSquare size={18} />
                Opinion / Editorial
              </div>

              <div
                className="dropdown-item"
                onClick={() => {
                  navigate("/admin/news/create?type=video");
                  setNewsOpen(false);
                }}
              >
                <Video size={18} />
                Video Story
              </div>

              <div
                className="dropdown-item"
                onClick={() => {
                  navigate("/admin/news/create?type=gallery");
                  setNewsOpen(false);
                }}
              >
                <Image size={18} />
                Photo Gallery
              </div>
            </div>
          )}

        </div>

        {/* Profile */}
        <div className="profile-wrapper" ref={profileRef}>
          <button
            className="profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="user-avatar">ED</div>
            <ChevronDown size={16} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <strong>Editor Admin</strong>
              </div>

              <div
                className="profile-item"
                onClick={() => {
                  navigate("/admin/setting"); // adjust if needed
                  setProfileOpen(false);
                }}
              >
                <Settings size={18} />
                Settings
              </div>


              <div className="profile-divider" />

              <div className="profile-item danger">
                <LogOut size={18} />
                Sign out
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;
