import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminTopBar.css";
import {
  Bell,
  Plus,
  ChevronDown,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { getMe, logoutUser } from "../../../api/auth";
import { fetchAdminNews } from "../../../api/news";

interface AdminTopBarProps {
  onMenuClick: () => void;
}

interface AuthUser {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR";
  permissions?: string[];
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ onMenuClick }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(null);

  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);

  // Get currently logged-in user from backend
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getMe();
        setUser(res.user);
      } catch {
        setUser(null);
      }
    };

    loadUser();
  }, []);

  const isEditor = user?.role === "EDITOR";

  const hasPermission = (permission: string) => {
    if (!isEditor) return true;

    return user?.permissions?.includes(permission) ?? false;
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("admin-auth");
      localStorage.removeItem("admin-token");

      setProfileOpen(false);
      navigate("/admin/login-xyzsft");
    }
  };

  // Load live article count
  useEffect(() => {
    const loadLiveCount = async () => {
      try {
        const data = await fetchAdminNews({
          articleType: "LIVE",
          limit: 100,
        });

        const liveArticles = (data?.news ?? []).filter(
          (article: any) =>
            article.status === "PUBLISHED" &&
            article.statusType !== "ended"
        );

        setLiveCount(liveArticles.length);
      } catch (error) {
        console.error("Failed to load live article count:", error);
        setLiveCount(0);
      }
    };

    loadLiveCount();

    const interval = setInterval(loadLiveCount, 20000);

    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = () => {
    if (isEditor) {
      if (!hasPermission("notification")) return;

      navigate("/editor/notification");
      return;
    }

    navigate("/admin/notification");
  };

  const handleAddNews = () => {
    if (isEditor) {
      if (!hasPermission("create-news")) return;

      navigate("/editor/news/create");
      return;
    }

    navigate("/admin/news/create");
  };

  const handleSettings = () => {
    if (isEditor) {
      // Editor does not currently have Settings permission.
      return;
    }

    navigate("/admin/setting");
    setProfileOpen(false);
  };

  const avatarText = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : isEditor
      ? "ED"
      : "AD";

  return (
    <div className="admin-topbar">
      {/* Hamburger — visible only on small screens */}
      <button
        className="hamburger-btn"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Actions */}
      <div className="topbar-actions">
        {/* Live */}
        <div className="live-badge">
          <span className="live-dot" />
          <span className="live-text">Live</span>
          <span className="live-count">{liveCount}</span>
        </div>

        {/* Notifications */}
        {(!isEditor || hasPermission("notification")) && (
          <div
            className="notification"
            onClick={handleNotificationClick}
          >
            <Bell size={20} />
            <span className="notification-count">3</span>
          </div>
        )}

        {/* Add News */}
        {(!isEditor || hasPermission("create-news")) && (
          <button
            className="add-news-btn"
            onClick={handleAddNews}
          >
            <Plus size={18} />
            <span className="btn-label">Add News</span>
          </button>
        )}

        {/* Profile */}
        <div
          className="profile-wrapper"
          ref={profileRef}
        >
          <button
            className="profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="user-avatar">
              {avatarText}
            </div>

            <ChevronDown
              size={16}
              className="profile-chevron"
            />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <strong>
                  {user?.name || (isEditor ? "Editor" : "Admin")}
                </strong>
              </div>

              {/* Settings — Admin only */}
              {!isEditor && (
                <div
                  className="profile-item"
                  onClick={handleSettings}
                >
                  <Settings size={18} />
                  Settings
                </div>
              )}

              {!isEditor && <div className="profile-divider" />}

              {/* Sign Out */}
              <div
                className="profile-item danger"
                onClick={handleSignOut}
              >
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