import React, { useState, useEffect } from "react";
import "./UserNavbar.css";
import { Bell, User, Menu, X } from "lucide-react";
import logo from "../../../assets/Logo.png";

const UserNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [weekday, setWeekday] = useState("");
const [date, setDate] = useState(""); 


useEffect(() => {
  const now = new Date();

  setWeekday(
    now.toLocaleDateString("en-US", { weekday: "long" })
  );

  setDate(
    now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
}, []);

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
    // The wrapper no longer changes classes on scroll
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
            {/* <div className={`search-input-wrapper ${isSearchOpen ? 'open' : ''}`}>
              <input type="text" placeholder="Search news..." autoFocus={isSearchOpen} />
            </div>
            <button 
              className="search-toggle-btn" 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Search"
            >
              {isSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button> */}
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

            {/* Pop-out Logo */}
            <div className="logo">
              <a href="/">
                <img src={logo} alt="Local Newz Logo" className="navbar-logo-img" />
              </a>
            </div>

            <nav className="nav-links">
              <a href="/">Home</a>
              <a href="#">Politics</a>
              <a href="#">Business</a>
              <a href="#">Sports</a>
              <a href="#">Technology</a>
            </nav>

            <div className={`hamburger-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
              <a href="/" className="mobile-link">Home</a>
              <a href="#" className="mobile-link">Politics</a>
              <a href="#" className="mobile-link">Business</a>
              <a href="#" className="mobile-link">Sports</a>
              <a href="#" className="mobile-link">Technology</a>
              <a href="#">Entertainment</a>
              <a href="#">Health</a>
            </div>
          </div>

          <div className="nav-actions">
            <Bell size={20} />
            <button className="subscribe-btn">Subscribe</button>
            <User size={20} />
          </div>

        </div>
      </header>

    </div>
  );
};

export default UserNavbar;