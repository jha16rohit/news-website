import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, Trash2, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, Monitor, Smartphone } from "lucide-react";
import "./FooterManagement.css";
import {
  fetchFooterSettings,
  saveFooterSettings,
  uploadFooterImageToSupabase,
  deleteFooterImageFromDB,
} from "../../../api/footer";
import type { FooterImage } from "../../../api/footer";
import { FullPageContentPreloader } from "../Preloader/FullPageContentPreloader";

const DEFAULT_DESKTOP_OPACITY = 0.82;
const DEFAULT_MOBILE_OPACITY = 0.90;

const FooterManagement: React.FC = () => {
  const [sectionTitle, setSectionTitle] = useState("STAY UPDATED");
  const [descriptionText, setDescriptionText] = useState("Get the latest headlines and in-depth stories delivered to your inbox.");
  const [trustedText, setTrustedText] = useState("Your trusted source for real-time news and in-depth stories from India and around the world.");
  const [image, setImage] = useState<FooterImage | null>(null);
  const [desktopOverlayOpacity, setDesktopOverlayOpacity] = useState(DEFAULT_DESKTOP_OPACITY);
  const [mobileOverlayOpacity, setMobileOverlayOpacity] = useState(DEFAULT_MOBILE_OPACITY);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" }>({
    visible: false, message: "", type: "success",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchFooterSettings();
        setSectionTitle(data.sectionTitle ?? "STAY UPDATED");
        setDescriptionText(data.descriptionText ?? "");
        setTrustedText(data.trustedText ?? "");
        setDesktopOverlayOpacity(data.desktopOverlayOpacity ?? DEFAULT_DESKTOP_OPACITY);
        setMobileOverlayOpacity(data.mobileOverlayOpacity ?? DEFAULT_MOBILE_OPACITY);
        const activeImg = Array.isArray(data.images) ? data.images.find((img) => img.isActive) : null;
        setImage(activeImg ?? null);
      } catch (err) {
        console.error("Failed to load footer settings:", err);
        showToast("Could not load saved settings.", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ visible: true, message, type });
    toastTimeoutRef.current = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleChooseFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Invalid file type. Allowed: JPEG, PNG, WebP.", "error");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast("File size exceeds 50 MB limit.", "error");
      return;
    }

    setUploading(true);

    const placeholder: FooterImage = {
      id: `temp-${Date.now()}`,
      url: URL.createObjectURL(file),
      name: file.name,
      resolution: "1920 x 1080",
      isActive: true,
    };
    setImage(placeholder);

    try {
      const supabaseUrl = await uploadFooterImageToSupabase(file);

      setImage({
        ...placeholder,
        id: `uploaded-${Date.now()}`,
        url: supabaseUrl,
      });
      showToast(`"${file.name}" uploaded successfully.`, "success");
    } catch (err: any) {
      console.error("Upload failed:", err);
      setImage(null);
      showToast(err?.message || `Failed to upload "${file.name}".`, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!image) return;

    const isSupabaseUrl = image.url.includes("supabase.co") && image.url.includes("footer-images");
    setDeleting(true);

    try {
      if (isSupabaseUrl) await deleteFooterImageFromDB(image.url);
      setImage(null);
      showToast("Background image removed.", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to delete image.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (uploading || deleting) {
      showToast("Please wait for upload/delete to finish.", "error");
      return;
    }
    setSaving(true);
    try {
      await saveFooterSettings({
        sectionTitle,
        descriptionText,
        trustedText,
        images: image ? [image] : [],
        desktopOverlayOpacity,
        mobileOverlayOpacity,
      });
      window.dispatchEvent(new Event("localNewzFooterUpdate"));
      showToast("Footer settings saved successfully!", "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const data = await fetchFooterSettings();
      setSectionTitle(data.sectionTitle ?? "STAY UPDATED");
      setDescriptionText(data.descriptionText ?? "");
      setTrustedText(data.trustedText ?? "");
      setDesktopOverlayOpacity(data.desktopOverlayOpacity ?? DEFAULT_DESKTOP_OPACITY);
      setMobileOverlayOpacity(data.mobileOverlayOpacity ?? DEFAULT_MOBILE_OPACITY);
      const activeImg = Array.isArray(data.images) ? data.images.find((img) => img.isActive) : null;
      setImage(activeImg ?? null);
      showToast("Changes discarded.", "success");
    } catch {
      showToast("Could not reload settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDesktopOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) / 100;
    setDesktopOverlayOpacity(value);
  };

  const handleMobileOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) / 100;
    setMobileOverlayOpacity(value);
  };

 

  const getPreviewOverlayOpacity = () => {
    return previewMode === "desktop" ? desktopOverlayOpacity : mobileOverlayOpacity;
  };

  if (loading) {
    return <FullPageContentPreloader message="Loading footer settings..." />;
  }


  const previewOpacity = getPreviewOverlayOpacity();

  return (
    <div className="lnz-fm">
      {toast.visible && (
        <div className={`lnz-fm__toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="lnz-fm__header">
        <h2>Footer Management</h2>
      </div>

      <div className="lnz-fm__content">
        <div className="lnz-fm__card lnz-fm__card--inputs">
          <h3 className="lnz-fm__card-title">Stay Updated Section</h3>
          <div className="lnz-fm__form-group">
            <label>Section Title</label>
            <input type="text" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} className="lnz-fm__input" />
          </div>
          <div className="lnz-fm__form-group">
            <label>Description Text</label>
            <textarea value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} className="lnz-fm__textarea" />
          </div>
          <div className="lnz-fm__form-group">
            <label>Trusted Source Text</label>
            <textarea value={trustedText} onChange={(e) => setTrustedText(e.target.value)} className="lnz-fm__textarea" />
          </div>
        </div>

        <div className="lnz-fm__card lnz-fm__card--image">
          <h3 className="lnz-fm__card-title">Footer Background Image</h3>

          <div className="lnz-fm__upload">
            {image ? (
              <div className="lnz-fm__preview">
                <div className="lnz-fm__preview-img-wrapper" style={uploading || deleting ? { opacity: 0.7 } : {}}>
                  <img src={image.url} alt={image.name} />
                  {uploading && (
                    <div className="lnz-fm__overlay">
                      <Loader2 size={28} className="lnz-fm__spin" />
                      <span>Uploading…</span>
                    </div>
                  )}
                  {deleting && (
                    <div className="lnz-fm__overlay">
                      <Loader2 size={28} className="lnz-fm__spin" />
                      <span>Deleting…</span>
                    </div>
                  )}
                </div>
                <div className="lnz-fm__preview-info">
                  <div className="lnz-fm__preview-name">{image.name}</div>
                  <div className="lnz-fm__preview-resolution">{image.resolution}</div>
                </div>
                <div className="lnz-fm__preview-actions">
                  <button
                    type="button"
                    className="lnz-fm__btn lnz-fm__btn--replace"
                    onClick={handleChooseFile}
                    disabled={uploading || deleting}
                  >
                    <UploadCloud size={16} style={{ marginRight: 6 }} />
                    Replace Image
                  </button>
                  <button
                    type="button"
                    className="lnz-fm__btn lnz-fm__btn--delete"
                    onClick={handleDeleteImage}
                    disabled={uploading || deleting}
                  >
                    <Trash2 size={16} style={{ marginRight: 6 }} />
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="lnz-fm__upload-box">
                <ImageIcon size={48} className="lnz-fm__upload-icon" />
                <p className="lnz-fm__upload-text">Upload Footer Background Image</p>
                <p className="lnz-fm__upload-subtext">Recommended: 1920 × 700 or 1920 × 1080 · JPG, PNG, WebP · Max 50 MB</p>
                <button
                  type="button"
                  className="lnz-fm__btn lnz-fm__btn--upload"
                  onClick={handleChooseFile}
                  disabled={uploading}
                >
                  Choose File
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: "none" }}
            />
          </div>

          <p className="lnz-fm__hint">
            The uploaded image becomes the footer background. If no image is set, a solid dark background is used.
          </p>
        </div>

        <div className="lnz-fm__card lnz-fm__card--overlay">
          <h3 className="lnz-fm__card-title">Background Overlay</h3>

          <div className="lnz-fm__overlay-controls">
            <div className="lnz-fm__overlay-group">
              <div className="lnz-fm__overlay-header">
                <label htmlFor="desktop-overlay" className="lnz-fm__overlay-label">
                  <Monitor size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
                  Desktop Overlay
                </label>
                <span className="lnz-fm__overlay-value" aria-live="polite">{Math.round(desktopOverlayOpacity * 100)}%</span>
              </div>
              <div className="lnz-fm__slider-wrapper">
                <input
                  id="desktop-overlay"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(desktopOverlayOpacity * 100)}
                  onChange={handleDesktopOpacityChange}
                  className="lnz-fm__slider"
                  aria-label="Desktop footer overlay opacity"
                />
                <div className="lnz-fm__slider-labels">
                  <span>Light</span>
                  <span>Dark</span>
                </div>
              </div>
            </div>

            <div className="lnz-fm__overlay-group">
              <div className="lnz-fm__overlay-header">
                <label htmlFor="mobile-overlay" className="lnz-fm__overlay-label">
                  <Smartphone size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
                  Mobile Overlay
                </label>
                <span className="lnz-fm__overlay-value" aria-live="polite">{Math.round(mobileOverlayOpacity * 100)}%</span>
              </div>
              <div className="lnz-fm__slider-wrapper">
                <input
                  id="mobile-overlay"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(mobileOverlayOpacity * 100)}
                  onChange={handleMobileOpacityChange}
                  className="lnz-fm__slider"
                  aria-label="Mobile footer overlay opacity"
                />
                <div className="lnz-fm__slider-labels">
                  <span>Light</span>
                  <span>Dark</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lnz-fm__card lnz-fm__card--preview">
          <h3 className="lnz-fm__card-title">Live Preview</h3>

          <div className="lnz-fm__preview-mode-toggle" role="tablist" aria-label="Preview mode">
            <button
              type="button"
              role="tab"
              aria-selected={previewMode === "desktop"}
              className={`lnz-fm__preview-tab ${previewMode === "desktop" ? "lnz-fm__preview-tab--active" : ""}`}
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor size={16} style={{ marginRight: 6 }} />
              Desktop
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={previewMode === "mobile"}
              className={`lnz-fm__preview-tab ${previewMode === "mobile" ? "lnz-fm__preview-tab--active" : ""}`}
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone size={16} style={{ marginRight: 6 }} />
              Mobile
            </button>
          </div>

<div
  className="lnz-fm__preview-container"
  style={
    {
      "--preview-overlay-opacity": previewOpacity,
    } as React.CSSProperties
  }
>            <div className={`lnz-fm__preview-footer ${previewMode === "mobile" ? "lnz-fm__preview-footer--mobile" : ""}`}>
              <div className="lnz-fm__preview-overlay">
                <div className="lnz-fm__preview-content">
                  <div className="lnz-fm__preview-main">
                    <div className="lnz-fm__preview-brand">
                      <h4 className="lnz-fm__preview-brand-title">LOCAL NEWZ</h4>
                      <div className="lnz-fm__preview-brand-content">
                        <div className="lnz-fm__preview-logo">
                          <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Local Newz Logo">
                            <rect width="120" height="40" fill="#e60000" rx="4"/>
                            <text x="60" y="28" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-weight="700" font-size="16">LN</text>
                          </svg>
                        </div>
                        <p className="lnz-fm__preview-trusted-text">Your trusted source for accurate and timely news coverage around the clock.</p>
                      </div>
                    </div>

                    <div className="lnz-fm__preview-column">
                      <h5 className="lnz-fm__preview-heading">CATEGORIES</h5>
                      <ul className="lnz-fm__preview-links">
                        <li><span className="lnz-fm__preview-arrow">→</span> होम</li>
                        <li><span className="lnz-fm__preview-arrow">→</span> Politics</li>
                        <li><span className="lnz-fm__preview-arrow">→</span> Business</li>
                        <li><span className="lnz-fm__preview-arrow">→</span> Technology</li>
                        <li><span className="lnz-fm__preview-arrow">→</span> Sports</li>
                      </ul>
                    </div>

                    <div className="lnz-fm__preview-column">
                      <h5 className="lnz-fm__preview-heading">QUICK LINKS</h5>
                      <ul className="lnz-fm__preview-links">
                        <li><span className="lnz-fm__preview-arrow">→</span> About Us</li>
                        <li><span className="lnz-fm__preview-arrow">→</span> Contact Us</li>
                        <li><span className="lnz-fm__preview-arrow">→</span> Advertise With Us</li>
                      </ul>
                    </div>

                    <div className="lnz-fm__preview-column">
                      <h5 className="lnz-fm__preview-heading">STAY UPDATED</h5>
                      <p className="lnz-fm__preview-desc">Get the latest headlines, breaking news, and exclusive updates delivered straight to your inbox.</p>
                      <form className="lnz-fm__preview-form">
                        <div className="lnz-fm__preview-input-group">
                          <input type="email" placeholder="Enter your email" className="lnz-fm__preview-input" />
                          <span className="lnz-fm__preview-mail-icon">✉</span>
                        </div>
                        <button type="button" className="lnz-fm__preview-btn" disabled>Subscribe</button>
                      </form>
                    </div>
                  </div>

                  <hr className="lnz-fm__preview-divider" />

                  <div className="lnz-fm__preview-trending">
                    <h5 className="lnz-fm__preview-trending-title">TRENDING TOPICS</h5>
                    <div className="lnz-fm__preview-tags">
                      {["Breaking News", "Politics", "Economy", "Technology", "Sports", "Entertainment", "Health", "Science", "World", "Local"].map((tag) => (
                        <span key={tag} className="lnz-fm__preview-tag">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  <hr className="lnz-fm__preview-divider" />

                  <div className="lnz-fm__preview-bottom">
                    <p>&copy; Copyright-2026, All Rights Reserved | Local Newz | ShidroTech Solution</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lnz-fm__actions">
          <button className="lnz-fm__btn lnz-fm__btn--cancel" onClick={handleCancel} disabled={saving || uploading || deleting}>
            Cancel
          </button>
          <button className="lnz-fm__btn lnz-fm__btn--save" onClick={handleSave} disabled={saving || uploading || deleting}>
            {saving ? (
              <><Loader2 size={16} className="lnz-fm__spin" style={{ marginRight: 6 }} />Saving…</>
            ) : uploading ? (
              <><Loader2 size={16} className="lnz-fm__spin" style={{ marginRight: 6 }} />Uploading…</>
            ) : deleting ? (
              <><Loader2 size={16} className="lnz-fm__spin" style={{ marginRight: 6 }} />Deleting…</>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FooterManagement;