import React, { useState, useRef } from "react";
import "./SEOSettings.css";

const SEOSettings: React.FC = () => {
  const [metaTitle, setMetaTitle] = useState(
    "Breaking: Major Policy Reform Announced Today"
  );
  const [focusKeyword, setFocusKeyword] = useState("policy reform");
  const [metaDescription, setMetaDescription] = useState(
    "A comprehensive look at the latest policy reform announced by the government today, covering key changes and their expected impact on citizens."
  );
  const [urlSlug, setUrlSlug] = useState(
    "major-policy-reform-announced-today"
  );
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [allowIndex, setAllowIndex] = useState(true);

  // NEW: Image State
  const [socialImage, setSocialImage] = useState<string | null>(null);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const META_TITLE_LIMIT = 60;
  const META_DESC_LIMIT = 160;
  const baseUrl = "newsroom-zenith.lovable.app/";
  const previewUrl = `https://newsroom-zenith.lovable.app/${urlSlug}`;

  // Handle upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSocialImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="seo-page">
      {/* Page Header */}
      <div className="seo-page-header">
        <div>
          <h1 className="seo-page-title">SEO Settings</h1>
          <p className="seo-page-subtitle">
            Optimize your article for search engines
          </p>
        </div>
        <button className="btn-save-changes">
          Save Changes
        </button>
      </div>

      {/* SEO Card */}
      <div className="seo-card">
        <div className="seo-card-header">
          <div>
            <h2 className="seo-card-title">Search Engine Optimization</h2>
            <p className="seo-card-subtitle">
              Configure how your article appears in search results
            </p>
          </div>
        </div>

        {/* Meta Title */}
        <div className="seo-field">
          <div className="seo-field-labelrow">
            <label className="seo-label">Meta Title</label>
            <span className="seo-char-count">
              {metaTitle.length}/{META_TITLE_LIMIT}
            </span>
          </div>
          <input
            className="seo-input"
            type="text"
            value={metaTitle}
            maxLength={META_TITLE_LIMIT}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </div>

        {/* Focus Keyword */}
        <div className="seo-field">
          <label className="seo-label">Focus Keyword</label>
          <input
            className="seo-input"
            type="text"
            value={focusKeyword}
            onChange={(e) => setFocusKeyword(e.target.value)}
          />
        </div>

        {/* Meta Description */}
        <div className="seo-field">
          <div className="seo-field-labelrow">
            <label className="seo-label">Meta Description</label>
            <span className="seo-char-count">
              {metaDescription.length}/{META_DESC_LIMIT}
            </span>
          </div>
          <textarea
            className="seo-textarea"
            value={metaDescription}
            maxLength={META_DESC_LIMIT}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* URL Slug */}
        <div className="seo-field">
          <label className="seo-label">URL Slug</label>
          <div className="seo-slug-row">
            <span className="seo-slug-base">{baseUrl}</span>
            <input
              className="seo-input seo-slug-input"
              type="text"
              value={urlSlug}
              onChange={(e) => setUrlSlug(e.target.value)}
            />
          </div>
        </div>

        {/* Canonical URL */}
        <div className="seo-field">
          <label className="seo-label">
            Canonical URL{" "}
            <span className="seo-label-optional">(optional)</span>
          </label>
          <input
            className="seo-input"
            type="url"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            placeholder="https://example.com/original-article"
          />
        </div>

        {/* Social Share Image */}
        <div className="seo-field">
          <label className="seo-label">Social Share Image</label>

          {/* Hidden Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div className="seo-upload-box" onClick={handleUploadClick}>
            {socialImage ? (
              <img
                src={socialImage}
                alt="Social Preview"
                className="seo-upload-preview"
              />
            ) : (
              <p className="seo-upload-text">
                Click to upload (1200×630 recommended)
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="seo-divider" />

        {/* Index Toggle */}
        <div className="seo-toggle-row">
          <div>
            <p className="seo-toggle-label">
              Allow search engines to index this article
            </p>
            <p className="seo-toggle-hint">
              When disabled, a noindex tag will be added
            </p>
          </div>
          <button
            className={`seo-toggle ${allowIndex ? "seo-toggle--on" : ""}`}
            onClick={() => setAllowIndex(!allowIndex)}
          >
            <span className="seo-toggle-thumb" />
          </button>
        </div>
      </div>

      {/* Google Search Preview */}
      <div className="seo-card seo-preview-card">
        <div className="seo-card-header">
          <div>
            <h2 className="seo-card-title">Google Search Preview</h2>
            <p className="seo-card-subtitle">
              How your article will appear in search results
            </p>
          </div>
        </div>

        <div className="seo-preview-box">
          <p className="seo-preview-url">{previewUrl}</p>
          <p className="seo-preview-title">
            {metaTitle || "Page Title"}
          </p>
          <p className="seo-preview-desc">
            {metaDescription || "Page description will appear here."}
          </p>

          {/* Social Image Preview */}
          {socialImage && (
            <img
              src={socialImage}
              alt="Social Preview"
              className="seo-preview-image"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SEOSettings;
