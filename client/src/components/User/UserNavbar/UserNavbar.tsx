// client/src/components/User/UserNavbar/UserNavbar.tsx
// ──────────────────────────────────────────────────────────────
// User state is kept in React state only (no localStorage).
// On mount, getMe() is called with the httpOnly cookie to rehydrate.

import React, { useState, useEffect, useRef } from "react";
import "./UserNavbar.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, User, Menu, X, Search, ChevronDown, LogOut } from "lucide-react";
import logo from "../../../assets/Logo.png";
import { useCategories } from "../../../hooks/useCategories";
import { useAuth } from "../../../context/AuthContext";

import type { Category } from "../../../types/category";
import { getBreakingTickerNews } from "../../../api/news";

const UserNavbar: React.FC = () => {
  const {
    user,
    openLogin,
    logout,
  } = useAuth();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const { categories } = useCategories();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [mobileMenuOpen,    setMobileMenuOpen]    = useState(false);
  const [isSearchOpen,      setIsSearchOpen]      = useState(false);
  const [weekday,           setWeekday]           = useState("");
  const [date,              setDate]              = useState("");
  const [openDropdown,      setOpenDropdown]      = useState<string | null>(null);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);

  const searchInputRef   = useRef<HTMLInputElement>(null);
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [headlines, setHeadlines] = useState<string[]>([]);

  useEffect(() => {
    const fetchTickerNews = async () => {
      try {
        const data = await getBreakingTickerNews();
        setHeadlines(data.headlines || []);
      } catch (error) {
        console.error("Failed to fetch ticker news:", error);
      }
    };
    fetchTickerNews();
  }, []);

  // ── Date ────────────────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    setWeekday(now.toLocaleDateString("en-US", { weekday: "long" }));
    setDate(now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  }, []);

  // ── Focus search ─────────────────────────────────────────────
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // ── Click outside profile dropdown ───────────────────────────
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Mobile category highlight ────────────────────────────────
  useEffect(() => {
    const currentSlug = location.pathname.split("/").pop();
    if (currentSlug && location.pathname.includes("/category/")) {
      const activeCategory = categories.find(c => c.slug === currentSlug);
      if (activeCategory) {
        setExpandedMobileCat(
          activeCategory.parentId != null
            ? String(activeCategory.parentId)
            : String(activeCategory.id)
        );
      }
    }
  }, [location.pathname, categories]);

  // ── Logout ───────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate("/");
  };

  // ── Nav helpers ───────────────────────────────────────────────
  const childrenOf = (parentId: string): Category[] =>
    categories.filter(c => String(c.parentId) === parentId && c.enabled);

  const featuredTopLevel = categories.filter(c => !c.parentId && c.enabled && c.featured);
  const allTopLevel      = categories.filter(c => !c.parentId && c.enabled);

  const handleMouseEnter = (id: string) => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setOpenDropdown(id);
  };

  const handleMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const handleSubscribeClick = () => {
    const el = document.querySelector(".site-footer") || document.querySelector("footer");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleMobileCat = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setExpandedMobileCat(prev => (prev === id ? null : id));
  };

  const handleProfileClick = () => {
    setIsProfileOpen(false);
    window.open("/profile", "_blank", "noopener,noreferrer");
  };

  // 👇 EXPERT FIX: Function to inject tag text into search bar 👇
  const handleTagClick = (tagText: string) => {
    if (searchInputRef.current) {
      searchInputRef.current.value = tagText; // Injects the text
      searchInputRef.current.focus(); // Places cursor in the box
    }
  };

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div className="navbar-wrapper">

      {/* ── BREAKING BAR ────────────────────────── */}
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
          <span className="breaking-date">
            {weekday},<br />
            {date}
          </span>
        </div>
      </div>

      {/* ── MAIN NAVBAR ─────────────────────────── */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <button
              className="hamburger-btn-xx"
              onClick={() => setMobileMenuOpen(true)}
              style={{ opacity: mobileMenuOpen ? 0 : 1, visibility: mobileMenuOpen ? "hidden" : "visible" }}
            >
              <Menu size={28} />
            </button>

            <div className={`menu-overlay${mobileMenuOpen ? " open" : ""}`} onClick={() => setMobileMenuOpen(false)} />

            <div className="logo">
              <NavLink to="/" onClick={handleHomeClick}>
                <img src={logo} alt="Local Newz Logo" className="navbar-logo-img" />
              </NavLink>
            </div>

            {/* ── DESKTOP NAV ─────────────────── */}
            <nav className="nav-links">
              <NavLink to="/" end onClick={handleHomeClick}>Home</NavLink>

              {featuredTopLevel.map(cat => {
                const catId       = String(cat.id);
                const children    = childrenOf(catId);
                const hasChildren = children.length > 0;

                return (
                  <div
                    key={catId}
                    className="nav-item-wrapper"
                    onMouseEnter={() => handleMouseEnter(catId)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <NavLink
                      to={`/category/${cat.slug}`}
                      className={({ isActive }) => isActive ? "active" : ""}
                    >
                      {cat.name}
                      {hasChildren && <ChevronDown size={14} style={{ marginLeft: 3 }} />}
                    </NavLink>

                    {hasChildren && openDropdown === catId && (
                      <div className="nav-dropdown">
                        {children.map(child => (
                          <NavLink
                            key={String(child.id)}
                            to={`/category/${child.slug}`}
                            className="nav-dropdown-item"
                          >
                            {child.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* ── MOBILE DRAWER ───────────────── */}
            <div className={`hamburger-dropdown${mobileMenuOpen ? " open" : ""}`}>
              <button className="close-drawer-btn" onClick={() => setMobileMenuOpen(false)}>
                <X size={26} />
              </button>

              <NavLink to="/" className="mobile-link" onClick={e => { setMobileMenuOpen(false); handleHomeClick(e); }}>
                Home
              </NavLink>

              {allTopLevel.map(cat => {
                const catId       = String(cat.id);
                const children    = childrenOf(catId);
                const hasChildren = children.length > 0;
                const isExpanded  = expandedMobileCat === catId;

                const isActiveGroup =
                  location.pathname === `/category/${cat.slug}` ||
                  children.some(c => location.pathname === `/category/${c.slug}`);

                return (
                  <div key={catId} className="mobile-cat-group">
                    <div className={`mobile-cat-header ${isActiveGroup ? "active-group" : ""}`}>
                      <NavLink
                        to={`/category/${cat.slug}`}
                        className="mobile-link mobile-link--parent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.name}
                      </NavLink>
                      {hasChildren && (
                        <button className="mobile-expand-btn" onClick={e => toggleMobileCat(catId, e)}>
                          <ChevronDown size={18} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }} />
                        </button>
                      )}
                    </div>
                    {hasChildren && (
                      <div className={`mobile-subcats-grid ${isExpanded ? "open" : ""}`}>
                        {children.map(child => (
                          <NavLink
                            key={String(child.id)}
                            to={`/category/${child.slug}`}
                            className="mobile-sub-link"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="mobile-sub-dash">•</span> {child.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <NavLink to="/Topic"   className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Topic</NavLink>
              <div className="dropdown-divider" />
              <NavLink to="/about"   className="mobile-link" onClick={() => setMobileMenuOpen(false)}>About Us</NavLink>
              <NavLink to="/contact" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Contact Us</NavLink>
              <NavLink to="/"        className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Advertise With Us</NavLink>
            </div>
          </div>

          {/* ── RIGHT ACTIONS ─────────────────── */}
          <div className="nav-actions">
            
            {/* ── SEARCH TOGGLE BUTTON ── */}
            <button
              className="open-search-btn"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Search"
            >
              {isSearchOpen ? <X size={24} /> : <Search size={22} />}
            </button>

            {/* Bell */}
            <div className="notification-wrapper">
              <Bell size={20} />
              <span className="notification-dot" />
            </div>

            {/* Subscribe */}
            <button className="subscribe-btn" onClick={handleSubscribeClick}>Subscribe</button>

            {/* Profile / Sign-in */}
            {user ? (
              <div className="nav-profile-container" ref={profileDropdownRef}>
                <button
                  className={`nav-profile-btn ${isProfileOpen ? "active" : ""}`}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="nav-avatar">
                    {user.profilePic
                      ? <img src={user.profilePic} alt="Profile" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      : user.name
                          .split(" ")
                          .map(word => word[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                  </div>
                  <span className="nav-username">{user.name}</span>
                </button>

                {isProfileOpen && (
                  <div className="profile-dropdown-menu">
                    <div className="pd-header">
                      <span className="pd-name">{user.name}</span>
                      <span className="pd-email">{user.email}</span>
                    </div>
                    <div className="pd-divider" />
                    <button className="pd-item" onClick={handleProfileClick}>
                      <User size={16} /><span>Profile</span>
                    </button>
                    <div className="pd-divider" />
                    <button className="pd-item pd-logout" onClick={handleLogout}>
                      <LogOut size={16} /><span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="nav-signin-btn" onClick={openLogin}>
                <User size={16} /><span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* ── MEGA SEARCH DROP-DOWN PANEL ── */}
        <div className={`search-mega-panel ${isSearchOpen ? "open" : ""}`}>
          <div className="smp-container">
            <div className="smp-input-group">
              <div className="smp-input-wrapper">
                <Search size={20} className="smp-icon" />
                <input 
                  type="text" 
                  placeholder="Search for latest news, topics, or events..." 
                  ref={searchInputRef}
                />
              </div>
              <button className="smp-submit-btn">Search</button>
            </div>
            
            <div className="smp-trending">
              <span className="smp-trending-label">Trending:</span>
              <div className="smp-tags">
                {/* 👇 Added onClick handlers to all tags 👇 */}
                <span className="smp-tag" onClick={() => handleTagClick("Jharkhand Weather")}>Jharkhand Weather</span>
                <span className="smp-tag" onClick={() => handleTagClick("Stock Market Update")}>Stock Market Update</span>
                <span className="smp-tag" onClick={() => handleTagClick("Elections 2026")}>Elections 2026</span>
                <span className="smp-tag" onClick={() => handleTagClick("Technology")}>Technology</span>
                <span className="smp-tag" onClick={() => handleTagClick("Bollywood")}>Bollywood</span>
              </div>
            </div>
          </div>
        </div>
        
      </header>
    </div>
  );
};

export default UserNavbar;