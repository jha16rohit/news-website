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
  
  const [expandedMobileCat, setExpandedMobileCat] = useState<number | null>(null);

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

  // 👇 NEW EFFECT: Auto-expands the mobile drawer for the active category!
  useEffect(() => {
    const currentSlug = location.pathname.split("/").pop();
    if (currentSlug && location.pathname.includes("/category/")) {
      const activeCategory = categories.find(c => slugOf(c.name) === currentSlug);
      if (activeCategory) {
        // Automatically expands the parent category (or itself if it is a parent)
        setExpandedMobileCat(activeCategory.parentId || activeCategory.id);
      }
    }
  }, [location.pathname, categories]);

  const headlines = [
    "India Passes Historic Budget Bill With Overwhelming Majority",
    "India Wins Test Series Against Australia 3-1",
    "Sensex Surges 800 Points As Foreign Investors Pour In Record Capital",
    "PM Modi Meets World Leaders",
  ];

  const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  const childrenOf = (parentId: number): Category[] =>
    categories.filter(c => c.parentId === parentId && c.enabled);

  const featuredTopLevel = categories.filter(c => !c.parentId && c.enabled && c.featured);
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

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      const hero = document.getElementById("hero-section");
      if (hero) {
        hero.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      window.scrollTo(0, 0);
    }
  };

  const toggleMobileCat = (id: number, e: React.MouseEvent) => {
    e.preventDefault(); 
    setExpandedMobileCat(prev => prev === id ? null : id);
  };

  return (
    <div className="navbar-wrapper">
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

            <nav className="nav-links">
              <NavLink to="/" end onClick={handleHomeClick}>
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
                    <NavLink to={`/category/${slugOf(cat.name)}`} className="nav-link-inner">
                      {cat.name}
                      {hasChildren && <ChevronDown size={12} className="nav-chevron" />}
                    </NavLink>

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
                            {child.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className={`hamburger-dropdown${mobileMenuOpen ? " open" : ""}`}>
              <button className="close-drawer-btn" onClick={() => setMobileMenuOpen(false)}>
                <X size={26} />
              </button>

              <NavLink to="/" className="mobile-link" onClick={e => { setMobileMenuOpen(false); handleHomeClick(e); }}>
                Home
              </NavLink>

              {allTopLevel.map(cat => {
                const children = childrenOf(cat.id);
                const hasChildren = children.length > 0;
                const isExpanded = expandedMobileCat === cat.id;

                // 👇 Checks if the parent OR any child is currently active
                const isActiveGroup = location.pathname === `/category/${slugOf(cat.name)}` ||
                  children.some(child => location.pathname === `/category/${slugOf(child.name)}`);

                return (
                  <div key={cat.id} className="mobile-cat-group">
                    {/* 👇 Applies the active background to the entire wrapper row 👇 */}
                    <div className={`mobile-cat-header ${isActiveGroup ? 'active-group' : ''}`}>
                      <NavLink
                        to={`/category/${slugOf(cat.name)}`}
                        className="mobile-link mobile-link--parent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.name}
                      </NavLink>
                      
                      {hasChildren && (
                        <button className="mobile-expand-btn" onClick={(e) => toggleMobileCat(cat.id, e)}>
                          <ChevronDown 
                            size={18} 
                            style={{ 
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.3s ease"
                            }} 
                          />
                        </button>
                      )}
                    </div>

                    {hasChildren && (
                      <div className={`mobile-subcats-grid ${isExpanded ? "open" : ""}`}>
                        {children.map(child => (
                          <NavLink
                            key={child.id}
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

              <NavLink to="/Topic" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Topic
              </NavLink>

              <div className="dropdown-divider" />

              <NavLink to="/about"          className="mobile-link" onClick={() => setMobileMenuOpen(false)}>About Us</NavLink>
              <NavLink to="/contact"        className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Contact Us</NavLink>
              <NavLink to="/privacy-policy" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Privacy Policy</NavLink>
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