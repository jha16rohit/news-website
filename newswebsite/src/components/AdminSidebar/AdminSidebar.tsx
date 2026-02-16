import "./AdminSidebar.css";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import Logo from "../../assets/Logo.png";

import {
  FaNewspaper,
  FaBolt,
  FaFire,
  FaStar,
  FaClock,
  FaTags,
  FaPhotoVideo,
  FaComments,
  FaChartBar,
  FaCog,
  FaTachometerAlt,
  FaBell,
  FaUserShield,
} from "react-icons/fa";
import { Folder } from "lucide-react";

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className="sidebar">
      {/* HEADER */}
      <div className="sidebar-header">
        <div
          className="logo-box"
          onClick={() => navigate("/admin")}
          style={{ cursor: "pointer" }}
        >
          <img src={Logo} alt="Local Newz Logo" className="sidebar-logo" />
        </div>
        <div>
          <h3>Local Newz</h3>
          <span>Admin Panel</span>
        </div>
      </div>

      {/* MENU */}
      <nav className="sidebar-menu">
        <p className="menu-title">MENU</p>

        <SidebarItem
          icon={<FaTachometerAlt />}
          label="Dashboard"
          active={isActive("/admin/dashboard")}
          onClick={() => navigate("/admin/dashboard")}
        />

        <SidebarItem
          icon={<FaNewspaper />}
          label="All News"
          badge="156"
          active={isActive("/admin/news")}
          onClick={() => navigate("/admin/news")}
        />

        <SidebarItem
          icon={<FaBolt />}
          label="Breaking News"
          badge="3"
          danger
          active={isActive("/admin/breaking")}
          onClick={() => navigate("/admin/breaking")}
        />

        <SidebarItem
          icon={<FaComments />}
          label="Comments"
          badge="24"
          active={isActive("/admin/comments")}
          onClick={() => navigate("/admin/comments")}
        />

        <SidebarItem
          icon={<FaFire />}
          label="Trending"
          active={isActive("/admin/trending")}
          onClick={() => navigate("/admin/trending")}
        />

        <SidebarItem
          icon={<FaStar />}
          label="Featured"
          active={isActive("/admin/feature")}
          onClick={() => navigate("/admin/feature")}
        />

        <SidebarItem
          icon={<FaClock />}
          label="Scheduled"
          badge="12"
          active={isActive("/admin/schedule")}
          onClick={() => navigate("/admin/schedule")}
        />

        <SidebarItem
          icon={<Folder />}
          label="Categories"
          active={isActive("/admin/categories")}
          onClick={() => navigate("/admin/categories")}
        />

        <SidebarItem
          icon={<FaTags />}
          label="Tags"
          active={isActive("/admin/tags")}
          onClick={() => navigate("/admin/tags")}
        />

        <SidebarItem
          icon={<FaPhotoVideo />}
          label="Media Library"
          active={isActive("/admin/medialibrary")}
          onClick={() => navigate("/admin/medialibrary")}
        />

        <SidebarItem
          icon={<FaUserShield />}
          label="Admin"
          active={isActive("/admin/admin")}
          onClick={() => navigate("/admin/admin")}
        />

        <SidebarItem
          icon={<FaChartBar />}
          label="Analytics"
          active={isActive("/admin/analytics")}
          onClick={() => navigate("/admin/analytics")}
        />

        {/* 🔔 Notifications with Dropdown */}
        <div className="sidebar-notification-wrapper" ref={notificationRef}>
          <SidebarItem
            icon={<FaBell />}
            label="Notifications"
            onClick={() => setNotificationsOpen((prev) => !prev)}
          />

          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <strong>Notifications</strong>
                <span className="mark-read">Mark all read</span>
              </div>

              <div className="notification-item">
                <p>Breaking news pending approval</p>
                <span>2m ago</span>
              </div>

              <div className="notification-item active">
                <p>15 new comments on 'Election Results'</p>
                <span>5m ago</span>
              </div>

              <div className="notification-item">
                <p>Article scheduled for 3:00 PM</p>
                <span>10m ago</span>
              </div>

              <div className="notification-footer">
                View all notifications
              </div>
            </div>
          )}
        </div>

        <SidebarItem
          icon={<FaCog />}
          label="Settings"
          active={isActive("/admin/setting")}
          onClick={() => navigate("/admin/setting")}
        />
      </nav>

      {/* USER */}
      <div className="sidebar-user">
        <div className="avatar abcd">LN</div>
        <div>
          <strong>Local Newz</strong>
          <br />
          <span>Chief Editor</span>
        </div>
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  badge?: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  badge,
  active,
  danger,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`sidebar-item ${active ? "active" : ""} ${
        danger ? "danger" : ""
      }`}
    >
      <div className="item-left">
        {icon}
        <span>{label}</span>
      </div>
      {badge && <span className="badge">{badge}</span>}
    </div>
  );
};

export default AdminSidebar;
