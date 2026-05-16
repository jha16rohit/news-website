// client/src/components/User/AdvertiseWithUs/AdvertiseWithUs.tsx
// ──────────────────────────────────────────────────────────────
// Fully wired to real backend. No localStorage.
// On submit → POST /api/advertisements/inquiries → stored in DB → email to admin.

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Home, ChevronRight, Send, CheckCircle,
  Mail, Phone, Image as ImageIcon,
  Link as LinkIcon, Upload, X, Loader2,
} from "lucide-react";
import "./AdvertiseWithUs.css";
import { getAdPageSettings, submitAdInquiry } from "../../../api/user/advertise";
import type { AdPageSettings } from "../../../api/user/advertise";

const PAGE_OPTIONS = [
  { value: "home",          label: "Home Page" },
  { value: "all",           label: "All Pages (Sitewide)" },
  { value: "politics",      label: "Politics" },
  { value: "sports",        label: "Sports" },
  { value: "business",      label: "Business & Finance" },
  { value: "technology",    label: "Technology" },
  { value: "entertainment", label: "Entertainment" },
  { value: "health",        label: "Health & Wellness" },
];

const DURATION_OPTIONS = [
  { value: "7",      label: "7 Days" },
  { value: "14",     label: "14 Days" },
  { value: "30",     label: "30 Days" },
  { value: "90",     label: "3 Months" },
  { value: "custom", label: "Custom" },
];

const DEFAULT_SETTINGS: AdPageSettings = {
  whyEnabled: false, whyPoints: [],
  packagesEnabled: false, packages: [],
  contactEnabled: false,
  contactEmail: "", contactPhone: "", contactNote: "",
};

