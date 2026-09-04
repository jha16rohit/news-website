import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Home, ChevronRight, Send, CheckCircle, XCircle, Clock,
  Link as LinkIcon, Upload, X, Loader2, Plus, LogIn, User as UserIcon,
} from "lucide-react";
import "./AdvertiseWithUs.css";
import { getMyAdInquiries, submitAdInquiry } from "../../../api/user/advertise";
import { useAuth } from "../../../context/AuthContext";

/* ─── Types ─────────────────────────────────────────────── */
type AdType = "card" | "strip";
type InquiryStatus = "pending" | "published" | "rejected";

interface MyInquiry {
  id: string;
  adType: AdType;
  status: InquiryStatus;
  submittedAt: string;
  rejectionReason?: string;
  price?: string;
  durationDays?: number;
  expiresAt?: string;
}


// Sizes are locked here so uploaded ads can never break the site layout.
const AD_TYPE_SPECS: Record<AdType, { label: string; minW: number; maxW: number; minH: number; maxH: number; example: string }> = {
  card:  { label: "Card",           minW: 250, maxW: 400,  minH: 200, maxH: 350, example: "e.g. 300×250" },
  strip: { label: "Strip / Banner", minW: 600, maxW: 1600, minH: 60,  maxH: 200, example: "e.g. 1200×120" },
};

const STATUS_META: Record<InquiryStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending Review", color: "#f59e0b", icon: <Clock size={13} /> },
  published: { label: "Live",           color: "#22c55e", icon: <CheckCircle size={13} /> },
  rejected:  { label: "Rejected",       color: "#ef4444", icon: <XCircle size={13} /> },
};



/* ─── Image validation helpers ───────────────────────────── */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { reject(new Error("Could not read image.")); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

async function validateAdImage(file: File, adType: AdType): Promise<string | null> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Only JPG, PNG or WebP images are allowed.";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "Image must be under 5MB.";
  }
  const spec = AD_TYPE_SPECS[adType];
  try {
    const { width, height } = await getImageDimensions(file);
    if (width < spec.minW || width > spec.maxW || height < spec.minH || height > spec.maxH) {
      return `${spec.label} images must be between ${spec.minW}×${spec.minH}px and ${spec.maxW}×${spec.maxH}px (${spec.example}). Your image is ${width}×${height}px.`;
    }
  } catch {
    return "Couldn't read image dimensions. Please try a different file.";
  }
  return null;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ================================================================
   MAIN COMPONENT
