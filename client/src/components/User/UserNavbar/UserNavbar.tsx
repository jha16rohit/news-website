import React, { useState, useEffect, useRef } from "react";
import "./UserNavbar.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, User, Menu, X, Search, ChevronDown } from "lucide-react";
import logo from "../../../assets/Logo.png";
import { useNews } from "../../Admin/NewsStore/NewsStore";
import type { Category } from "../../Admin/NewsStore/NewsStore";

const UserNavbar: React.FC = () => {
  const { categories } = useNews();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen,   setIsSearchOpen]   = useState(false);
  const [weekday,        setWeekday]        = useState("");
  const [date,           setDate]           = useState("");
  const [openDropdown,   setOpenDropdown]   = useState<number | null>(null);

  const searchInputRef   = useRef<HTMLInputElement>(null);
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    "PM Modi Meets World Leaders",
  ];

  const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  // Returns enabled children of a given parent
  const childrenOf = (parentId: number): Category[] =>
    categories.filter(c => c.parentId === parentId && c.enabled);

  // Featured top-level only → desktop nav
  const featuredTopLevel = categories.filter(c => !c.parentId && c.enabled && c.featured);
  // All enabled top-level → hamburger drawer
  const allTopLevel = categories.filter(c => !c.parentId && c.enabled);

  const handleMouseEnter = (id: number) => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setOpenDropdown(id);
  };

  const handleMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const handleSubscribeClick = () => {
    if (location.pathname === "/") {
      document.getElementById("newsletter-section")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById("newsletter-section")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  };

  return (
    <div className="navbar-wrapper">

      {/* Breaking News Bar */}
      <div className="breaking-bar">
        <div className="breaking-container">
          <span className="breaking-label">BREAKING NEWS</span>
          <div className="ticker">
            <div className="ticker-track">
              {[...headlines, ...headlines].map((h, i) => (
                <React.Fragment key={i}>
                  <span className="ticker-text">{h}</span>
                  <span className="ticker-separator">|</span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <span className="breaking-date">{weekday},<br />{date}</span>
        </div>
      </div>

      {/* Main Navbar */}
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
              className={`menu-overlay${mobileMenuOpen ? " open" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="logo">
              <NavLink to="/">
                <img src={logo} alt="Local Newz Logo" className="navbar-logo-img" />
              </NavLink>
            </div>

            {/* ── Desktop Nav ── */}
            <nav className="nav-links">
              <NavLink
                to="/"
                end
                onClick={e => {
                  if (location.pathname === "/") {
                    e.preventDefault();
                    document.getElementById("hero-section")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Home
              </NavLink>

              {featuredTopLevel.map(cat => {
                const children    = childrenOf(cat.id);
                const hasChildren = children.length > 0;

                return (
                  <div
                    key={cat.id}
                    className={`nav-item${hasChildren ? " nav-item--has-dropdown" : ""}`}
                    onMouseEnter={() => hasChildren && handleMouseEnter(cat.id)}
                    onMouseLeave={hasChildren ? handleMouseLeave : undefined}
                  >
                    <NavLink
                      to={`/category/${slugOf(cat.name)}`}
                      className="nav-link-inner"
                    >
                      {cat.name}
                      {hasChildren && <ChevronDown size={12} className="nav-chevron" />}
                    </NavLink>

                    {/* Dropdown — keep hover alive while cursor moves into it */}
                    {hasChildren && openDropdown === cat.id && (
                      <div
                        className="nav-dropdown"
                        onMouseEnter={() => handleMouseEnter(cat.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {children.map(child => (
                          <NavLink
                            key={child.id}
                            to={`/category/${slugOf(child.name)}`}
                            className="nav-dropdown-item"
                          >
                            <span className="nav-dropdown-dot" style={{ background: child.color }} />
                            {child.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* ── Mobile Drawer ── */}
            <div className={`hamburger-dropdown${mobileMenuOpen ? " open" : ""}`}>
              <button className="close-drawer-btn" onClick={() => setMobileMenuOpen(false)}>
                <X size={26} />
              </button>

              <NavLink
                to="/"
                className="mobile-link"
                onClick={e => {
                  setMobileMenuOpen(false);
                  if (location.pathname === "/") {
                    e.preventDefault();
                    document.getElementById("hero-section")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Home
              </NavLink>

              {allTopLevel.map(cat => {
                const children = childrenOf(cat.id);
                return (
                  <React.Fragment key={cat.id}>
                    {/* Parent link */}
                    <NavLink
                      to={`/category/${slugOf(cat.name)}`}
                      className="mobile-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {cat.name}
                      {children.length > 0 && (
                        <span className="mobile-child-count">{children.length}</span>
                      )}
                    </NavLink>

                    {/* Child links indented below parent */}
                    {children.map(child => (
                      <NavLink
                        key={child.id}
                        to={`/category/${slugOf(child.name)}`}
                        className="mobile-link mobile-link--child"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="mobile-child-dot" style={{ background: child.color }} />
                        {child.name}
                      </NavLink>
                    ))}
                  </React.Fragment>
                );
              })}

              <NavLink to="/Topic" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Topic
              </NavLink>

              <div className="dropdown-divider" />

              <NavLink to="/about"          className="mobile-link" onClick={() => setMobileMenuOpen(false)}>About Us</NavLink>
              <NavLink to="/contact"        className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Contact Us</NavLink>
              <NavLink to="/privacy-policy" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Privacy Policy</NavLink>
            </div>
          </div>

          {/* ── Right Actions ── */}
          <div className="nav-actions">
            <div className="search-container">
              <button
                className="open-search-btn"
                onClick={() => setIsSearchOpen(true)}
                style={{ opacity: isSearchOpen ? 0 : 1, pointerEvents: isSearchOpen ? "none" : "auto" }}
              >
                <Search size={20} />
              </button>
              <div className={`search-bar-expandable${isSearchOpen ? " open" : ""}`}>
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

            <button className="subscribe-btn" onClick={handleSubscribeClick}>Subscribe</button>

            <User size={20} />
          </div>

        </div>
      </header>
    </div>
  );
};

export default UserNavbar;