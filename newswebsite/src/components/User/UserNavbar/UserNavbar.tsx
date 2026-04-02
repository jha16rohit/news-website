import React, { useState, useEffect, useRef } from "react";
import "./UserNavbar.css";
import { NavLink } from "react-router-dom";
import { Bell, User, Menu, X, Search } from "lucide-react";
import logo from "../../../assets/Logo.png";
import { useNews } from "../../Admin/NewsStore/NewsStore";

const UserNavbar: React.FC = () => {
  const { categories } = useNews();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen]     = useState(false);
  const [weekday, setWeekday]               = useState("");
  const [date, setDate]                     = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Set current date once on mount
  useEffect(() => {
    const now = new Date();
    setWeekday(now.toLocaleDateString("en-US", { weekday: "long" }));
    setDate(now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  }, []);

  // Focus search input when search bar opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  const headlines = [
    "India Passes Historic Budget Bill With Overwhelming Majority",
    "India Wins Test Series Against Australia 3-1",
    "Sensex Surges 800 Points As Foreign Investors Pour In Record Capital",
    "PM Modi Meets World Leaders",
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
            <button
              className="hamburger-btn-xx"
              onClick={() => setMobileMenuOpen(true)}
              style={{
                opacity:    mobileMenuOpen ? 0 : 1,
                visibility: mobileMenuOpen ? "hidden" : "visible",
              }}
            >
              <Menu size={28} />
            </button>

            <div
              className={`menu-overlay ${mobileMenuOpen ? "open" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="logo">
              <NavLink to="/">
                <img src={logo} alt="Local Newz Logo" className="navbar-logo-img" />
              </NavLink>
            </div>

            {/* Desktop nav — enabled + featured categories only */}
            <nav className="nav-links">
              <NavLink to="/" end>Home</NavLink>

              {categories
                .filter((cat) => cat.enabled && cat.featured)
                .map((cat) => (
                  <NavLink
                    key={cat.id}
                    to={`/category/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {cat.name}
                  </NavLink>
                ))}
            </nav>

            {/* Mobile drawer — all enabled categories */}
            <div className={`hamburger-dropdown ${mobileMenuOpen ? "open" : ""}`}>
              <button className="close-drawer-btn" onClick={() => setMobileMenuOpen(false)}>
                <X size={26} />
              </button>

              <NavLink to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Home
              </NavLink>

              {categories
                .filter((cat) => cat.enabled)
                .map((cat) => (
                  <NavLink
                    key={cat.id}
                    to={`/category/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {cat.name}
                  </NavLink>
                ))}

              <div className="dropdown-divider" />
              <NavLink to="/about"          onClick={() => setMobileMenuOpen(false)}>About Us</NavLink>
              <NavLink to="/contact"        onClick={() => setMobileMenuOpen(false)}>Contact Us</NavLink>
              <NavLink to="/privacy-policy" onClick={() => setMobileMenuOpen(false)}>Privacy Policy</NavLink>
            </div>
          </div>

          <div className="nav-actions">
            <div className="search-container">
              <button
                className="open-search-btn"
                onClick={() => setIsSearchOpen(true)}
                style={{ opacity: isSearchOpen ? 0 : 1, pointerEvents: isSearchOpen ? "none" : "auto" }}
              >
                <Search size={20} />
              </button>
              <div className={`search-bar-expandable ${isSearchOpen ? "open" : ""}`}>
                <input type="text" placeholder="Search news..." ref={searchInputRef} />
                <button className="close-search-btn" onClick={() => setIsSearchOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="notification-wrapper">
              <Bell size={20} />
              <span className="notification-dot" />
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