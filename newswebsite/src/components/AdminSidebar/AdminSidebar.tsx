import "./AdminSidebar.css";
import type { ReactNode } from "react";
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
  return (
    <aside className="sidebar">
      {/* LOGO */}
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

        <SidebarItem icon={<FaTachometerAlt />} label="Dashboard" active />
        <SidebarItem icon={<FaNewspaper />} label="All News" badge="156" />
        <SidebarItem icon={<FaBolt />} label="Breaking News" badge="3" danger />
        <SidebarItem icon={<FaFire />} label="Trending" />
        <SidebarItem icon={<FaStar />} label="Featured" />
        <SidebarItem icon={<FaClock />} label="Scheduled" badge="12" />
        <SidebarItem icon={<FaFolder />} label="Categories" />
        <SidebarItem icon={<FaTags />} label="Tags" />
        <SidebarItem icon={<FaPhotoVideo />} label="Media Library" />

        <p className="menu-title">MANAGEMENT</p>

        <SidebarItem icon={<FaUsers />} label="Authors" />
        <SidebarItem icon={<FaComments />} label="Comments" badge="24" />
        <SidebarItem icon={<FaChartBar />} label="Analytics" />
        <SidebarItem icon={<FaSearch />} label="SEO" />
        <SidebarItem icon={<FaCog />} label="Settings" />
      </nav>

      {/* USER */}
      <div className="sidebar-user">
        <div className="avatar">LN</div>
        <div>
          <strong>Local Newz</strong><br />
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
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  badge,
  active,
  danger,
}) => {
  return (
    <div
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
