import "./AdminSidebar.css";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../../assets/Logo.png";
import { X } from "lucide-react";

import {
  FaNewspaper, FaBolt, FaFire, FaStar, FaClock,
  FaTags, FaPhotoVideo, FaComments, FaChartBar,
  FaCog, FaTachometerAlt,
} from "react-icons/fa";
import { MdWifiTethering, MdNotifications, MdFolder } from "react-icons/md";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        {/* HEADER */}
        <div className="sidebar-header">
          <div className="logo-box" onClick={() => go("/admin/dashboard")} style={{ cursor: "pointer" }}>
            <img src={Logo} alt="Local Newz Logo" className="sidebar-logo" />
          </div>
          <div className="sidebar-title">
            <h3>Local Newz</h3>
            <span>Admin Panel</span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* MENU */}
        <nav className="sidebar-menu">
          <p className="menu-title">MENU</p>

          <SidebarItem icon={<FaTachometerAlt />} label="Dashboard" active={isActive("/admin/dashboard")} onClick={() => go("/admin/dashboard")} />
          <SidebarItem icon={<FaNewspaper />} label="All News" badge="156" active={isActive("/admin/news")} onClick={() => go("/admin/news")} />
          <SidebarItem icon={<FaBolt />} label="Breaking News" badge="3" danger active={isActive("/admin/breaking")} onClick={() => go("/admin/breaking")} />
          <SidebarItem icon={<MdWifiTethering />} label="Live News" badge="3" danger active={isActive("/admin/live")} onClick={() => go("/admin/live")} />
          <SidebarItem icon={<FaComments />} label="Comments" badge="24" active={isActive("/admin/comments")} onClick={() => go("/admin/comments")} />
          <SidebarItem icon={<FaFire />} label="Trending" active={isActive("/admin/trending")} onClick={() => go("/admin/trending")} />
          <SidebarItem icon={<FaStar />} label="Featured" active={isActive("/admin/feature")} onClick={() => go("/admin/feature")} />
          <SidebarItem icon={<FaClock />} label="Scheduled" badge="12" active={isActive("/admin/schedule")} onClick={() => go("/admin/schedule")} />
          <SidebarItem icon={<MdFolder />} label="Categories" active={isActive("/admin/categories")} onClick={() => go("/admin/categories")} />
          <SidebarItem icon={<FaTags />} label="Tags" active={isActive("/admin/tags")} onClick={() => go("/admin/tags")} />
          <SidebarItem icon={<FaPhotoVideo />} label="Media Library" active={isActive("/admin/medialibrary")} onClick={() => go("/admin/medialibrary")} />
          <SidebarItem icon={<FaChartBar />} label="Analytics" active={isActive("/admin/analytics")} onClick={() => go("/admin/analytics")} />
          <SidebarItem icon={<MdNotifications />} label="Notifications" badge="12" active={isActive("/admin/notification")} onClick={() => go("/admin/notification")} />
          <SidebarItem icon={<FaCog />} label="Settings" active={isActive("/admin/setting")} onClick={() => go("/admin/setting")} />
        </nav>

        {/* USER */}
        <div className="sidebar-user">
          <div className="avatar">LN</div>
          <div className="sidebar-user-info">
            <strong>Local Newz</strong>
            <span>Chief Editor</span>
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

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, badge, active, danger, onClick }) => (
  <div onClick={onClick} className={`sidebar-item ${active ? "active" : ""} ${danger ? "danger" : ""}`} title={label}>
    <div className="item-left">
      {icon}
      <span className="item-label">{label}</span>
    </div>
    {badge && <span className="badge">{badge}</span>}
  </div>
);

export default AdminSidebar;