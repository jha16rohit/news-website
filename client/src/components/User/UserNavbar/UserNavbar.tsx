import React, { useState, useEffect, useRef } from "react";
import "./UserNavbar.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, User, Menu, X, Search, ChevronDown, LogOut } from "lucide-react";
import logo from "../../../assets/Logo.png";
import { useNews } from "../../Admin/NewsStore/NewsStore";
import type { Category } from "../../Admin/NewsStore/NewsStore";
import SignIn from "./SignIn/SignIn";

const UserNavbar: React.FC = () => {
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const [user, setUser] = useState<{
    name: string;
    initials: string;
    email: string;
    phone?: string;
    profilePic?: string | null;
  } | null>(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const { categories } = useNews();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen,    setMobileMenuOpen]    = useState(false);
  const [isSearchOpen,      setIsSearchOpen]      = useState(false);
  const [weekday,           setWeekday]           = useState("");
  const [date,              setDate]              = useState("");

  // ✅ FIX: Use string | null to match Category.id type (string)
  const [openDropdown,      setOpenDropdown]      = useState<string | null>(null);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const currentSlug = location.pathname.split("/").pop();
    if (currentSlug && location.pathname.includes("/category/")) {
      const activeCategory = categories.find(c => slugOf(c.name) === currentSlug);
      if (activeCategory) {
        // ✅ FIX: parentId is string, cast safely
        setExpandedMobileCat(
          activeCategory.parentId != null
            ? String(activeCategory.parentId)
            : String(activeCategory.id)
        );
      }
    }
  }, [location.pathname, categories]);

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem("localNewzUser");
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };
    loadUser();
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const handleLoginSuccess = (
    enteredName: string,
    enteredEmail: string,
    enteredPhone?: string
  ) => {
    const words = enteredName.trim().split(" ");
    let calculatedInitials = "U";
    if (words.length > 1) {
      calculatedInitials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
    } else if (words[0].length > 0) {
      calculatedInitials = words[0].substring(0, 2).toUpperCase();
    }
    const newUser = {
      name: enteredName,
      initials: calculatedInitials,
      email: enteredEmail,
      phone: enteredPhone || "+91 00000 00000",
      profilePic: null,
    };
    setUser(newUser);
    localStorage.setItem("localNewzUser", JSON.stringify(newUser));
    setIsSignInOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setIsProfileOpen(false);
    localStorage.removeItem("localNewzUser");
    navigate("/");
  };

  const headlines = [
    "India Passes Historic Budget Bill With Overwhelming Majority",
    "India Wins Test Series Against Australia 3-1",
    "Sensex Surges 800 Points As Foreign Investors Pour In Record Capital",
    "PM Modi Meets World Leaders",
  ];

  const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  // ✅ FIX: Compare string to string
  const childrenOf = (parentId: string): Category[] =>
    categories.filter(c => String(c.parentId) === parentId && c.enabled);

  const featuredTopLevel = categories.filter(c => !c.parentId && c.enabled && c.featured);
  const allTopLevel      = categories.filter(c => !c.parentId && c.enabled);

  // ✅ FIX: id is string
  const handleMouseEnter = (id: string) => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setOpenDropdown(id);
  };

  const handleMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const handleSubscribeClick = () => {
    const footerElement =
      document.querySelector(".site-footer") || document.querySelector("footer");
    if (footerElement) footerElement.scrollIntoView({ behavior: "smooth" });
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  // ✅ FIX: id is string
  const toggleMobileCat = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setExpandedMobileCat(prev => (prev === id ? null : id));
  };

  // ✅ NEW: Open profile in a new tab
  const handleProfileClick = () => {
    setIsProfileOpen(false);
    window.open("/profile", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="navbar-wrapper">
      {/* ── BREAKING BAR ─────────────────────────── */}
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

      {/* ── MAIN NAVBAR ──────────────────────────── */}
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
              <NavLink to="/" onClick={handleHomeClick}>
                <img src={logo} alt="Local Newz Logo" className="navbar-logo-img" />
              </NavLink>
            </div>

            {/* ── DESKTOP NAV ───────────────────── */}
            <nav className="nav-links">
              <NavLink to="/" end onClick={handleHomeClick}>
                Home
              </NavLink>

              {featuredTopLevel.map(cat => {
                // ✅ FIX: cast id to string for consistent comparison
                const catId      = String(cat.id);
                const children   = childrenOf(catId);
                const hasChildren = children.length > 0;

                return (
                  <div
                    key={catId}
                    className={`nav-item${hasChildren ? " nav-item--has-dropdown" : ""}`}
                    onMouseEnter={() => hasChildren && handleMouseEnter(catId)}
                    onMouseLeave={hasChildren ? handleMouseLeave : undefined}
                  >
                    <NavLink
                      to={`/category/${slugOf(cat.name)}`}
                      className="nav-link-inner"
                    >
                      {cat.name}
                      {hasChildren && (
                        <ChevronDown size={12} className="nav-chevron" />
                      )}
                    </NavLink>

                    {/* ✅ FIX: compare string to string */}
                    {hasChildren && openDropdown === catId && (
                      <div
                        className="nav-dropdown"
                        onMouseEnter={() => handleMouseEnter(catId)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {children.map(child => (
                          <NavLink
                            key={String(child.id)}
                            to={`/category/${slugOf(child.name)}`}
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

            {/* ── MOBILE DRAWER ─────────────────── */}
            <div className={`hamburger-dropdown${mobileMenuOpen ? " open" : ""}`}>
              <button
                className="close-drawer-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={26} />
              </button>

              <NavLink
                to="/"
                className="mobile-link"
                onClick={e => { setMobileMenuOpen(false); handleHomeClick(e); }}
              >
                Home
              </NavLink>

              {allTopLevel.map(cat => {
                const catId      = String(cat.id);
                const children   = childrenOf(catId);
                const hasChildren = children.length > 0;
                // ✅ FIX: compare string to string
                const isExpanded  = expandedMobileCat === catId;

                const isActiveGroup =
                  location.pathname === `/category/${slugOf(cat.name)}` ||
                  children.some(
                    child => location.pathname === `/category/${slugOf(child.name)}`
                  );

                return (
                  <div key={catId} className="mobile-cat-group">
                    <div
                      className={`mobile-cat-header ${isActiveGroup ? "active-group" : ""}`}
                    >
                      <NavLink
                        to={`/category/${slugOf(cat.name)}`}
                        className="mobile-link mobile-link--parent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.name}
                      </NavLink>

                      {hasChildren && (
                        <button
                          className="mobile-expand-btn"
                          // ✅ FIX: pass string id
                          onClick={e => toggleMobileCat(catId, e)}
                        >
                          <ChevronDown
                            size={18}
                            style={{
                              transform:  isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.3s ease",
                            }}
                          />
                        </button>
                      )}
                    </div>

                    {hasChildren && (
                      <div className={`mobile-subcats-grid ${isExpanded ? "open" : ""}`}>
                        {children.map(child => (
                          <NavLink
                            key={String(child.id)}
                            to={`/category/${slugOf(child.name)}`}
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

              <NavLink
                to="/Topic"
                className="mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Topic
              </NavLink>
              <div className="dropdown-divider" />
              <NavLink
                to="/about"
                className="mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </NavLink>
              <NavLink
                to="/contact"
                className="mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </NavLink>
              <NavLink
                to="/"
                className="mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Advertise With Us
              </NavLink>
            </div>
          </div>

          {/* ── RIGHT ACTIONS ───────────────────── */}
          <div className="nav-actions">
            {/* Search */}
            <div className="search-container">
              <button
                className="open-search-btn"
                onClick={() => setIsSearchOpen(true)}
                style={{
                  opacity:       isSearchOpen ? 0 : 1,
                  pointerEvents: isSearchOpen ? "none" : "auto",
                }}
              >
                <Search size={20} />
              </button>
              <div className={`search-bar-expandable${isSearchOpen ? " open" : ""}`}>
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

            {/* Bell */}
            <div className="notification-wrapper">
              <Bell size={20} />
              <span className="notification-dot" />
            </div>

            {/* Subscribe */}
            <button className="subscribe-btn" onClick={handleSubscribeClick}>
              Subscribe
            </button>

            {/* Profile / Sign-in */}
            {user ? (
              <div className="nav-profile-container" ref={profileDropdownRef}>
                <button
                  className={`nav-profile-btn ${isProfileOpen ? "active" : ""}`}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="nav-avatar">
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt="Profile"
                        style={{
                          width: "100%", height: "100%",
                          borderRadius: "50%", objectFit: "cover",
                        }}
                      />
                    ) : (
                      user.initials
                    )}
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

                    {/* ✅ NEW: Opens profile in a new tab */}
                    <button
                      className="pd-item"
                      onClick={handleProfileClick}
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </button>

                    <div className="pd-divider" />

                    <button className="pd-item pd-logout" onClick={handleLogout}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="nav-signin-btn"
                onClick={() => setIsSignInOpen(true)}
              >
                <User size={16} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {isSignInOpen && (
        <SignIn
          onClose={() => setIsSignInOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
};

export default UserNavbar;