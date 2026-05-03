import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, ChevronRight, TrendingUp, Youtube } from "lucide-react";
import { FaXTwitter, FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa6';
import logo from "../../../assets/Logo.png";
import "./UserFooter.css";

import { useNews } from "../../Admin/NewsStore/NewsStore";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface TrendingTag {
  id: string;
  label: string;
  slug: string;
  enabled: boolean;
}

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────
const DEFAULT_FOOTER_DATA = {
  sectionTitle: "STAY UPDATED",
  descriptionText: "Get the latest headlines and in-depth stories delivered to your inbox.",
  trustedText: "Your trusted source for real-time news and in-depth stories from India and around the world.",
  images: [
    { isActive: true, url: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1920" }
  ]
};

const DEFAULT_TRENDING_TAGS: TrendingTag[] = [
  { id: "1", label: "Budget 2026", slug: "budget2026", enabled: true },
  { id: "2", label: "India News", slug: "indianews", enabled: true },
  { id: "3", label: "IPL 2026", slug: "ipl2026", enabled: true },
  { id: "4", label: "Tech Update", slug: "techupdate", enabled: true },
  { id: "5", label: "Stock Market", slug: "stockmarket", enabled: true },
  { id: "6", label: "Web Stories", slug: "webstories", enabled: true },
  { id: "7", label: "Global News", slug: "globalnews", enabled: true },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const Footer: React.FC = () => {
  const [footerData, setFooterData] = useState<any>(DEFAULT_FOOTER_DATA);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>(DEFAULT_TRENDING_TAGS);

  const { categories } = useNews() || { categories: [] };

  // Load footer settings
  useEffect(() => {
    const loadFooterData = () => {
      try {
        const data = localStorage.getItem("localNewzFooterData");
        if (data) setFooterData(JSON.parse(data));
        else setFooterData(DEFAULT_FOOTER_DATA);
      } catch (error) {
        console.error("Failed to load footer data:", error);
      }
    };
    loadFooterData();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "localNewzFooterData") loadFooterData();
    };
    const onCustom = () => loadFooterData();
    window.addEventListener("storage", onStorage);
    window.addEventListener("localNewzFooterUpdate", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("localNewzFooterUpdate", onCustom);
    };
  }, []);

  // Load trending tags (same source as TrendingNews page)
  useEffect(() => {
    const loadTags = () => {
      try {
        const raw = localStorage.getItem("localNewzTrendingTags");
        if (raw) {
          const parsed: TrendingTag[] = JSON.parse(raw);
          const enabled = parsed.filter((t) => t.enabled);
          if (enabled.length > 0) setTrendingTags(enabled);
        }
      } catch (e) {
        console.error("Failed to load trending tags:", e);
      }
    };
    loadTags();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "localNewzTrendingTags") loadTags();
    };
    const onCustom = () => loadTags();
    window.addEventListener("storage", onStorage);
    window.addEventListener("localNewzTrendingTagsUpdate", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("localNewzTrendingTagsUpdate", onCustom);
    };
  }, []);

  const activeImage = footerData?.images?.find((img: any) => img.isActive)?.url;

  // Dynamic categories (same logic as navbar)
  const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
  const featuredCategories = categories.filter((c: any) => !c.parentId && c.enabled && c.featured);
  const displayCategories = (
    featuredCategories.length > 0
      ? featuredCategories
      : categories.filter((c: any) => !c.parentId && c.enabled)
  ).slice(0, 6);

  return (
    <footer
      className={`site-footer ${activeImage ? 'has-bg-image' : 'solid-bg'}`}
      style={activeImage ? { backgroundImage: `url(${activeImage})` } : {}}
    >
      <div className="footer-overlay">
        <div className="footer-container">

          {/* ── SUBSCRIBE BANNER ── */}
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

          {/* ── MAIN GRID ── */}
          <div className="footer-main-grid">

            {/* Brand */}
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
                  <a href="#" className="s-icon fb" aria-label="Facebook"><FaFacebookF size={15} /></a>
                  <a href="#" className="s-icon tw" aria-label="X / Twitter"><FaXTwitter size={15} /></a>
                  <a href="#" className="s-icon yt" aria-label="YouTube"><Youtube size={15} /></a>
                  <a href="#" className="s-icon ig" aria-label="Instagram"><FaInstagram size={15} /></a>
                  <a href="#" className="s-icon wa" aria-label="WhatsApp"><FaWhatsapp size={15} /></a>
                </div>
              </div>
            </div>

            {/* Dynamic Categories */}
            <div className="f-col">
              <h3 className="f-heading">CATEGORIES</h3>
              <ul className="f-links">
                <li>
                  <Link to="/">
                    <ChevronRight size={14} className="f-arrow" /> Home
                  </Link>
                </li>
                {displayCategories.map((cat: any) => (
                  <li key={cat.id}>
                    <Link to={`/category/${slugOf(cat.name)}`}>
                      <ChevronRight size={14} className="f-arrow" /> {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div className="f-col">
              <h3 className="f-heading">QUICK LINKS</h3>
              <ul className="f-links">
                <li><Link to="/about"><ChevronRight size={14} className="f-arrow" /> About Us</Link></li>
                <li><Link to="/contact"><ChevronRight size={14} className="f-arrow" /> Contact Us</Link></li>
                <li><Link to="/advertise"><ChevronRight size={14} className="f-arrow" /> Advertise With Us</Link></li>
              </ul>
            </div>

            {/* Dynamic Trending Topics — driven by admin */}
            <div className="f-col">
              <h3 className="f-heading">TRENDING TOPICS</h3>
              <div className="f-trending-grid">
                {trendingTags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/trending?tag=${tag.slug}`}
                    className="f-trending-tag"
                  >
                    <span>#{tag.label}</span>
                    <TrendingUp size={13} />
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* ── BOTTOM BAR ── */}
          <div className="footer-bottom-bar">
            <p>
              &copy; Copyright-2026, All Rights Reserved | Local Newz | WebWala Studio
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;