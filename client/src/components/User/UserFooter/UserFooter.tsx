import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, ChevronRight, ChevronDown } from "lucide-react";
import logo from "../../../assets/Logo.png";
import "./UserFooter.css";
import { getPublicCategories } from "../../../api/user/categoryNews";
import { getFooterSettings } from "../../../api/user/userfooter";
import type { FooterSettingsData } from "../../../api/user/userfooter";
import { subscribeToNewsletter } from "../../../api/user/newsletter";
import { getTrendingTags, type Tag as TagType } from "../../../api/tags.api";
import { useAuth } from "../../../context/AuthContext";

const DEFAULT_DESKTOP_OPACITY = 0.82;
const DEFAULT_MOBILE_OPACITY = 0.90;

const DEFAULT_FOOTER_DATA: FooterSettingsData = {
  id: "singleton",
  sectionTitle: "STAY UPDATED",
  descriptionText: "Get the latest headlines and in-depth stories delivered to your inbox.",
  trustedText: "Your trusted source for real-time news and in-depth stories from India and around the world.",
  images: [],
  updatedAt: null,
  desktopOverlayOpacity: DEFAULT_DESKTOP_OPACITY,
  mobileOverlayOpacity: DEFAULT_MOBILE_OPACITY,
};

interface ToastState {
  kind: "success" | "error";
  message: string;
}

