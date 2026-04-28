import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // 👇 Imported Link for proper routing
import { Mail, ChevronRight, TrendingUp, Youtube } from "lucide-react";
import { FaXTwitter, FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa6';
import logo from "../../../assets/Logo.png"; 
import "./UserFooter.css";

// 👇 Imported your news store to grab the live categories!
import { useNews } from "../../Admin/NewsStore/NewsStore"; 

const DEFAULT_FOOTER_DATA = {
  sectionTitle: "STAY UPDATED",
  descriptionText: "Get the latest headlines and in-depth stories delivered to your inbox.",
  trustedText: "Your trusted source for real-time news and in-depth stories from India and around the world.",
  images: [
    { isActive: true, url: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1920" }
  ]
};

const Footer: React.FC = () => {
  const [footerData, setFooterData] = useState<any>(DEFAULT_FOOTER_DATA);
  
  // 👇 Grab categories from your store
  const { categories } = useNews() || { categories: [] };

  useEffect(() => {
    const loadFooterData = () => {
      try {
        const data = localStorage.getItem("localNewzFooterData");
        if (data) {
          setFooterData(JSON.parse(data));
        } else {
          setFooterData(DEFAULT_FOOTER_DATA);
        }
      } catch (error) {
        console.error("Failed to load footer data:", error);
      }
    };

    loadFooterData(); 
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "localNewzFooterData") loadFooterData();
    };
    window.addEventListener("storage", handleStorageChange);
    
    const handleLocalUpdate = () => loadFooterData();
    window.addEventListener("localNewzFooterUpdate", handleLocalUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localNewzFooterUpdate", handleLocalUpdate);
    };
  }, []);

  const activeImage = footerData?.images?.find((img: any) => img.isActive)?.url;

  // 👇 Dynamic Category Logic (Matches Navbar's Top-Level Featured Categories)
  const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
  
  // Filter for top-level featured categories (or just top-level if none are featured), limit to 6 so it doesn't break the layout
  const featuredCategories = categories.filter(c => !c.parentId && c.enabled && c.featured);
  const displayCategories = (featuredCategories.length > 0 ? featuredCategories : categories.filter(c => !c.parentId && c.enabled)).slice(0, 6);

  return (
    <footer 
      className={`site-footer ${activeImage ? 'has-bg-image' : 'solid-bg'}`}
      style={activeImage ? { backgroundImage: `url(${activeImage})` } : {}}
    >
      <div className="footer-overlay">
        <div className="footer-container">
          
          {/* ================= TOP BANNER ================= */}
          <div className="footer-subscribe-banner">
            <div className="fsb-left">
              <div className="fsb-title-wrap">
                <span className="fsb-target-dot"></span>
                <span className="fsb-title">{footerData.sectionTitle}</span>
              </div>
              <div className="fsb-divider"></div>
              <span className="fsb-desc">{footerData.descriptionText}</span>
            </div>
            
            <div className="fsb-right">
              <div className="fsb-input-group">
                <input type="email" placeholder="Enter your email" />
                <Mail size={16} className="fsb-mail-icon" />
              </div>
              <button className="fsb-btn">Subscribe</button>
            </div>
          </div>

          {/* ================= MAIN GRID ================= */}
          <div className="footer-main-grid">
            
            {/* BRAND */}
            <div className="f-col f-brand-col">
              <div className="f-logo">
                <Link to="/">
                  <img src={logo} alt="Local Newz Logo" />
                </Link>
              </div>
              <p className="f-trusted-text">{footerData.trustedText}</p>
              
              <div className="f-socials">
                <span className="f-social-title">Follow Us</span>
                <div className="f-social-icons">
                  <a href="#" className="s-icon fb"><FaFacebookF size={16} /></a>
                  <a href="#" className="s-icon tw"><FaXTwitter size={16} /></a>
                  <a href="#" className="s-icon yt"><Youtube size={16} /></a>
                  <a href="#" className="s-icon ig"><FaInstagram size={16} /></a>
                  <a href="#" className="s-icon wa"><FaWhatsapp size={16} /></a>
                </div>
              </div>
            </div>

            {/* DYNAMIC CATEGORIES */}
            <div className="f-col">
              <h3 className="f-heading">CATEGORIES</h3>
              <ul className="f-links">
                <li><Link to="/"><ChevronRight size={14} className="f-arrow" /> Home</Link></li>
                
                {/* 👇 Now maps directly from your Admin Store! 👇 */}
                {displayCategories.map(cat => (
                  <li key={cat.id}>
                    <Link to={`/category/${slugOf(cat.name)}`}>
                      <ChevronRight size={14} className="f-arrow" /> {cat.name}
                    </Link>
                  </li>
                ))}
                
              </ul>
            </div>

            {/* QUICK LINKS */}
            <div className="f-col">
              <h3 className="f-heading">QUICK LINKS</h3>
              <ul className="f-links">
                <li><Link to="/about"><ChevronRight size={14} className="f-arrow" /> About Us</Link></li>
                <li><Link to="/contact"><ChevronRight size={14} className="f-arrow" /> Contact Us</Link></li>
                <li><Link to="/advertise"><ChevronRight size={14} className="f-arrow" /> Advertise With Us</Link></li>
                <li><Link to="/privacy-policy"><ChevronRight size={14} className="f-arrow" /> Privacy Policy</Link></li>
                <li><Link to="/terms"><ChevronRight size={14} className="f-arrow" /> Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* TRENDING TOPICS */}
            <div className="f-col">
              <h3 className="f-heading">TRENDING TOPICS</h3>
              <div className="f-trending-grid">
                <Link to="/topic" className="f-trending-tag">#Budget2026 <TrendingUp size={14} /></Link>
                <Link to="/topic" className="f-trending-tag">#IndiaNews <TrendingUp size={14} /></Link>
                <Link to="/topic" className="f-trending-tag">#IPL2026 <TrendingUp size={14} /></Link>
                <Link to="/topic" className="f-trending-tag">#TechUpdate <TrendingUp size={14} /></Link>
                <Link to="/topic" className="f-trending-tag">#StockMarket <TrendingUp size={14} /></Link>
                <Link to="/topic" className="f-trending-tag">#WebStories <TrendingUp size={14} /></Link>
                <Link to="/topic" className="f-trending-tag">#GlobalNews <TrendingUp size={14} /></Link>
              </div>
            </div>

          </div>

          <div className="footer-bottom-bar">
            <p>
              © Copyright-2026, All Rights Reserved | Local Newz | <span className="heart">❤️</span> WebWala Studio
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;