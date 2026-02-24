import React from "react";
import "./UserNavbar.css";
import { Search, Bell, User } from "lucide-react";

const UserNavbar: React.FC = () => {
  return (
    <>
      {/* Top Navigation */}
      <header className="navbar">
        <div className="navbar-container">
          
          {/* Logo */}
          <div className="logo">
            <span className="logo-red">LOCAL</span>
            <span className="logo-white"> NEWZ</span>
          </div>

          {/* Nav Links */}
          <nav className="nav-links">
            <a href="#">Politics</a>
            <a href="#">Business</a>
            <a href="#">Sports</a>
            <a href="#">Technology</a>
            <a href="#">Entertainment</a>
            <a href="#">Health</a>
          </nav>

          {/* Right Side Icons */}
          <div className="nav-actions">
            <Search size={20} />
            <Bell size={20} />
            <button className="subscribe-btn">Subscribe</button>
            <User size={20} />
          </div>

        </div>
      </header>

      {/* Breaking News Bar */}
      <div className="breaking-bar">
        <span className="breaking-label">⚡ BREAKING</span>
        <div className="ticker">
          <p>
            India Passes Historic Budget Bill With Overwhelming Majority | 
            India Wins Test Series Against Australia 3-1 | 
            Sensex Surges 800 Points
          </p>
        </div>
      </div>
    </>
  );
};

export default UserNavbar;