import React, { useState, useEffect, useRef } from "react";
import "./UserNavbar.css";
import { NavLink } from "react-router-dom";
import { Bell, User, Menu, X, Search } from "lucide-react"; 
import logo from "../../../assets/Logo.png";

// Interface and Initial Data
export interface Category {
  id: number;
  name: string;
  description: string;
  articles: string;
  views: string;
  featured: boolean;
  enabled: boolean;
  color: string;
}

const initialCategories: Category[] = [
  { id: 1, name: "Politics", description: "National and international political news", articles: "1,245", views: "2.5M", featured: true, enabled: true, color: "#dc2626" },
  { id: 2, name: "Business", description: "Markets, economy, and corporate news", articles: "987", views: "1.9M", featured: true, enabled: true, color: "#2563eb" },
  { id: 3, name: "Sports", description: "Cricket, football, and all sports coverage", articles: "1,567", views: "3.2M", featured: true, enabled: true, color: "#16a34a" },
  { id: 4, name: "Entertainment", description: "Bollywood, Hollywood, and celebrity news", articles: "2,134", views: "4.5M", featured: false, enabled: true, color: "#9333ea" },
  { id: 5, name: "Technology", description: "Tech news, gadgets, and innovations", articles: "1,024", views: "2.1M", featured: true, enabled: true, color: "#0ea5e9" },
];

const UserNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const [weekday, setWeekday] = useState("");
  const [date, setDate] = useState(""); 
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State to hold the dynamic Categories
  const [categories, setCategories] = useState<Category[]>([]);

  // 👇 EFFECT 1: Handles fetching and listening to Categories from Admin Panel
  useEffect(() => {
    const loadLatestCategories = () => {
      try {
        const saved = localStorage.getItem("localNewzCategories");
        if (saved) {
          setCategories(JSON.parse(saved));
        } else {
          setCategories(initialCategories);
        }
      } catch (e) {
        setCategories(initialCategories);
      }
    };

    // Run it immediately when the Navbar first loads
    loadLatestCategories();

    // Start "listening" for changes from the Admin Panel
    window.addEventListener("categoriesUpdated", loadLatestCategories); 
    window.addEventListener("storage", loadLatestCategories); 

    // Clean up the listeners when the component unmounts
    return () => {
      window.removeEventListener("categoriesUpdated", loadLatestCategories);
      window.removeEventListener("storage", loadLatestCategories);
    };
  }, []);

  // 👇 EFFECT 2: Handles setting the current Date and Time
  useEffect(() => {
    const now = new Date();
    setWeekday(now.toLocaleDateString("en-US", { weekday: "long" }));
    setDate(now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  }, []);

  // 👇 EFFECT 3: Handles focusing the search bar
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
            {/* 👇 THE FIX: Bulletproof Hamburger Button */}
            <button 
              className="hamburger-btn" 
              onClick={() => setMobileMenuOpen(true)}
              style={{ 
                opacity: mobileMenuOpen ? 0 : 1, 
                visibility: mobileMenuOpen ? 'hidden' : 'visible'
              }}
            >
              <Menu size={28} />
            </button>

            <div className={`menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

            <div className="logo">
              <NavLink to="/"><img src={logo} alt="Local Newz Logo" className="navbar-logo-img" /></NavLink>
            </div>

            {/* 👇 DYNAMIC MAIN NAVBAR LINKS */}
            <nav className="nav-links">
              <NavLink to="/" end>Home</NavLink>
              
              {/* Only show categories that are BOTH Enabled and Featured */}
              {categories
                .filter(cat => cat.enabled && cat.featured)
                .map(cat => (
                  <NavLink 
                    key={cat.id} 
                    to={`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {cat.name}
                  </NavLink>
                ))}
            </nav>

            {/* 👇 DYNAMIC SIDE DRAWER */}
            <div className={`hamburger-dropdown ${mobileMenuOpen ? 'open' : ''}`}>
              <button className="close-drawer-btn" onClick={() => setMobileMenuOpen(false)}>
                <X size={26} />
              </button>

              <NavLink to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Home</NavLink>
              
              {/* Show ALL Enabled categories in the drawer */}
              {categories
                .filter(cat => cat.enabled)
                .map(cat => (
                  <NavLink 
                    key={cat.id} 
                    to={`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`} 
                    className="mobile-link" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {cat.name}
                  </NavLink>
                ))}

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