const Toast: React.FC<{ toast: ToastState | null; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      role="status"
      className="lnz-footer__toast"
      style={{
        background: toast.kind === "success" ? "#16a34a" : "#dc2626",
      }}
    >
      <span>{toast.message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
};

const Footer: React.FC = () => {
  const [footerData, setFooterData] = useState<FooterSettingsData>(DEFAULT_FOOTER_DATA);
  const [categories, setCategories] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<TagType[]>([]);

  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [toast, setToast] = useState<ToastState | null>(null);

  const [isAccordionMode, setIsAccordionMode] = useState(false);

  const [openCategory, setOpenCategory] = useState(false);
  const [openQuickLinks, setOpenQuickLinks] = useState(false);
  const [openStayUpdated, setOpenStayUpdated] = useState(false);
  const [openTrending, setOpenTrending] = useState(false);

  const { isLoggedIn, openLogin } = useAuth();

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      openLogin();
      return;
    }

    const trimmed = subscribeEmail.trim();
    if (!trimmed) {
      setSubscribeStatus("error");
      setToast({ kind: "error", message: "Please enter your email." });
      return;
    }
    setSubscribeStatus("loading");
    try {
      const res = await subscribeToNewsletter(trimmed);
      setSubscribeStatus("success");
      setToast({ kind: "success", message: res.message || "Subscribed! Check your inbox." });
      setSubscribeEmail("");
    } catch (err) {
      setSubscribeStatus("error");
      setToast({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const footer = await getFooterSettings();

        if (Array.isArray(footer.images) && footer.images.length === 0) {
          setFooterData({ ...footer, images: [] });
        } else {
          setFooterData(footer);
        }

        const categoryData = await getPublicCategories();

        setCategories(
          categoryData.categories ||
          categoryData.data ||
          categoryData ||
          []
        );

        const tags = await getTrendingTags();
        setTrendingTags(Array.isArray(tags) ? tags : []);

      } catch (err) {
        console.error("Footer load failed:", err);
      }
    };

    loadData();

    const onAdminSave = () => {
      loadData();
    };

    window.addEventListener("localNewzFooterUpdate", onAdminSave);

    const checkBreakpoint = () => {
      const isAcc = window.innerWidth <= 1024;
      setIsAccordionMode(isAcc);
    };

    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);

    return () => {
      window.removeEventListener("localNewzFooterUpdate", onAdminSave);
      window.removeEventListener("resize", checkBreakpoint);
    };
  }, []);

  const activeImage = footerData.images.find((img) => img.isActive)?.url ?? null;
  const desktopOpacity = footerData.desktopOverlayOpacity ?? DEFAULT_DESKTOP_OPACITY;
  const mobileOpacity = footerData.mobileOverlayOpacity ?? DEFAULT_MOBILE_OPACITY;

  const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
  const featuredCategories = categories.filter((c: any) => !c.parentId && c.enabled && c.featured);
  const displayCategories = (
    featuredCategories.length > 0
      ? featuredCategories
      : categories.filter((c: any) => !c.parentId && c.enabled)
  ).slice(0, 5);

  const [showAllTags, setShowAllTags] = useState(false);
  const displayTags = showAllTags ? trendingTags : trendingTags.slice(0, 12);

  return (
    <footer
      className={`lnz-footer ${activeImage ? "lnz-footer--has-bg" : "lnz-footer--solid"} ${isAccordionMode ? "lnz-footer--accordion" : ""}`}
      style={
  {
    ...(activeImage ? { backgroundImage: `url(${activeImage})` } : {}),
    "--footer-overlay-opacity-desktop": desktopOpacity,
    "--footer-overlay-opacity-mobile": mobileOpacity,
  } as React.CSSProperties
}
    >
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="lnz-footer__overlay">
        <div className="lnz-footer__container">
          <div className="lnz-footer__main">
            {/* BRAND SECTION - Always visible, full width on mobile */}
            <div className="lnz-footer__brand">
              <div className="lnz-footer__brand-wrapper">
                <h4 className="lnz-footer__brand-title">LOCAL NEWZ</h4>
                <div className="lnz-footer__brand-content">
                  <div className="lnz-footer__logo">
                    <Link to="/">
                      <img src={logo} alt="Local Newz Logo" />
                    </Link>
                  </div>
                  <p className="lnz-footer__trusted-text">{footerData.trustedText}</p>
                </div>
              </div>
            </div>

            {/* CATEGORIES ACCORDION */}
            <section className={`lnz-footer__categories ${isAccordionMode ? "lnz-footer__accordion-section" : ""}`}>
              <button
                type="button"
                className={`lnz-footer__accordion-trigger ${!isAccordionMode ? "lnz-footer__accordion-trigger--hidden" : ""}`}
                onClick={() => setOpenCategory(!openCategory)}
                aria-expanded={openCategory}
                aria-controls="categories-content"
                id="categories-trigger"
              >
                <span className="lnz-footer__accordion-label">CATEGORIES</span>
                <ChevronDown size={18} className={`lnz-footer__accordion-icon ${openCategory ? "lnz-footer__accordion-icon--open" : ""}`} />
              </button>
              <div
                id="categories-content"
                className={`lnz-footer__accordion-content ${openCategory || !isAccordionMode ? "lnz-footer__accordion-content--open" : ""}`}
                role="region"
                aria-labelledby="categories-trigger"
                hidden={isAccordionMode && !openCategory}
              >
                <ul className="lnz-footer__links">
                  <li>
                    <Link to="/">
                      <ChevronRight size={14} className="lnz-footer__arrow" /> होम
                    </Link>
                  </li>
                  {displayCategories.map((cat: any) => (
                    <li key={cat.id}>
                      <Link to={`/category/${slugOf(cat.name)}`}>
                        <ChevronRight size={14} className="lnz-footer__arrow" /> {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* QUICK LINKS ACCORDION */}
            <section className={`lnz-footer__quick-links ${isAccordionMode ? "lnz-footer__accordion-section" : ""}`}>
              <button
                type="button"
                className={`lnz-footer__accordion-trigger ${!isAccordionMode ? "lnz-footer__accordion-trigger--hidden" : ""}`}
                onClick={() => setOpenQuickLinks(!openQuickLinks)}
                aria-expanded={openQuickLinks}
                aria-controls="quick-links-content"
                id="quick-links-trigger"
              >
                <span className="lnz-footer__accordion-label">QUICK LINKS</span>
                <ChevronDown size={18} className={`lnz-footer__accordion-icon ${openQuickLinks ? "lnz-footer__accordion-icon--open" : ""}`} />
              </button>
              <div
                id="quick-links-content"
                className={`lnz-footer__accordion-content ${openQuickLinks || !isAccordionMode ? "lnz-footer__accordion-content--open" : ""}`}
                role="region"
                aria-labelledby="quick-links-trigger"
                hidden={isAccordionMode && !openQuickLinks}
              >
                <ul className="lnz-footer__links">
                  <li><Link to="/about"><ChevronRight size={14} className="lnz-footer__arrow" /> About Us</Link></li>
                  <li><Link to="/contact"><ChevronRight size={14} className="lnz-footer__arrow" /> Contact Us</Link></li>
                  <li><Link to="/advertise"><ChevronRight size={14} className="lnz-footer__arrow" /> Advertise With Us</Link></li>
                </ul>
              </div>
            </section>

            {/* STAY UPDATED ACCORDION */}
            <section className={`lnz-footer__subscribe ${isAccordionMode ? "lnz-footer__accordion-section" : ""}`}>
              <button
                type="button"
                className={`lnz-footer__accordion-trigger ${!isAccordionMode ? "lnz-footer__accordion-trigger--hidden" : ""}`}
                onClick={() => setOpenStayUpdated(!openStayUpdated)}
                aria-expanded={openStayUpdated}
                aria-controls="stay-updated-content"
                id="stay-updated-trigger"
              >
                <span className="lnz-footer__accordion-label">{footerData.sectionTitle}</span>
                <ChevronDown size={18} className={`lnz-footer__accordion-icon ${openStayUpdated ? "lnz-footer__accordion-icon--open" : ""}`} />
              </button>
              <div
                id="stay-updated-content"
                className={`lnz-footer__accordion-content ${openStayUpdated || !isAccordionMode ? "lnz-footer__accordion-content--open" : ""}`}
                role="region"
                aria-labelledby="stay-updated-trigger"
                hidden={isAccordionMode && !openStayUpdated}
              >
                <p className="lnz-footer__subscribe-desc">{footerData.descriptionText}</p>
                <form className="lnz-footer__subscribe-form" onSubmit={(e) => { e.preventDefault(); handleSubscribe(); }}>
                  <div className="lnz-footer__input-group">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={subscribeEmail}
                      onChange={(e) => {
                        setSubscribeEmail(e.target.value);
                        if (subscribeStatus === "error") setSubscribeStatus("idle");
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSubscribe(); }}
                      disabled={subscribeStatus === "loading"}
                    />
                    <Mail size={16} className="lnz-footer__mail-icon" />
                  </div>
                  <button
                    type="submit"
                    className="lnz-footer__subscribe-btn"
                    disabled={subscribeStatus === "loading"}
                  >
                    {subscribeStatus === "loading" ? "Subscribing…" : "Subscribe"}
                  </button>
                </form>
              </div>
            </section>
          </div>

          <hr className="lnz-footer__divider" aria-hidden="true" />

          {/* TRENDING TOPICS ACCORDION */}
          <section className={`lnz-footer__trending ${isAccordionMode ? "lnz-footer__accordion-section" : ""}`}>
            {trendingTags.length > 0 && (
              <>
                <button
                  type="button"
                  className={`lnz-footer__accordion-trigger ${!isAccordionMode ? "lnz-footer__accordion-trigger--hidden" : ""}`}
                  onClick={() => setOpenTrending(!openTrending)}
                  aria-expanded={openTrending}
                  aria-controls="trending-content"
                  id="trending-trigger"
                >
                  <span className="lnz-footer__accordion-label">TRENDING TOPICS</span>
                  <ChevronDown size={18} className={`lnz-footer__accordion-icon ${openTrending ? "lnz-footer__accordion-icon--open" : ""}`} />
                </button>
                <div
                  id="trending-content"
                  className={`lnz-footer__accordion-content ${openTrending || !isAccordionMode ? "lnz-footer__accordion-content--open" : ""}`}
                  role="region"
                  aria-labelledby="trending-trigger"
                  hidden={isAccordionMode && !openTrending}
                >
                  <div className="lnz-footer__tags-wrapper">
                    <div className="lnz-footer__tags-grid">
                      {displayTags.map((tag: any) => (
                        <Link key={tag.id ?? tag._id} to={`/tag/${tag.slug}`} className="lnz-footer__tag">
                          <span>#{tag.name}</span>
                        </Link>
                      ))}
                    </div>
                    {trendingTags.length > 12 && (
                      <button
                        type="button"
                        className="lnz-footer__more-btn"
                        onClick={() => setShowAllTags(!showAllTags)}
                      >
                        {showAllTags ? "Show Less" : "+ More Topics"}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>

          <hr className="lnz-footer__divider" aria-hidden="true" />

          <div className="lnz-footer__bottom">
            <p>&copy; Copyright-2026, All Rights Reserved | Local Newz | ShidroTech Solution</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;