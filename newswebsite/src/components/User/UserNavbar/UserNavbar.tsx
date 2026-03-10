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

  // 👇 Added a ref to control the search input focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const now = new Date();
    setWeekday(now.toLocaleDateString("en-US", { weekday: "long" }));
    setDate(now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }));
  }, []);

  // 👇 Effect to automatically focus the input when the search bar opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

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
              {headlines.map((headline, index) => (
                <React.Fragment key={`first-${index}`}>
                  <span className="ticker-text">{headline}</span>
                  <span className="ticker-separator">|</span>
                </React.Fragment>
              ))}
              {headlines.map((headline, index) => (
                <React.Fragment key={`second-${index}`}>
                  <span className="ticker-text">{headline}</span>
                  <span className="ticker-separator">|</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="breaking-search">
            <span className="breaking-date">
              {weekday}, <br />
              {date}
            </span>
          </div>
        </div>
      </div>

      {/* Top Navigation */}
      <header className="navbar">
        <div className="navbar-container">
          
          <div className="navbar-left">
            <button className="hamburger-btn" onClick={toggleMobileMenu}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div 
              className={`menu-overlay ${mobileMenuOpen ? 'open' : ''}`} 
              onClick={() => setMobileMenuOpen(false)}
            ></div>

            {/* Locked Pop-out Logo */}
          <div className="logo">
            <NavLink to="/">
              <img src={logo} alt="Local Newz Logo" className="navbar-logo-img" />
            </NavLink>
          </div>

          {/* 👇 2. Replace <a> tags with <NavLink to="..."> */}
          <nav className="nav-links">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/category/politics">Politics</NavLink>
            <NavLink to="/category/business">Business</NavLink>
            <NavLink to="/category/sports">Sports</NavLink>
            <NavLink to="/category/technology">Technology</NavLink>
              {/* Extra categories that don't fit on the main bar */}
          </nav>

          {/* 👇 Do the same for your mobile menu! */}
          {/* The Hamburger Menu Dropdown */}
            <div className={`hamburger-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
              {/* These show up on mobile to replace the main navbar */}
              <NavLink to="/" className="mobile-link">Home</NavLink>
              <NavLink to="/category/politics" className="mobile-link">Politics</NavLink>
              <NavLink to="/category/business" className="mobile-link">Business</NavLink>
              <NavLink to="/category/sports" className="mobile-link">Sports</NavLink>
              <NavLink to="/category/technology" className="mobile-link">Technology</NavLink>
              
              {/* Extra categories that don't fit on the main bar */}
              <NavLink to="/category/entertainment">Entertainment</NavLink>
              <NavLink to="/category/health">Health</NavLink>
              <NavLink to="/category/world">World</NavLink>

              {/* 👇 Added a visual divider */}
              <div className="dropdown-divider"></div>

              {/* 👇 Added your new Company pages here! */}
              <NavLink to="/about">About Us</NavLink>
              <NavLink to="/contact">Contact Us</NavLink>
              <NavLink to="/privacy-policy">Privacy Policy</NavLink>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="nav-actions">
            
            <div className="search-container">
              {/* This is the Search icon you click to open */}
              <button 
                className="open-search-btn" 
                onClick={() => setIsSearchOpen(true)}
                style={{ opacity: isSearchOpen ? 0 : 1, pointerEvents: isSearchOpen ? 'none' : 'auto' }}
              >
                <Search size={20} />
              </button>

              {/* This is the expanding input with the X securely inside it */}
              <div className={`search-bar-expandable ${isSearchOpen ? 'open' : ''}`}>
                <input 
                  type="text" 
                  placeholder="Search news..." 
                  ref={searchInputRef} 
                />
                <button 
                  className="close-search-btn" 
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Restored your Bell and User icons exactly as they were! */}
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