================================================================ */
export default function AdvertiseWithUs() {
  const {
    user: currentUser,
    isLoggedIn,
    openLogin,
} = useAuth();

  const [mode, setMode] = useState<"list" | "form" | "thanks">("list");
  const [inquiries, setInquiries] = useState<MyInquiry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refId, setRefId] = useState("");

  const loadInquiries = useCallback(() => {
    if (!currentUser) return;
    setLoadingList(true);
    getMyAdInquiries()
      .then((data: MyInquiry[]) => setInquiries(data || []))
      .catch(() => setInquiries([]))
      .finally(() => setLoadingList(false));
  }, [currentUser]);

  useEffect(() => { loadInquiries(); }, [loadInquiries]);

  /* ── NOT LOGGED IN ── */
  if (!isLoggedIn || !currentUser) {
    return (
      <div className="awu-gate">
        <div className="awu-gate-card">
          <div className="awu-gate-icon"><LogIn size={30} /></div>
          <h2>Advertise With Us</h2>
          <p>Please log in to submit an advertisement request and track its status.</p>
          <button
    className="awu-btn-primary"
    onClick={openLogin}
>
    Log In to Continue
</button>
        </div>
      </div>
    );
  }

  /* ── THANK YOU ── */
  if (mode === "thanks") {
    return (
      <div className="awu-gate">
        <div className="awu-gate-card">
          <div className="awu-gate-icon awu-gate-icon--success"><CheckCircle size={32} /></div>
          <h2>Thanks, {currentUser.name}!</h2>
          <p>Your ad request has been submitted. Our team will review it and update the status below.</p>
          <div className="awu-refid"><span>Reference ID</span><code>#ADV-{refId}</code></div>
          <button className="awu-btn-primary" onClick={() => { setMode("list"); loadInquiries(); }}>
            Back to My Requests
          </button>
        </div>
      </div>
    );
  }

  /* ── FORM ── */
  if (mode === "form") {
    return (
      <AdInquiryForm
        currentUser={currentUser}
        onCancel={() => setMode("list")}
        onSubmitted={(id) => { setRefId(id.slice(-6).toUpperCase()); setMode("thanks"); }}
      />
    );
  }

  /* ── GREETING + TABLE ── */
  return (
    <div className="awu-root">
      <div className="awu-hero">
        <div className="awu-hero-inner">
          <div className="awu-breadcrumb">
            <Link to="/"><Home size={12} /> Home</Link>
            <ChevronRight size={12} />
            <span>Advertise With Us</span>
          </div>
          <h1>Welcome, {currentUser.name} <span className="awu-wave">👋</span></h1>
          <p>Submit a new ad request or track the status of your existing ones below.</p>
        </div>
      </div>

      <div className="awu-main awu-main--centered">
        <div className="awu-list-card">
          <div className="awu-list-head">
            <h2>My Ad Requests</h2>
            <button className="awu-btn-new" onClick={() => setMode("form")}>
              <Plus size={15} /> New Request
            </button>
          </div>

          {loadingList ? (
            <div className="awu-empty"><Loader2 size={26} className="spin-icon" /></div>
          ) : inquiries.length === 0 ? (
            <div className="awu-empty">
              <UserIcon size={32} />
              <p>You haven't submitted any ad requests yet.</p>
              <button className="awu-btn-new" onClick={() => setMode("form")}>
                <Plus size={15} /> Create Your First Request
              </button>
            </div>
          ) : (
            <div className="awu-table-wrap">
              <table className="awu-table">
                <thead>
                  <tr>
                    <th>Ad Type</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((iq) => {
                    const meta = STATUS_META[iq.status];
                    return (
                      <tr key={iq.id}>
                        <td className="awu-td-cap">{AD_TYPE_SPECS[iq.adType]?.label ?? iq.adType}</td>
                        <td>{fmtDate(iq.submittedAt)}</td>
                        <td>
                          <span className="awu-status-pill" style={{ background: meta.color + "1a", color: meta.color, borderColor: meta.color + "50" }}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td className="awu-td-details">
                          {iq.status === "rejected" && iq.rejectionReason && (
                            <span className="awu-reason">"{iq.rejectionReason}"</span>
                          )}
                          {iq.status === "published" && (
                            <span className="awu-live-info">
                              {iq.durationDays ? `${iq.durationDays} days` : "Ongoing"}
                              {iq.expiresAt ? ` · till ${fmtDate(iq.expiresAt)}` : ""}
                            </span>
                          )}
                          {iq.status === "pending" && <span className="awu-muted">Awaiting review</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   NEW INQUIRY FORM
================================================================ */
function AdInquiryForm({
  currentUser,
  onCancel,
  onSubmitted,
}: {
  currentUser: { id: string; name: string; email: string };
  onCancel: () => void;
  onSubmitted: (id: string) => void;
}) {
  const [form, setForm] = useState({
    name: currentUser.name || "",
    email: currentUser.email || "",
    phone: "",
    company: "",
    adType: "card" as AdType,
    linkUrl: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [checkingImage, setCheckingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const spec = AD_TYPE_SPECS[form.adType];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Re-validate the already-picked image whenever the ad type changes,
  // since Card and Strip have different size limits.
  useEffect(() => {
    if (imageFile) {
      setCheckingImage(true);
      validateAdImage(imageFile, form.adType).then(err => {
        setImageError(err);
        setCheckingImage(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.adType]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCheckingImage(true);
    setImageError(null);
    const err = await validateAdImage(file, form.adType);
    setCheckingImage(false);
    if (err) {
      setImageError(err);
      setImageFile(null);
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const errs: Partial<Record<string, string>> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
    if (!form.phone.trim()) errs.phone = "Required";
    if (!imageFile) errs.image = "Please upload your ad image";
    setErrors(errs);
    return Object.keys(errs).length === 0 && !imageError;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      if (form.company) fd.append("company", form.company);
      fd.append("adType", form.adType);
      if (form.linkUrl) fd.append("linkUrl", form.linkUrl);
      if (form.message) fd.append("message", form.message);
      fd.append("adImage", imageFile as File);

      const res = await submitAdInquiry(fd);

onSubmitted((res as any).id);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="awu-root">
      <div className="awu-hero">
        <div className="awu-hero-inner">
          <div className="awu-breadcrumb">
            <Link to="/"><Home size={12} /> Home</Link>
            <ChevronRight size={12} />
            <span onClick={onCancel} style={{ cursor: "pointer" }}>Advertise With Us</span>
            <ChevronRight size={12} />
            <span>New Request</span>
          </div>
          <h1>New Ad Request</h1>
          <p>Fill in your details and upload your ad creative below.</p>
        </div>
      </div>

      <div className="awu-main awu-main--centered">
        <div className="awu-form-card">
          {apiError && <div className="awu-api-error"><X size={14} /> {apiError}</div>}

          <div className="awu-section-label">Your Details</div>
          <div className="awu-row">
            <div className="awu-field">
              <label>Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} disabled={loading} />
              {errors.name && <span className="awu-err">{errors.name}</span>}
            </div>
            <div className="awu-field">
              <label>Company / Brand</label>
              <input name="company" value={form.company} onChange={handleChange} placeholder="Acme Pvt. Ltd." disabled={loading} />
            </div>
          </div>
          <div className="awu-row">
            <div className="awu-field">
              <label>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} disabled={loading} />
              {errors.email && <span className="awu-err">{errors.email}</span>}
            </div>
            <div className="awu-field">
              <label>Phone *</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" disabled={loading} />
              {errors.phone && <span className="awu-err">{errors.phone}</span>}
            </div>
          </div>

          <div className="awu-section-label">Campaign</div>
          <div className="awu-row">
            <div className="awu-field">
              <label>Ad Format *</label>
              <select name="adType" value={form.adType} onChange={handleChange} disabled={loading}>
                <option value="card">Card ({AD_TYPE_SPECS.card.example})</option>
                <option value="strip">Strip / Banner ({AD_TYPE_SPECS.strip.example})</option>
              </select>
            </div>
          </div>
          <div className="awu-field">
            <label><LinkIcon size={12} /> Destination URL</label>
            <input name="linkUrl" value={form.linkUrl} onChange={handleChange} placeholder="https://your-site.com/landing-page" disabled={loading} />
          </div>
          <div className="awu-field">
            <label>Message (optional)</label>
            <textarea name="message" value={form.message} onChange={handleChange} rows={3} placeholder="Anything we should know about your campaign?" disabled={loading} />
          </div>

          <div className="awu-section-label">Ad Creative</div>
          <div className="awu-field">
            <label><Upload size={12} /> Upload Ad Image *</label>
            <div className="awu-spec-hint">
              Accepted size for <strong>{spec.label}</strong>: {spec.minW}×{spec.minH}px – {spec.maxW}×{spec.maxH}px ({spec.example}). Max 5MB. JPG, PNG or WebP.
            </div>

            {!imageFile ? (
              <div className="awu-upload-zone" onClick={() => fileInputRef.current?.click()}>
                <Upload size={22} />
                <span>Click to upload your ad image</span>
                <em>{spec.example} recommended</em>
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
                {imagePreview && <img src={imagePreview} alt="Uploaded preview" />}
                <div className="awu-upload-preview-info">
                  <span className="awu-upload-name">{imageFile.name}</span>
                  <span className="awu-upload-size">{(imageFile.size / 1024).toFixed(0)} KB</span>
                </div>
                <button className="awu-upload-remove" onClick={removeImage} title="Remove"><X size={14} /></button>
              </div>
            )}
            {checkingImage && <span className="awu-checking"><Loader2 size={12} className="spin-icon" /> Checking image size…</span>}
            {imageError && <span className="awu-err">{imageError}</span>}
            {errors.image && <span className="awu-err">{errors.image}</span>}
          </div>

          <div className="awu-form-actions">
            <button className="awu-btn-cancel" onClick={onCancel} disabled={loading}>Cancel</button>
            <button className="awu-submit-btn" onClick={handleSubmit} disabled={loading || checkingImage}>
              {loading ? <><Loader2 size={15} className="spin-icon" /> Submitting…</> : <><Send size={15} /> Submit Request</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}