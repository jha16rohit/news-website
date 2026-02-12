import "./AdminSidebar.css";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../assets/Logo.png";

import {
  FaNewspaper,
  FaBolt,
  FaFire,
  FaStar,
  FaClock,
  FaFolder,
  FaTags,
  FaPhotoVideo,
  FaUsers,
  FaComments,
  FaChartBar,
  FaSearch,
  FaCog,
  FaTachometerAlt,
} from "react-icons/fa";

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="sidebar">
      {/* HEADER */}
      <div className="sidebar-header">
        <div className="logo-box">
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
          onClick={() => navigate("/admin/trending")} />
        <SidebarItem 
          icon={<FaStar />} 
          label="Featured"
          active={isActive("/admin/feature")}
          onClick={() => navigate("/admin/feature")} />
       <SidebarItem 
        icon={<FaClock />} 
        label="Scheduled" 
        badge="12"
        active={isActive("/admin/schedule")}
        onClick={() => navigate("/admin/schedule")} />
        <SidebarItem 
          icon={<FaFolder />} 
          label="Categories"
          active={isActive("/admin/Categories")}
        onClick={() => navigate("/admin/Categories")} />
        <SidebarItem 
          icon={<FaTags />} 
          label="Tags"
          active={isActive("/admin/tags")}
        onClick={() => navigate("/admin/tags")} />
        <SidebarItem 
          icon={<FaPhotoVideo />} 
          label="Media Library"
          active={isActive("/admin/medialibrary")}
          onClick={() => navigate("/admin/medialibrary")} />

        <p className="menu-title">MANAGEMENT</p>

        <SidebarItem icon={<FaUsers />} label="Authors" />
        <SidebarItem icon={<FaChartBar />} label="Analytics" />
        <SidebarItem icon={<FaSearch />} label="SEO" />
        <SidebarItem icon={<FaCog />} label="Settings" />
      </nav>

      {/* USER */}
      <div className="sidebar-user">
        <div className="avatar">LN</div>
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