export default function AdvertiseWithUs() {
  const [settings,    setSettings]    = useState<AdPageSettings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "",
    targetPage: "home", duration: "30", customDays: "", message: "",
    adTitle: "", imageUrl: "", linkUrl: "", adType: "banner", budget: "",
  });
  const [errors,         setErrors]         = useState<Partial<typeof form>>({});
  const [loading,        setLoading]        = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [refId,          setRefId]          = useState("");
  const [apiError,       setApiError]       = useState<string | null>(null);
  const [uploadedFile,   setUploadedFile]   = useState<File | null>(null);
  const [uploadedPreview,setUploadedPreview]= useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sidebar settings from backend
  useEffect(() => {
    getAdPageSettings()
      .then((s: AdPageSettings) => setSettings(s))
      .catch(() => { /* keep defaults */ });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof form])
      setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim())  errs.name  = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
    if (!form.phone.trim()) errs.phone = "Required";
    if (form.duration === "custom" && !form.customDays.trim()) errs.customDays = "Enter number of days";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = ev => setUploadedPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUploadedPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setApiError(null);
    setLoading(true);

    try {
      const res = await submitAdInquiry({
        name:       form.name,
        email:      form.email,
        phone:      form.phone,
        company:    form.company   || undefined,
        message:    form.message   || undefined,
        budget:     form.budget    || undefined,
        targetPage: form.targetPage,
        duration:   form.duration,
        customDays: form.duration === "custom" ? form.customDays : undefined,
        adType:     form.adType,
        imageUrl:   form.imageUrl  || undefined,
        linkUrl:    form.linkUrl   || undefined,
        adTitle:    form.adTitle   || undefined,
      });

      setRefId(res.id.slice(-6).toUpperCase());
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit inquiry. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const hasAnySidebar =
    settings.whyEnabled || settings.packagesEnabled || settings.contactEnabled;

  // ── SUCCESS PAGE ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="awu-success-page">
        <div className="awu-success-card">
          <div className="awu-success-icon"><CheckCircle size={52} /></div>
          <h2>Inquiry Submitted!</h2>
          <p>
            Thanks, <strong>{form.name}</strong>! We'll reach out to{" "}
            <strong>{form.email}</strong> or <strong>{form.phone}</strong> within 24–48 hours.
          </p>
          <div className="awu-success-ref">
            <span>Reference ID</span>
            <code>#ADV-{refId}</code>
          </div>
          <Link to="/" className="awu-btn-home">Back to Home</Link>
        </div>
      </div>
    );
  }

  // ── FORM PAGE ────────────────────────────────────────────────
  return (
    <div className="awu-root">

      {/* HERO */}
      <div className="awu-hero">
        <div className="awu-hero-inner">
          <div className="awu-breadcrumb">
            <Link to="/"><Home size={12} /> Home</Link>
            <ChevronRight size={12} />
            <span>Advertise With Us</span>
          </div>
          <h1>Advertise With Us</h1>
          <p>Fill the form below and our team will get back to you within 24–48 hours.</p>
        </div>
      </div>

      {/* MAIN */}
      <div className={`awu-main ${hasAnySidebar ? "awu-main--with-sidebar" : "awu-main--centered"}`}>

        {/* FORM CARD */}
        <div className="awu-form-card">
          <h2 className="awu-form-title">Send Us Your Inquiry</h2>

          {apiError && (
            <div className="awu-api-error">
              <X size={14} /> {apiError}
            </div>
          )}

          {/* Your Details */}
          <div className="awu-section-label">Your Details</div>
          <div className="awu-row">
            <div className="awu-field">
              <label>Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="Rahul Verma" disabled={loading} />
              {errors.name && <span className="awu-err">{errors.name}</span>}
            </div>
            <div className="awu-field">
              <label>Company / Brand</label>
              <input name="company" value={form.company} onChange={handleChange}
                placeholder="Acme Pvt. Ltd." disabled={loading} />
            </div>
          </div>
          <div className="awu-row">
            <div className="awu-field">
              <label>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" disabled={loading} />
              {errors.email && <span className="awu-err">{errors.email}</span>}
            </div>
            <div className="awu-field">
              <label>Phone *</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="+91 98765 43210" disabled={loading} />
              {errors.phone && <span className="awu-err">{errors.phone}</span>}
            </div>
          </div>

          {/* Campaign */}
          <div className="awu-section-label">Campaign Preference</div>
          <div className="awu-row">
            <div className="awu-field">
              <label>Target Page</label>
              <select name="targetPage" value={form.targetPage} onChange={handleChange} disabled={loading}>
                {PAGE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="awu-field">
              <label>Duration</label>
              <select name="duration" value={form.duration} onChange={handleChange} disabled={loading}>
                {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {form.duration === "custom" && (
            <div className="awu-field">
              <label>Number of Days *</label>
              <input name="customDays" type="number" min="1" value={form.customDays}
                onChange={handleChange} placeholder="e.g. 45" disabled={loading} />
              {errors.customDays && <span className="awu-err">{errors.customDays}</span>}
            </div>
          )}

          <div className="awu-field">
            <label>Budget (Optional)</label>
            <input name="budget" value={form.budget} onChange={handleChange}
              placeholder="e.g. ₹10,000 – ₹20,000" disabled={loading} />
          </div>
          <div className="awu-field">
            <label>Message / Requirements</label>
            <textarea name="message" value={form.message} onChange={handleChange}
              rows={3} placeholder="Tell us about your campaign goals..." disabled={loading} />
          </div>

          {/* Ad Creative */}
          <div className="awu-section-label">
            Ad Creative <span className="awu-section-label-opt">(Optional)</span>
          </div>
          <div className="awu-field">
            <label><ImageIcon size={12} /> Ad Image URL</label>
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange}
              placeholder="https://your-site.com/banner.jpg" disabled={loading} />
            <span className="awu-field-hint">Recommended: 1200×300px. JPG, PNG or WebP.</span>
          </div>
          <div className="awu-field">
            <label><LinkIcon size={12} /> Destination URL</label>
            <input name="linkUrl" value={form.linkUrl} onChange={handleChange}
              placeholder="https://your-site.com/landing-page" disabled={loading} />
            <span className="awu-field-hint">Where users land when they click your ad.</span>
          </div>

          {/* File upload (preview only) */}
          <div className="awu-field">
            <label><Upload size={12} /> Upload Ad Image</label>
            {!uploadedFile ? (
              <div className="awu-upload-zone" onClick={() => fileInputRef.current?.click()}>
                <Upload size={22} />
                <span>Click to upload your ad image</span>
                <em>JPG, PNG, WebP · Max 5MB</em>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
            ) : (
              <div className="awu-upload-preview">
                <img src={uploadedPreview} alt="Uploaded preview" />
                <div className="awu-upload-preview-info">
                  <span className="awu-upload-name">{uploadedFile.name}</span>
                  <span className="awu-upload-size">{(uploadedFile.size / 1024).toFixed(0)} KB</span>
                </div>
                <button className="awu-upload-remove" onClick={removeUploadedFile} title="Remove">
                  <X size={14} />
                </button>
              </div>
            )}
            <span className="awu-field-hint">
              You can also send the file via email after submitting if preferred.
            </span>
          </div>

          <button className="awu-submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><Loader2 size={15} className="spin-icon" /> Submitting…</>
              : <><Send size={15} /> Submit Inquiry</>}
          </button>
        </div>

        {/* SIDEBAR */}
        {hasAnySidebar && (
          <div className="awu-sidebar">
            {settings.whyEnabled && settings.whyPoints.length > 0 && (
              <div className="awu-sidebar-card">
                <h3>Why Advertise With Us?</h3>
                <ul>
                  {settings.whyPoints.map((pt: string, i: number) => (
                    <li key={i}><CheckCircle size={13} /> {pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {settings.packagesEnabled && settings.packages.length > 0 && (
              <div className="awu-sidebar-card">
                <h3>Ad Packages</h3>
                <div className="awu-pkg-list">
                  {settings.packages.map((p: { label: string; price: string }, i: number) => (
                    <div key={i} className="awu-pkg-row">
                      <span>{p.label}</span>
                      <strong>{p.price}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settings.contactEnabled && (
              <div className="awu-sidebar-card">
                <h3>Quick Contact</h3>
                {settings.contactNote && (
                  <p className="awu-contact-note">{settings.contactNote}</p>
                )}
                {settings.contactEmail && (
                  <a href={`mailto:${settings.contactEmail}`} className="awu-contact-link">
                    <Mail size={13} /> {settings.contactEmail}
                  </a>
                )}
                {settings.contactPhone && (
                  <a href={`tel:${settings.contactPhone}`} className="awu-contact-link">
                    <Phone size={13} /> {settings.contactPhone}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}