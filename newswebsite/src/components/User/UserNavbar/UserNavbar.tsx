import React, { useState, useEffect, useRef } from "react";
import "./UserNavbar.css";
import { NavLink } from "react-router-dom";
import { Bell, User, Menu, X, Search } from "lucide-react"; 
import logo from "../../../assets/Logo.png";

const UserNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const [weekday, setWeekday] = useState("");
  const [date, setDate] = useState(""); 
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const now = new Date();
    setWeekday(now.toLocaleDateString("en-US", { weekday: "long" }));
    setDate(now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  const headlines = [
    "India Passes Historic Budget Bill With Overwhelming Majority",
    "India Wins Test Series Against Australia 3-1",
    "Sensex Surges 800 Points As Foreign Investors Pour In Record Capital",
    "PM Modi Meets World Leaders"
  ];

  return (
    <div className="navbar-wrapper">
      
      {/* Breaking News Bar */}
      <div className="breaking-bar">
        <div className="breaking-container">
          <span className="breaking-label">BREAKING NEWS</span>
          <div className="ticker">
            <div className="ticker-track">
              {[...headlines, ...headlines].map((headline, index) => (
                <React.Fragment key={index}>
                  <span className="ticker-text">{headline}</span>
                  <span className="ticker-separator">|</span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="breaking-search">
            <span className="breaking-date">{weekday}, <br />{date}</span>
          </div>
        </div>
      </div>

      {/* Top Navigation */}
      <header className="navbar">
        <div className="navbar-container">
          
          <div className="navbar-left">
            {/* 1. Main Menu Icon (Fades out when drawer opens) */}
            <button 
              className="hamburger-btn" 
              onClick={() => setMobileMenuOpen(true)}
              style={{ opacity: mobileMenuOpen ? 0 : 1, pointerEvents: mobileMenuOpen ? 'none' : 'auto' }}
            >
              <Menu size={24} />
            </button>

            {/* Click outside to close overlay */}
            <div className={`menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

            <div className="logo">
              <NavLink to="/"><img src={logo} alt="Local Newz Logo" className="navbar-logo-img" /></NavLink>
            </div>

            <nav className="nav-links">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/category/politics">Politics</NavLink>
              <NavLink to="/category/business">Business</NavLink>
              <NavLink to="/category/sports">Sports</NavLink>
              <NavLink to="/category/technology">Technology</NavLink>
            </nav>

            {/* Side Drawer */}
            <div className={`hamburger-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
              {/* 👇 2. The "X" Button securely INSIDE the drawer */}
              <button className="close-drawer-btn" onClick={() => setMobileMenuOpen(false)}>
                <X size={26} />
              </button>
              <NavLink to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Home</NavLink>
              <NavLink to="/category/politics" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Politics</NavLink>
              <NavLink to="/category/business" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Business</NavLink>
              <NavLink to="/category/sports" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Sports</NavLink>
              <NavLink to="/category/technology" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Technology</NavLink>
              <NavLink to="/category/entertainment" onClick={() => setMobileMenuOpen(false)}>Entertainment</NavLink>
              <NavLink to="/category/health" onClick={() => setMobileMenuOpen(false)}>Health</NavLink>
              <NavLink to="/category/world" onClick={() => setMobileMenuOpen(false)}>World</NavLink>
              <div className="dropdown-divider"></div>
              <NavLink to="/about" onClick={() => setMobileMenuOpen(false)}>About Us</NavLink>
              <NavLink to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</NavLink>
              <NavLink to="/privacy-policy" onClick={() => setMobileMenuOpen(false)}>Privacy Policy</NavLink>
            </div>
          </div>

          <div className="nav-actions">
            <div className="search-container">
              <button className="open-search-btn" onClick={() => setIsSearchOpen(true)} style={{ opacity: isSearchOpen ? 0 : 1, pointerEvents: isSearchOpen ? 'none' : 'auto' }}>
                <Search size={20} />
              </button>
              <div className={`search-bar-expandable ${isSearchOpen ? 'open' : ''}`}>
                <input type="text" placeholder="Search news..." ref={searchInputRef} />
                <button className="close-search-btn" onClick={() => setIsSearchOpen(false)}><X size={18} /></button>
              </div>
            </div>

            <div className="notification-wrapper">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </div>
            <button className="subscribe-btn">Subscribe</button>
            <User size={20} />
          </div>

        </div>
      </header>
    </div>
  );
};

export default UserNavbar;