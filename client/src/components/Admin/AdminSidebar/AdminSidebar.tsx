import "./AdminSidebar.css";
import type { ReactNode } from "react";

import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../../assets/Logo.png";
import { X, Newspaper } from "lucide-react";
import {
  ChartNoAxesCombined,
  PanelsTopLeft,
  BadgeDollarSign,
  Info,
  ContactRound,
} from "lucide-react";

import {
  FaNewspaper,
  FaBolt,
  FaFire,
  FaClock,
  FaTags,
  FaPhotoVideo,
  FaComments,
  FaCog,
  FaTachometerAlt,
  FaUserEdit,
} from "react-icons/fa";
import { MdWifiTethering, MdNotifications, MdFolder } from "react-icons/md";

interface AuthUser {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR";
  permissions?: string[];
}

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  open,
  onClose,
  user,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const isEditor = user?.role === "EDITOR";

  const hasPermission = (permission: string) => {
    if (!isEditor) return true;

    return user?.permissions?.includes(permission) ?? false;
  };

  // Editor sidebar routes
  const editorPath = (path: string) => `/editor/${path}`;

  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        {/* HEADER */}
        <div className="sidebar-header">
          <div
            className="logo-box"
            onClick={() =>
              go(
                isEditor
                  ? "/editor/editor-dashboard"
                  : "/admin/dashboard"
              )
            }
            style={{ cursor: "pointer" }}
          >
            <img
              src={Logo}
              alt="Local Newz Logo"
              className="sidebar-logo"
            />
          </div>

          <div className="sidebar-title">
            <h3>Local Newz</h3>
            <span>{isEditor ? "Editor Panel" : "Admin Panel"}</span>
          </div>

          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* MENU */}
        <nav className="sidebar-menu">
          <p className="menu-title">MENU</p>

          {/* ==================== ADMIN SIDEBAR ==================== */}
          {!isEditor && (
            <>
              <SidebarItem
                icon={<FaTachometerAlt />}
                label="Dashboard"
                active={isActive("/admin/dashboard")}
                onClick={() => go("/admin/dashboard")}
              />

              <SidebarItem
                icon={<FaNewspaper />}
                label="All News"
                active={isActive("/admin/news")}
                onClick={() => go("/admin/news")}
              />

              <SidebarItem
                icon={<FaUserEdit />}
                label="Editors"
                active={isActive("/admin/editors")}
                onClick={() => go("/admin/editors")}
              />

              <SidebarItem
                icon={<Newspaper />}
                label="Topic Profile"
                active={isActive("/admin/profile")}
                onClick={() => go("/admin/profile")}
              />

              <SidebarItem
                icon={<FaBolt />}
                label="Breaking News"
                danger
                active={isActive("/admin/breaking")}
                onClick={() => go("/admin/breaking")}
              />

              <SidebarItem
                icon={<MdWifiTethering />}
                label="Live News"
                danger
                active={isActive("/admin/live")}
                onClick={() => go("/admin/live")}
              />

              <SidebarItem
                icon={<FaComments />}
                label="Comments"
                active={isActive("/admin/comments")}
                onClick={() => go("/admin/comments")}
              />

              <SidebarItem
                icon={<FaFire />}
                label="Trending"
                active={isActive("/admin/trending")}
                onClick={() => go("/admin/trending")}
              />

              <SidebarItem
                icon={<FaClock />}
                label="Scheduled"
                active={isActive("/admin/schedule")}
                onClick={() => go("/admin/schedule")}
              />

              <SidebarItem
                icon={<MdFolder />}
                label="Categories"
                active={isActive("/admin/categories")}
                onClick={() => go("/admin/categories")}
              />

              <SidebarItem
                icon={<FaTags />}
                label="Tags"
                active={isActive("/admin/tags")}
                onClick={() => go("/admin/tags")}
              />

              <SidebarItem
                icon={<FaPhotoVideo />}
                label="Media Library"
                active={isActive("/admin/medialibrary")}
                onClick={() => go("/admin/medialibrary")}
              />

              <SidebarItem
                icon={<MdNotifications />}
                label="Notifications"
                active={isActive("/admin/notification")}
                onClick={() => go("/admin/notification")}
              />

              <SidebarItem
                icon={<ChartNoAxesCombined size={18} />}
                label="User Insights"
                active={isActive("/admin/user-insights")}
                onClick={() => go("/admin/user-insights")}
              />

              <SidebarItem
                icon={<PanelsTopLeft size={18} />}
                label="Footer Manager"
                active={isActive("/admin/footer-management")}
                onClick={() => go("/admin/footer-management")}
              />

              <SidebarItem
                icon={<BadgeDollarSign size={18} />}
                label="Advertisement Manager"
                active={isActive("/admin/advertisement-manager")}
                onClick={() => go("/admin/advertisement-manager")}
              />

              <SidebarItem
                icon={<Info size={18} />}
                label="About Manager"
                active={isActive("/admin/about-manager")}
                onClick={() => go("/admin/about-manager")}
              />

              <SidebarItem
                icon={<ContactRound size={18} />}
                label="Contact Manager"
                active={isActive("/admin/contact-manager")}
                onClick={() => go("/admin/contact-manager")}
              />

              <SidebarItem
                icon={<FaCog />}
                label="Settings"
                active={isActive("/admin/setting")}
                onClick={() => go("/admin/setting")}
              />
            </>
          )}

          {/* ==================== EDITOR SIDEBAR ==================== */}
          {isEditor && (
            <>
              <SidebarItem
                icon={<FaTachometerAlt />}
                label="Dashboard"
                active={isActive("/editor/editor-dashboard")}
                onClick={() => go("/editor/editor-dashboard")}
              />

              {hasPermission("news") && (
                <SidebarItem
                  icon={<FaNewspaper />}
                  label="All News"
                  active={isActive("/editor/news")}
                  onClick={() => go(editorPath("news"))}
                />
              )}

              {hasPermission("topic-profile") && (
                <SidebarItem
                  icon={<Newspaper />}
                  label="Topic Profile"
                  active={isActive("/editor/profile")}
                  onClick={() => go(editorPath("profile"))}
                />
              )}

              {hasPermission("breaking-news") && (
                <SidebarItem
                  icon={<FaBolt />}
                  label="Breaking News"
                  danger
                  active={isActive("/editor/breaking")}
                  onClick={() => go(editorPath("breaking"))}
                />
              )}

              {hasPermission("live-news") && (
                <SidebarItem
                  icon={<MdWifiTethering />}
                  label="Live News"
                  danger
                  active={isActive("/editor/live")}
                  onClick={() => go(editorPath("live"))}
                />
              )}

              {hasPermission("comments") && (
                <SidebarItem
                  icon={<FaComments />}
                  label="Comments"
                  active={isActive("/editor/comments")}
                  onClick={() => go(editorPath("comments"))}
                />
              )}

              {hasPermission("trending") && (
                <SidebarItem
                  icon={<FaFire />}
                  label="Trending"
                  active={isActive("/editor/trending")}
                  onClick={() => go(editorPath("trending"))}
                />
              )}

              {hasPermission("scheduled") && (
                <SidebarItem
                  icon={<FaClock />}
                  label="Scheduled"
                  active={isActive("/editor/schedule")}
                  onClick={() => go(editorPath("schedule"))}
                />
              )}

              {hasPermission("categories") && (
                <SidebarItem
                  icon={<MdFolder />}
                  label="Categories"
                  active={isActive("/editor/categories")}
                  onClick={() => go(editorPath("categories"))}
                />
              )}

              {hasPermission("tags") && (
                <SidebarItem
                  icon={<FaTags />}
                  label="Tags"
                  active={isActive("/editor/tags")}
                  onClick={() => go(editorPath("tags"))}
                />
              )}

              {hasPermission("media-library") && (
                <SidebarItem
                  icon={<FaPhotoVideo />}
                  label="Media Library"
                  active={isActive("/editor/medialibrary")}
                  onClick={() => go(editorPath("medialibrary"))}
                />
              )}

              {hasPermission("notification") && (
                <SidebarItem
                  icon={<MdNotifications />}
                  label="Notifications"
                  active={isActive("/editor/notification")}
                  onClick={() => go(editorPath("notification"))}
                />
              )}

              {hasPermission("analytics") && (
                <SidebarItem
                  icon={<ChartNoAxesCombined size={18} />}
                  label="User Insights"
                  active={isActive("/editor/user-insights")}
                  onClick={() => go(editorPath("user-insights"))}
                />
              )}

              {hasPermission("footer-management") && (
                <SidebarItem
                  icon={<PanelsTopLeft size={18} />}
                  label="Footer Manager"
                  active={isActive("/editor/footer-management")}
                  onClick={() => go(editorPath("footer-management"))}
                />
              )}

              {hasPermission("advertisement-manager") && (
                <SidebarItem
                  icon={<BadgeDollarSign size={18} />}
                  label="Advertisement Manager"
                  active={isActive("/editor/advertisement-manager")}
                  onClick={() => go(editorPath("advertisement-manager"))}
                />
              )}

              {hasPermission("contact-manager") && (
                <SidebarItem
                  icon={<ContactRound size={18} />}
                  label="Contact Manager"
                  active={isActive("/editor/contact-manager")}
                  onClick={() => go(editorPath("contact-manager"))}
                />
              )}

              <SidebarItem
                icon={<FaCog />}
                label="Settings"
                active={isActive("/editor/settings")}
                onClick={() => go("/editor/settings")}
              />
            </>
          )}
        </nav>

        {/* USER */}
        <div className="sidebar-user">
          <div className="avatar">
            {user?.name
              ? user.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "LN"}
          </div>

          <div className="sidebar-user-info">
            <strong>{user?.name || "Local Newz"}</strong>
            <span>{isEditor ? "Editor" : "Chief Editor"}</span>
          </div>
        </div>
      </aside>
    </>
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
}) => (
  <div
    onClick={onClick}
    className={`sidebar-item ${active ? "active" : ""} ${
      danger ? "danger" : ""
    }`}
  >
    <div className="item-left">
      {icon}
      <span className="item-label">{label}</span>
    </div>

    {badge && <span className="badge">{badge}</span>}
  </div>
);

export default AdminSidebar;