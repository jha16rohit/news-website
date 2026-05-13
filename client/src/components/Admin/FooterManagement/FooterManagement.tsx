import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud, Trash2, ChevronLeft, ChevronRight,
  CheckCircle, AlertCircle, Loader2,
} from "lucide-react";
import "./FooterManagement.css";
import {
  fetchFooterSettings,
  saveFooterSettings,
  uploadFooterImageToSupabase,
  deleteFooterImageFromDB,
} from "../../../api/footer"; // ← adjust path if needed
import type { FooterImage } from "../../../api/footer";

// ─── Component ────────────────────────────────────────────────────────────────
const FooterManagement: React.FC = () => {

  const [sectionTitle,    setSectionTitle]    = useState("STAY UPDATED");
  const [descriptionText, setDescriptionText] = useState("Get the latest headlines and in-depth stories delivered to your inbox.");
  const [trustedText,     setTrustedText]     = useState("Your trusted source for real-time news and in-depth stories from India and around the world.");
  const [images,          setImages]          = useState<FooterImage[]>([]);
  const [uploadingIds,    setUploadingIds]    = useState<Set<string>>(new Set());
  const [deletingIds,     setDeletingIds]     = useState<Set<string>>(new Set());
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" }>({
    visible: false, message: "", type: "success",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);

  // ── Load from DB ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchFooterSettings();
        setSectionTitle(data.sectionTitle    ?? "STAY UPDATED");
        setDescriptionText(data.descriptionText ?? "");
        setTrustedText(data.trustedText     ?? "");
        setImages(Array.isArray(data.images) ? (data.images as FooterImage[]) : []);
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
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3500);
  };

  // ── Open file picker ──────────────────────────────────────────────────────────
  const handleChooseFiles = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Opening file picker...");
    fileInputRef.current?.click();
  };

  // ── Handle file selection ─────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleImageUpload fired", e.target.files);
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    // Reset input so same file can be selected again
    const fileList = Array.from(files);
    e.target.value = "";

    for (const file of fileList) {
      console.log("Uploading file:", file.name, file.size, file.type);

      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // Show placeholder immediately
      const placeholder: FooterImage = {
        id:         tempId,
        url:        URL.createObjectURL(file),
        name:       file.name,
        resolution: "1920 x 1080",
        isActive:   false,
      };

      setImages((prev) => [...prev, placeholder]);
      setUploadingIds((prev) => new Set(prev).add(tempId));

      try {
        console.log("Calling uploadFooterImageToSupabase...");
        const supabaseUrl = await uploadFooterImageToSupabase(file);
        console.log("Upload success, URL:", supabaseUrl);

        setImages((prev) =>
          prev.map((img) =>
            img.id === tempId
              ? { ...img, id: `uploaded-${Date.now()}`, url: supabaseUrl }
              : img
          )
        );
        showToast(`"${file.name}" uploaded successfully.`, "success");
      } catch (err: any) {
        console.error("Upload failed:", err);
        setImages((prev) => prev.filter((img) => img.id !== tempId));
        showToast(err?.message || `Failed to upload "${file.name}".`, "error");
      } finally {
        setUploadingIds((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      }
    }
  };

  // ── Delete image ──────────────────────────────────────────────────────────────
  const handleDeleteImage = async (img: FooterImage) => {
    const isSupabaseUrl = img.url.includes("supabase.co") && img.url.includes("footer-images");
    setDeletingIds((prev) => new Set(prev).add(img.id));
    try {
      if (isSupabaseUrl) await deleteFooterImageFromDB(img.url);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
    } catch (err: any) {
      showToast(err?.message || "Failed to delete image.", "error");
    } finally {
      setDeletingIds((prev) => { const n = new Set(prev); n.delete(img.id); return n; });
    }
  };

  const handleToggleActive = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isActive: img.id === id ? !img.isActive : false }))
    );
  };

  const handleNameChange = (id: string, newName: string) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, name: newName } : img)));
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (uploadingIds.size > 0) {
      showToast("Please wait for all images to finish uploading.", "error");
      return;
    }
    setSaving(true);
    try {
      await saveFooterSettings({ sectionTitle, descriptionText, trustedText, images });
      window.dispatchEvent(new Event("localNewzFooterUpdate"));
      showToast("Footer settings saved successfully!", "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setLoading(true);
    try {
      const data = await fetchFooterSettings();
      setSectionTitle(data.sectionTitle    ?? "STAY UPDATED");
      setDescriptionText(data.descriptionText ?? "");
      setTrustedText(data.trustedText     ?? "");
      setImages(Array.isArray(data.images) ? (data.images as FooterImage[]) : []);
      showToast("Changes discarded.", "success");
    } catch {
      showToast("Could not reload settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  const scrollGallery = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
  };

  const activeImage = images.find((img) => img.isActive);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fm-page">

      {toast.visible && (
        <div className={`fm-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="fm-header">
        <h2>Footer Management</h2>
      </div>

      {loading ? (
        <div className="fm-loading">
          <Loader2 size={36} className="fm-spin" />
          <p>Loading footer settings…</p>
        </div>
      ) : (
        <div className="fm-content">

          <div className="fm-top-row">
            <div className="fm-card fm-inputs-card">
              <h3 className="fm-card-title">Stay Updated Section</h3>
              <div className="fm-form-group">
                <label>Section Title</label>
                <input type="text" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} className="fm-input" />
              </div>
              <div className="fm-form-group">
                <label>Description Text</label>
                <textarea value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} className="fm-textarea" />
              </div>
              <div className="fm-form-group">
                <label>Trusted Source Text</label>
                <textarea value={trustedText} onChange={(e) => setTrustedText(e.target.value)} className="fm-textarea" />
              </div>
            </div>

            <div className="fm-card fm-preview-card">
              <h3 className="fm-card-title">Preview</h3>
              <div
                className="fm-preview-window"
                style={{
                  backgroundImage: activeImage ? `url(${activeImage.url})` : "none",
                  backgroundColor: activeImage ? "transparent" : "#101e36",
                }}
              >
                <div className="fm-preview-overlay">
                  <div className="fm-preview-banner">
                    <div className="fm-preview-left">
                      <div className="fm-preview-title-wrap">
                        <span className="fm-red-dot"></span>
                        <span className="fm-preview-title">{sectionTitle}</span>
                      </div>
                      <div className="fm-preview-divider"></div>
                      <span className="fm-preview-desc">{descriptionText}</span>
                    </div>
                    <div className="fm-preview-right">
                      <div className="fm-preview-input-group">
                        <input type="text" placeholder="Enter your email" disabled />
                        <span className="fm-mail-icon">✉</span>
                      </div>
                      <button className="fm-preview-btn">Subscribe</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Image Gallery ── */}
          <div className="fm-card fm-gallery-card">
            <h3 className="fm-card-title">Footer Background Images</h3>

            <div className="fm-gallery-container">

              {/* ── Upload box — the input is OUTSIDE the clickable div ── */}
              <div className="fm-upload-box">
                <UploadCloud size={32} className="fm-upload-icon" />
                <p className="fm-upload-text">Click to upload or drag and drop</p>
                <p className="fm-upload-subtext">Recommended: 1920 × 1080 px · Up to 50 MB</p>
                {/* Button directly triggers the input */}
                <button
                  type="button"
                  className="fm-upload-btn"
                  onClick={handleChooseFiles}
                >
                  Choose Files
                </button>
              </div>

              {/* Hidden file input — completely separate from the upload box */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                style={{ display: "none" }}
              />

              <div className="fm-gallery-wrapper">
                <button className="fm-scroll-btn left" onClick={() => scrollGallery("left")}>
                  <ChevronLeft size={20} />
                </button>

                <div className="fm-image-list" ref={scrollRef}>
                  {images.length === 0 && (
                    <div style={{ color: "#888", fontSize: 14, padding: "20px", alignSelf: "center" }}>
                      No images yet. Upload one to get started.
                    </div>
                  )}
                  {images.map((img) => {
                    const isUploading = uploadingIds.has(img.id);
                    const isDeleting  = deletingIds.has(img.id);
                    return (
                      <div
                        key={img.id}
                        className={`fm-image-card ${img.isActive ? "active" : ""} ${isUploading || isDeleting ? "fm-image-card--busy" : ""}`}
                      >
                        <div className="fm-img-wrapper">
                          <img src={img.url} alt={img.name} />
                          {isUploading && (
                            <div className="fm-img-overlay">
                              <Loader2 size={28} className="fm-spin" />
                              <span>Uploading…</span>
                            </div>
                          )}
                          {isDeleting && (
                            <div className="fm-img-overlay">
                              <Loader2 size={28} className="fm-spin" />
                              <span>Deleting…</span>
                            </div>
                          )}
                          {img.isActive && !isUploading && (
                            <span className="fm-active-badge">Active</span>
                          )}
                        </div>
                        <div className="fm-img-details">
                          <input
                            type="text"
                            value={img.name}
                            onChange={(e) => handleNameChange(img.id, e.target.value)}
                            className="fm-img-name-input"
                            disabled={isUploading || isDeleting}
                          />
                          <div className="fm-img-controls">
                            <span className="fm-img-res">{img.resolution}</span>
                            <div className="fm-img-actions">
                              <label className={`fm-toggle ${isUploading || isDeleting ? "fm-toggle--disabled" : ""}`}>
                                <input
                                  type="checkbox"
                                  checked={img.isActive}
                                  onChange={() => handleToggleActive(img.id)}
                                  disabled={isUploading || isDeleting}
                                />
                                <span className="fm-slider"></span>
                              </label>
                              <button
                                className="fm-delete-btn"
                                onClick={() => handleDeleteImage(img)}
                                disabled={isUploading || isDeleting}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button className="fm-scroll-btn right" onClick={() => scrollGallery("right")}>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <p className="fm-upload-hint">
              Images are uploaded directly to cloud storage. Turn off all switches to use the solid blue background.
            </p>
          </div>

          <div className="fm-actions">
            <button className="fm-btn-cancel" onClick={handleCancel} disabled={saving || uploadingIds.size > 0}>
              Cancel
            </button>
            <button className="fm-btn-save" onClick={handleSave} disabled={saving || uploadingIds.size > 0}>
              {saving ? (
                <><Loader2 size={16} className="fm-spin" style={{ marginRight: 6 }} />Saving…</>
              ) : uploadingIds.size > 0 ? (
                <><Loader2 size={16} className="fm-spin" style={{ marginRight: 6 }} />Uploading {uploadingIds.size} image{uploadingIds.size > 1 ? "s" : ""}…</>
              ) : "Save Changes"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default FooterManagement;