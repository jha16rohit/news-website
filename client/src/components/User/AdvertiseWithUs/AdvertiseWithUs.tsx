import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight, Send, CheckCircle, Mail, Phone, Image as ImageIcon, Link as LinkIcon, Upload, X } from "lucide-react";
import "./AdvertiseWithUs.css";

const PAGE_OPTIONS = [
  { value: "home", label: "Home Page" },
  { value: "all", label: "All Pages (Sitewide)" },
  { value: "politics", label: "Politics" },
  { value: "sports", label: "Sports" },
  { value: "business", label: "Business & Finance" },
  { value: "technology", label: "Technology" },
  { value: "entertainment", label: "Entertainment" },
  { value: "health", label: "Health & Wellness" },
];

const DURATION_OPTIONS = [
  { value: "7", label: "7 Days" },
  { value: "14", label: "14 Days" },
  { value: "30", label: "30 Days" },
  { value: "90", label: "3 Months" },
  { value: "custom", label: "Custom" },
];

interface AdminPageSettings {
  whyEnabled: boolean;
  whyPoints: string[];
  packagesEnabled: boolean;
  packages: { label: string; price: string }[];
  contactEnabled: boolean;
  contactEmail: string;
  contactPhone: string;
  contactNote: string;
}

function readAdminSettings(): AdminPageSettings {
  const defaults: AdminPageSettings = {
    whyEnabled: false,
    whyPoints: [],
    packagesEnabled: false,
    packages: [],
    contactEnabled: false,
    contactEmail: "",
    contactPhone: "",
    contactNote: "",
  };
  try {
    return JSON.parse(localStorage.getItem("localNewzAdPageSettings") || "null") ?? defaults;
  } catch {
    return defaults;
  }
}

export default function AdvertiseWithUs() {
  const [settings, setSettings] = useState<AdminPageSettings>(readAdminSettings());
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "",
    targetPage: "home", duration: "30", customDays: "", message: "",
    adTitle: "", imageUrl: "", linkUrl: "", adType: "banner", budget: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitted, setSubmitted] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setSettings(readAdminSettings());
    window.addEventListener("localNewzAdPageSettingsUpdate", handler);
    return () => window.removeEventListener("localNewzAdPageSettingsUpdate", handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof form]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim()) errs.name = "Required";
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

  const handleSubmit = () => {
    if (!validate()) return;
    const existing = JSON.parse(localStorage.getItem("localNewzAdInquiries") || "[]");
    existing.push({
      id: Date.now(),
      submittedAt: new Date().toISOString(),
      status: "pending",
      ...form,
      uploadedFileName: uploadedFile?.name || "",
    });
    localStorage.setItem("localNewzAdInquiries", JSON.stringify(existing));
    window.dispatchEvent(new Event("localNewzAdInquiryUpdate"));
    setSubmitted(true);
  };

  const hasAnySidebar = settings.whyEnabled || settings.packagesEnabled || settings.contactEnabled;

  if (submitted) {
    return (
      <div className="awu-success-page">
        <div className="awu-success-card">
          <div className="awu-success-icon"><CheckCircle size={52} /></div>
          <h2>Inquiry Submitted!</h2>
          <p>Thanks, <strong>{form.name}</strong>! We'll reach out to <strong>{form.email}</strong> or <strong>{form.phone}</strong> within 24–48 hours.</p>
          <div className="awu-success-ref">
            <span>Reference ID</span>
            <code>#ADV-{Date.now().toString().slice(-6)}</code>
          </div>
          <Link to="/" className="awu-btn-home">Back to Home</Link>
        </div>
      </div>
    );
  }

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

        {/* FORM */}
        <div className="awu-form-card">
          <h2 className="awu-form-title">Send Us Your Inquiry</h2>

          {/* Contact */}
          <div className="awu-section-label">Your Details</div>
          <div className="awu-row">
            <div className="awu-field">
              <label>Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Rahul Verma" />
              {errors.name && <span className="awu-err">{errors.name}</span>}
            </div>
            <div className="awu-field">
              <label>Company / Brand</label>
              <input name="company" value={form.company} onChange={handleChange} placeholder="Acme Pvt. Ltd." />
            </div>
          </div>
          <div className="awu-row">
            <div className="awu-field">
              <label>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
              {errors.email && <span className="awu-err">{errors.email}</span>}
            </div>
            <div className="awu-field">
              <label>Phone *</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              {errors.phone && <span className="awu-err">{errors.phone}</span>}
            </div>
          </div>

          {/* Campaign */}
          <div className="awu-section-label">Campaign Preference</div>
          <div className="awu-row">
            <div className="awu-field">
              <label>Target Page</label>
              <select name="targetPage" value={form.targetPage} onChange={handleChange}>
                {PAGE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="awu-field">
              <label>Duration</label>
              <select name="duration" value={form.duration} onChange={handleChange}>
                {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
          {form.duration === "custom" && (
            <div className="awu-field">
              <label>Number of Days *</label>
              <input name="customDays" type="number" min="1" value={form.customDays} onChange={handleChange} placeholder="e.g. 45" />
              {errors.customDays && <span className="awu-err">{errors.customDays}</span>}
            </div>
          )}
          <div className="awu-field">
            <label>Budget (Optional)</label>
            <input name="budget" value={form.budget} onChange={handleChange} placeholder="e.g. ₹10,000 – ₹20,000" />
          </div>
          <div className="awu-field">
            <label>Message / Requirements</label>
            <textarea name="message" value={form.message} onChange={handleChange} rows={3} placeholder="Tell us about your campaign goals..." />
          </div>

          {/* Ad Creative */}
          <div className="awu-section-label">Ad Creative <span className="awu-section-label-opt">(Optional)</span></div>
          <div className="awu-field">
            <label><ImageIcon size={12} /> Ad Image URL</label>
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://your-site.com/banner.jpg" />
            <span className="awu-field-hint">Recommended: 1200×300px. JPG, PNG or WebP.</span>
          </div>
          <div className="awu-field">
            <label><LinkIcon size={12} /> Destination URL</label>
            <input name="linkUrl" value={form.linkUrl} onChange={handleChange} placeholder="https://your-site.com/landing-page" />
            <span className="awu-field-hint">Where users land when they click your ad.</span>
          </div>

          {/* File upload */}
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
            <span className="awu-field-hint">You can also send the file via email after submitting if preferred.</span>
          </div>

          <button className="awu-submit-btn" onClick={handleSubmit}>
            <Send size={15} /> Submit Inquiry
          </button>
        </div>

        {/* SIDEBAR — only if admin has enabled any section */}
        {hasAnySidebar && (
          <div className="awu-sidebar">
            {settings.whyEnabled && settings.whyPoints.length > 0 && (
              <div className="awu-sidebar-card">
                <h3>Why Advertise With Us?</h3>
                <ul>
                  {settings.whyPoints.map((pt, i) => (
                    <li key={i}><CheckCircle size={13} /> {pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {settings.packagesEnabled && settings.packages.length > 0 && (
              <div className="awu-sidebar-card">
                <h3>Ad Packages</h3>
                <div className="awu-pkg-list">
                  {settings.packages.map((p, i) => (
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
                {settings.contactNote && <p className="awu-contact-note">{settings.contactNote}</p>}
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