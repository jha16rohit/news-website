import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, ChevronRight, TrendingUp, Youtube } from "lucide-react";
import { FaXTwitter, FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa6";
import logo from "../../../assets/Logo.png";
import "./UserFooter.css";
import { getCategories } from "../../../api/category.api";

// import { useNews } from "../../Admin/NewsStore/NewsStore";
import { getFooterSettings } from "../../../api/user/userfooter"; // ← adjust path if needed
import type { FooterSettingsData } from "../../../api/user/userfooter";

// ─── Static trending tags ─────────────────────────────────────────────────────
const MOCK_TAGS = [
  { id: "1", name: "Budget 2026",      slug: "budget-2026"      },
  { id: "2", name: "Election Results", slug: "election-results"  },
  { id: "3", name: "IPL Live",         slug: "ipl-live"          },
  { id: "4", name: "Stock Market",     slug: "stock-market"      },
  { id: "5", name: "Tech Trends",      slug: "tech-trends"       },
  { id: "6", name: "Local News",       slug: "local-news"        },
  { id: "7", name: "Global Affairs",   slug: "global-affairs"    },
  { id: "8", name: "Health & Wellness",slug: "health-wellness"   },
];

// ─── Fallback shown before DB responds ───────────────────────────────────────
const DEFAULT_FOOTER_DATA: FooterSettingsData = {
  id:              "singleton",
  sectionTitle:    "STAY UPDATED",
  descriptionText: "Get the latest headlines and in-depth stories delivered to your inbox.",
  trustedText:     "Your trusted source for real-time news and in-depth stories from India and around the world.",
  images:          [
    {
      id:         "1",
      url:        "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1920",
      name:       "chhath_background.jpg",
      resolution: "1920 x 1080",
      isActive:   true,
    },
  ],
  updatedAt: null,
};

// ─── Component ────────────────────────────────────────────────────────────────
const Footer: React.FC = () => {
  const [footerData, setFooterData] = useState<FooterSettingsData>(DEFAULT_FOOTER_DATA);
  const [categories, setCategories] = useState<any[]>([]);
  

  // ── Fetch from DB on mount ──────────────────────────────────────────────────
  useEffect(() => {
  const loadData = async () => {
    try {
      // Footer Settings
      const footer = await getFooterSettings();

      if (Array.isArray(footer.images) && footer.images.length === 0) {
        setFooterData({ ...footer, images: [] });
      } else {
        setFooterData(footer);
      }

      // Categories
      const categoryData = await getCategories();

      console.log("Categories Response:", categoryData);

      setCategories(
        categoryData.categories ||
        categoryData.data ||
        categoryData ||
        []
      );

    } catch (err) {
      console.error("Footer load failed:", err);
    }
  };

  loadData();

  const onAdminSave = () => {
    loadData();
  };

  window.addEventListener("localNewzFooterUpdate", onAdminSave);

  return () => {
    window.removeEventListener(
      "localNewzFooterUpdate",
      onAdminSave
    );
  };
}, []);

  const activeImage = footerData.images.find((img) => img.isActive)?.url ?? null;

  // ── Dynamic categories (same logic as navbar) ───────────────────────────────
  const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
  const featuredCategories  = categories.filter((c: any) => !c.parentId && c.enabled && c.featured);
  const displayCategories   = (
    featuredCategories.length > 0
      ? featuredCategories
      : categories.filter((c: any) => !c.parentId && c.enabled)
  ).slice(0, 6);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <footer
      className={`site-footer ${activeImage ? "has-bg-image" : "solid-bg"}`}
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

            {/* Trending Topics */}
            <div className="f-col">
              <h3 className="f-heading">TRENDING TOPICS</h3>
              <div className="f-trending-grid">
                {MOCK_TAGS.map((tag) => (
                  <Link key={tag.id} to={`/tag/${tag.slug}`} className="f-trending-tag">
                    <span>#{tag.name}</span>
                    <TrendingUp size={13} />
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* ── BOTTOM BAR ── */}
          <div className="footer-bottom-bar">
            <p>&copy; Copyright-2026, All Rights Reserved | Local Newz | WebWala Studio</p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;