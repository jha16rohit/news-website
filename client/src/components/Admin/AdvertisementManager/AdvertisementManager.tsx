import React, { useState, useEffect } from "react";
import {
  Mail, Phone, Building, Calendar, Clock, Globe,
  CheckCircle, XCircle, MessageSquare, Eye, Trash2,
  ChevronDown, ChevronUp, Send,
  Image as ImageIcon, Link as LinkIcon, BarChart2,
  ArrowLeft, MonitorPlay, X, Filter, Settings,
  Plus, Minus, ToggleLeft, ToggleRight
} from "lucide-react";
import "./AdvertisementManager.css";

/* ─── Types ─────────────────────────────────────────────── */
type InquiryStatus = "pending" | "contacted" | "deal_done" | "published" | "rejected";

interface AdInquiry {
  id: number;
  submittedAt: string;
  status: InquiryStatus;
  name: string;
  email: string;
  phone: string;
  company: string;
  targetPage: string;
  duration: string;
  customDays: string;
  adType: string;
  budget: string;
  message: string;
  imageUrl: string;
  linkUrl: string;
  adTitle: string;
  adminNote?: string;
  publishedAt?: string;
  expiresAt?: string;
}

interface PublishedAd {
  id: number;
  inquiryId: number;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  targetPage: string;
  publishedAt: string;
  expiresAt: string;
  isActive: boolean;
  adTitle: string;
  advertiser: string;
}

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

/* ─── Constants ─────────────────────────────────────────── */
const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   color: "#f59e0b", icon: <Clock size={12} /> },
  contacted: { label: "Contacted", color: "#3b82f6", icon: <MessageSquare size={12} /> },
  deal_done: { label: "Deal Done", color: "#8b5cf6", icon: <CheckCircle size={12} /> },
  published: { label: "Published", color: "#22c55e", icon: <MonitorPlay size={12} /> },
  rejected:  { label: "Rejected",  color: "#ef4444", icon: <XCircle size={12} /> },
};

const PAGE_LABEL: Record<string, string> = {
  home: "Home Page", all: "Sitewide (All Pages)", politics: "Politics",
  sports: "Sports", business: "Business & Finance", technology: "Technology",
  entertainment: "Entertainment", health: "Health & Wellness",
};

const DURATION_DAYS: Record<string, number> = { "7": 7, "14": 14, "30": 30, "90": 90 };

const DEFAULT_SETTINGS: AdminPageSettings = {
  whyEnabled: false,
  whyPoints: ["Hyper-local audience across 18+ Indian cities", "Flexible campaign durations", "Real-time performance analytics"],
  packagesEnabled: false,
  packages: [
    { label: "7 Days", price: "₹2,999" },
    { label: "14 Days", price: "₹4,999" },
    { label: "30 Days", price: "₹8,999" },
    { label: "3 Months", price: "₹19,999" },
  ],
  contactEnabled: false,
  contactEmail: "ads@localnewz.in",
  contactPhone: "+91 99999 99999",
  contactNote: "Prefer to talk first? Reach our ads team directly:",
};

/* ─── Helpers ───────────────────────────────────────────── */
function readInquiries(): AdInquiry[] {
  return JSON.parse(localStorage.getItem("localNewzAdInquiries") || "[]");
}
function saveInquiries(list: AdInquiry[]) {
  localStorage.setItem("localNewzAdInquiries", JSON.stringify(list));
  window.dispatchEvent(new Event("localNewzAdInquiryUpdate"));
}
function readPublishedAds(): PublishedAd[] {
  return JSON.parse(localStorage.getItem("localNewzPublishedAds") || "[]");
}
function savePublishedAds(list: PublishedAd[]) {
  localStorage.setItem("localNewzPublishedAds", JSON.stringify(list));
  window.dispatchEvent(new Event("localNewzPublishedAdsUpdate"));
}
function readSettings(): AdminPageSettings {
  try {
    return JSON.parse(localStorage.getItem("localNewzAdPageSettings") || "null") ?? DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}
function saveSettings(s: AdminPageSettings) {
  localStorage.setItem("localNewzAdPageSettings", JSON.stringify(s));
  window.dispatchEvent(new Event("localNewzAdPageSettingsUpdate"));
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─── Sub-components ────────────────────────────────────── */
function StatusBadge({ status }: { status: InquiryStatus }) {
  const { label, color, icon } = STATUS_CONFIG[status];
  return (
    <span className="adm-status-badge" style={{ background: color + "20", color, borderColor: color + "50" }}>
      {icon} {label}
    </span>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button className={`adm-toggle ${on ? "adm-toggle--on" : ""}`} onClick={onToggle} title={on ? "Disable" : "Enable"}>
      {on ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
      <span>{on ? "Visible on site" : "Hidden from site"}</span>
    </button>
  );
}

/* ─── Publish Modal ──────────────────────────────────────── */
interface PublishModalProps {
  inquiry: AdInquiry;
  onClose: () => void;
  onPublish: (ad: PublishedAd) => void;
}
function PublishModal({ inquiry, onClose, onPublish }: PublishModalProps) {
  const [step, setStep] = useState<"edit" | "preview">("edit");
  const [form, setForm] = useState({
    imageUrl: inquiry.imageUrl || "",
    linkUrl: inquiry.linkUrl || "",
    altText: inquiry.adTitle || inquiry.company || "Advertisement",
    targetPage: inquiry.targetPage || "home",
    durationDays: inquiry.duration === "custom" ? (parseInt(inquiry.customDays) || 30) : (DURATION_DAYS[inquiry.duration] || 30),
    startDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Partial<typeof form & { imageUrl: string }>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === "durationDays" ? parseInt(value) || 0 : value }));
  };

  const validate = () => {
    const errs: any = {};
    if (!form.imageUrl.trim()) errs.imageUrl = "Image URL is required";
    if (!form.linkUrl.trim()) errs.linkUrl = "Destination URL is required";
    if (!form.durationDays || form.durationDays < 1) errs.durationDays = "Duration must be at least 1 day";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePublish = () => {
    const start = new Date(form.startDate);
    const expires = new Date(start);
    expires.setDate(expires.getDate() + form.durationDays);
    const ad: PublishedAd = {
      id: Date.now(), inquiryId: inquiry.id,
      imageUrl: form.imageUrl, linkUrl: form.linkUrl,
      altText: form.altText, targetPage: form.targetPage,
      publishedAt: start.toISOString(), expiresAt: expires.toISOString(),
      isActive: true, adTitle: form.altText,
      advertiser: inquiry.company || inquiry.name,
    };
    onPublish(ad);
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div>
            <h2>{step === "edit" ? "Publish Advertisement" : "Preview Before Publishing"}</h2>
            <p>{inquiry.company || inquiry.name} · {PAGE_LABEL[inquiry.targetPage] || inquiry.targetPage}</p>
          </div>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {step === "edit" ? (
          <div className="adm-modal-body">
            <div className="adm-publish-grid">
              <div className="adm-pf-group">
                <label>Ad Image URL *</label>
                <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://cdn.example.com/banner.jpg" />
                {errors.imageUrl && <span className="adm-err">{errors.imageUrl}</span>}
                <span className="adm-field-hint"><ImageIcon size={11} /> Recommended: 1200×300px</span>
              </div>
              {form.imageUrl && (
                <div className="adm-img-preview-wrap">
                  <span>Image Preview:</span>
                  <div className="adm-img-preview">
                    <img src={form.imageUrl} alt="preview" onError={e => { (e.target as HTMLImageElement).alt = "Invalid image URL"; }} />
                  </div>
                </div>
              )}
              <div className="adm-pf-group">
                <label>Ad Title / Alt Text *</label>
                <input name="altText" value={form.altText} onChange={handleChange} placeholder="e.g. Mega Sale — 50% Off Electronics" />
              </div>
              <div className="adm-pf-group">
                <label>Destination URL *</label>
                <input name="linkUrl" value={form.linkUrl} onChange={handleChange} placeholder="https://advertiser.com/landing" />
                {errors.linkUrl && <span className="adm-err">{errors.linkUrl}</span>}
              </div>
              <div className="adm-pf-row">
                <div className="adm-pf-group">
                  <label>Target Page *</label>
                  <select name="targetPage" value={form.targetPage} onChange={handleChange}>
                    {Object.entries(PAGE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="adm-pf-group">
                  <label>Start Date *</label>
                  <input name="startDate" type="date" value={form.startDate} onChange={handleChange} min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="adm-pf-group">
                  <label>Duration (Days) *</label>
                  <input name="durationDays" type="number" min={1} value={form.durationDays} onChange={handleChange} />
                  {errors.durationDays && <span className="adm-err">{errors.durationDays}</span>}
                </div>
              </div>
              <div className="adm-expiry-info">
                <Calendar size={13} />
                <span>Runs from <strong>{new Date(form.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong> for <strong>{form.durationDays} days</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="adm-modal-body">
            <div className="adm-preview-notice"><Eye size={14} /> Preview of how the ad will appear on site</div>
            <div className="adm-live-preview">
              <div className="adm-preview-navbar">
                <div className="adm-preview-logo">LOCAL NEWZ</div>
                <div className="adm-preview-nav-links"><span>Home</span><span>Politics</span><span>Sports</span></div>
              </div>
              <div className="adm-preview-content">
                <div className="adm-preview-ad-slot">
                  <div className="adm-preview-ad-label">Advertisement</div>
                  <a href={form.linkUrl} target="_blank" rel="noopener noreferrer" className="adm-preview-ad-link">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt={form.altText} className="adm-preview-ad-img" />
                    ) : (
                      <div className="adm-preview-ad-placeholder"><ImageIcon size={28} /><span>No image</span></div>
                    )}
                  </a>
                </div>
              </div>
            </div>
            <div className="adm-preview-summary">
              <div className="adm-ps-row"><span>Target Page</span><strong>{PAGE_LABEL[form.targetPage]}</strong></div>
              <div className="adm-ps-row"><span>Duration</span><strong>{form.durationDays} days from {new Date(form.startDate).toLocaleDateString("en-IN")}</strong></div>
              <div className="adm-ps-row"><span>Advertiser</span><strong>{inquiry.company || inquiry.name}</strong></div>
              <div className="adm-ps-row"><span>Landing URL</span><a href={form.linkUrl} target="_blank" rel="noopener noreferrer">{form.linkUrl}</a></div>
            </div>
          </div>
        )}

        <div className="adm-modal-footer">
          {step === "preview" && (
            <button className="adm-btn-back" onClick={() => setStep("edit")}><ArrowLeft size={14} /> Edit</button>
          )}
          <div style={{ flex: 1 }} />
          <button className="adm-btn-cancel" onClick={onClose}>Cancel</button>
          {step === "edit" ? (
            <button className="adm-btn-preview" onClick={() => { if (validate()) setStep("preview"); }}>
              <Eye size={14} /> Preview
            </button>
          ) : (
            <button className="adm-btn-publish" onClick={handlePublish}>
              <Send size={14} /> Publish Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Page Settings Tab ──────────────────────────────────── */
function PageSettings() {
  const [settings, setSettings] = useState<AdminPageSettings>(readSettings());
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<AdminPageSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Why Advertise points
  const updatePoint = (i: number, val: string) => {
    const pts = [...settings.whyPoints];
    pts[i] = val;
    update({ whyPoints: pts });
  };
  const addPoint = () => update({ whyPoints: [...settings.whyPoints, ""] });
  const removePoint = (i: number) => update({ whyPoints: settings.whyPoints.filter((_, idx) => idx !== i) });

  // Packages
  const updatePkg = (i: number, field: "label" | "price", val: string) => {
    const pkgs = [...settings.packages];
    pkgs[i] = { ...pkgs[i], [field]: val };
    update({ packages: pkgs });
  };
  const addPkg = () => update({ packages: [...settings.packages, { label: "", price: "" }] });
  const removePkg = (i: number) => update({ packages: settings.packages.filter((_, idx) => idx !== i) });

  return (
    <div className="adm-content">
      <div className="adm-ps-header">
        <p className="adm-ps-desc">
          Control which informational sections appear on the <strong>Advertise With Us</strong> page. Toggle each section on or off, and edit its content. Changes only go live after clicking <strong>Save Changes</strong>.
        </p>
      </div>

      {/* WHY ADVERTISE */}
      <div className="adm-settings-card">
        <div className="adm-settings-card-header">
          <div>
            <h3>"Why Advertise With Us?" Section</h3>
            <p>A bullet list of reasons to advertise shown in the sidebar.</p>
          </div>
          <Toggle on={settings.whyEnabled} onToggle={() => update({ whyEnabled: !settings.whyEnabled })} />
        </div>
        {settings.whyEnabled && (
          <div className="adm-settings-card-body">
            <label className="adm-settings-label">Bullet Points</label>
            <div className="adm-points-list">
              {settings.whyPoints.map((pt, i) => (
                <div key={i} className="adm-point-row">
                  <input
                    value={pt}
                    onChange={e => updatePoint(i, e.target.value)}
                    placeholder="e.g. Hyper-local audience across 18+ cities"
                  />
                  <button className="adm-icon-btn adm-icon-btn--red" onClick={() => removePoint(i)}>
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button className="adm-add-btn" onClick={addPoint}>
              <Plus size={14} /> Add Point
            </button>
          </div>
        )}
      </div>

      {/* PACKAGES */}
      <div className="adm-settings-card">
        <div className="adm-settings-card-header">
          <div>
            <h3>"Ad Packages" Section</h3>
            <p>A pricing table shown in the sidebar for quick reference.</p>
          </div>
          <Toggle on={settings.packagesEnabled} onToggle={() => update({ packagesEnabled: !settings.packagesEnabled })} />
        </div>
        {settings.packagesEnabled && (
          <div className="adm-settings-card-body">
            <label className="adm-settings-label">Packages</label>
            <div className="adm-pkg-rows">
              {settings.packages.map((pkg, i) => (
                <div key={i} className="adm-pkg-edit-row">
                  <input
                    value={pkg.label}
                    onChange={e => updatePkg(i, "label", e.target.value)}
                    placeholder="Label (e.g. 7 Days)"
                  />
                  <input
                    value={pkg.price}
                    onChange={e => updatePkg(i, "price", e.target.value)}
                    placeholder="Price (e.g. ₹2,999)"
                  />
                  <button className="adm-icon-btn adm-icon-btn--red" onClick={() => removePkg(i)}>
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button className="adm-add-btn" onClick={addPkg}>
              <Plus size={14} /> Add Package
            </button>
          </div>
        )}
      </div>

      {/* QUICK CONTACT */}
      <div className="adm-settings-card">
        <div className="adm-settings-card-header">
          <div>
            <h3>"Quick Contact" Section</h3>
            <p>Contact details shown in the sidebar for direct inquiries.</p>
          </div>
          <Toggle on={settings.contactEnabled} onToggle={() => update({ contactEnabled: !settings.contactEnabled })} />
        </div>
        {settings.contactEnabled && (
          <div className="adm-settings-card-body">
            <div className="adm-contact-fields">
              <div className="adm-pf-group">
                <label>Short Note (optional)</label>
                <input
                  value={settings.contactNote}
                  onChange={e => update({ contactNote: e.target.value })}
                  placeholder="e.g. Prefer to talk first? Reach us directly:"
                />
              </div>
              <div className="adm-pf-row">
                <div className="adm-pf-group">
                  <label>Email</label>
                  <input
                    value={settings.contactEmail}
                    onChange={e => update({ contactEmail: e.target.value })}
                    placeholder="ads@localnewz.in"
                  />
                </div>
                <div className="adm-pf-group">
                  <label>Phone</label>
                  <input
                    value={settings.contactPhone}
                    onChange={e => update({ contactPhone: e.target.value })}
                    placeholder="+91 99999 99999"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SAVE */}
      <div className="adm-settings-save-row">
        <button className={`adm-save-btn ${saved ? "adm-save-btn--saved" : ""}`} onClick={handleSave}>
          {saved ? <><CheckCircle size={15} /> Saved!</> : <><Send size={14} /> Save Changes</>}
        </button>
        {saved && <span className="adm-saved-note">Changes are now live on the Advertise With Us page.</span>}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function AdvertisementManager() {
  const [inquiries, setInquiries] = useState<AdInquiry[]>([]);
  const [publishedAds, setPublishedAds] = useState<PublishedAd[]>([]);
  const [activeTab, setActiveTab] = useState<"inquiries" | "published" | "settings">("inquiries");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [publishingInquiry, setPublishingInquiry] = useState<AdInquiry | null>(null);
  const [filterStatus, setFilterStatus] = useState<InquiryStatus | "all">("all");
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("localNewzAdInquiryUpdate", handler);
    return () => window.removeEventListener("localNewzAdInquiryUpdate", handler);
  }, []);

  const loadData = () => {
    setInquiries(readInquiries().reverse());
    setPublishedAds(readPublishedAds().reverse());
  };

  const updateStatus = (id: number, status: InquiryStatus, note?: string) => {
    const list = readInquiries();
    const updated = list.map(i => i.id === id ? { ...i, status, adminNote: note ?? i.adminNote } : i);
    saveInquiries(updated);
    setInquiries(updated.slice().reverse());
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this inquiry?")) return;
    const list = readInquiries().filter(i => i.id !== id);
    saveInquiries(list);
    setInquiries(list.slice().reverse());
  };

  const handlePublish = (ad: PublishedAd, inquiryId: number) => {
    const ads = readPublishedAds();
    ads.push(ad);
    savePublishedAds(ads);
    const list = readInquiries();
    const updated = list.map(i => i.id === inquiryId ? { ...i, status: "published" as InquiryStatus, publishedAt: ad.publishedAt, expiresAt: ad.expiresAt } : i);
    saveInquiries(updated);
    setPublishedAds(ads.slice().reverse());
    setInquiries(updated.slice().reverse());
    setPublishingInquiry(null);
    setActiveTab("published");
  };

  const toggleAdActive = (adId: number) => {
    const ads = readPublishedAds().map(a => a.id === adId ? { ...a, isActive: !a.isActive } : a);
    savePublishedAds(ads);
    setPublishedAds(ads.slice().reverse());
  };

  const deleteAd = (adId: number) => {
    if (!window.confirm("Remove this published advertisement?")) return;
    const ads = readPublishedAds().filter(a => a.id !== adId);
    savePublishedAds(ads);
    setPublishedAds(ads.slice().reverse());
  };

  const filtered = filterStatus === "all" ? inquiries : inquiries.filter(i => i.status === filterStatus);
  const counts = inquiries.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const activeAdsCount = publishedAds.filter(a => a.isActive && new Date(a.expiresAt) > new Date()).length;

  return (
    <div className="adm-root">

      {/* HEADER */}
      <div className="adm-header">
        <div>
          <h1 className="adm-page-title">Advertisement Manager</h1>
          <p className="adm-page-sub">Manage ad inquiries, publish live ads, and control the Advertise With Us page</p>
        </div>
        <div className="adm-header-stats">
          <div className="adm-hstat"><span>{inquiries.length}</span><em>Total Inquiries</em></div>
          <div className="adm-hstat adm-hstat--warn"><span>{counts["pending"] || 0}</span><em>Pending</em></div>
          <div className="adm-hstat adm-hstat--purple"><span>{counts["deal_done"] || 0}</span><em>Ready to Publish</em></div>
          <div className="adm-hstat adm-hstat--green"><span>{activeAdsCount}</span><em>Active Ads</em></div>
        </div>
      </div>

      {/* TABS */}
      <div className="adm-tabs">
        <button className={`adm-tab ${activeTab === "inquiries" ? "adm-tab--active" : ""}`} onClick={() => setActiveTab("inquiries")}>
          <MessageSquare size={15} /> Inquiries
          {(counts["pending"] || 0) > 0 && <span className="adm-tab-badge">{counts["pending"]}</span>}
        </button>
        <button className={`adm-tab ${activeTab === "published" ? "adm-tab--active" : ""}`} onClick={() => setActiveTab("published")}>
          <MonitorPlay size={15} /> Published Ads
          {activeAdsCount > 0 && <span className="adm-tab-badge adm-tab-badge--green">{activeAdsCount}</span>}
        </button>
        <button className={`adm-tab ${activeTab === "settings" ? "adm-tab--active" : ""}`} onClick={() => setActiveTab("settings")}>
          <Settings size={15} /> Page Settings
        </button>
      </div>

      {/* ── INQUIRIES TAB ── */}
      {activeTab === "inquiries" && (
        <div className="adm-content">
          <div className="adm-filter-bar">
            <Filter size={14} />
            {(["all", "pending", "contacted", "deal_done", "published", "rejected"] as const).map(s => (
              <button key={s} className={`adm-filter-btn ${filterStatus === s ? "adm-filter-btn--active" : ""}`} onClick={() => setFilterStatus(s)}>
                {s === "all" ? "All" : STATUS_CONFIG[s].label}
                {s !== "all" && counts[s] ? <span className="adm-filter-count">{counts[s]}</span> : null}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="adm-empty">
              <MessageSquare size={40} />
              <h3>No inquiries yet</h3>
              <p>When users submit ad requests, they'll appear here.</p>
            </div>
          ) : (
            <div className="adm-inquiry-list">
              {filtered.map(inquiry => (
                <div key={inquiry.id} className={`adm-inquiry-card ${expandedId === inquiry.id ? "adm-inquiry-card--expanded" : ""}`}>
                  <div className="adm-iq-header" onClick={() => setExpandedId(expandedId === inquiry.id ? null : inquiry.id)}>
                    <div className="adm-iq-left">
                      <div className="adm-iq-avatar">{(inquiry.name || "?")[0].toUpperCase()}</div>
                      <div>
                        <div className="adm-iq-name">{inquiry.name} {inquiry.company && <span className="adm-iq-company">· {inquiry.company}</span>}</div>
                        <div className="adm-iq-meta">
                          <span><Mail size={11} />{inquiry.email}</span>
                          <span><Phone size={11} />{inquiry.phone}</span>
                          <span><Globe size={11} />{PAGE_LABEL[inquiry.targetPage] || inquiry.targetPage}</span>
                          <span><Clock size={11} />{inquiry.duration === "custom" ? `${inquiry.customDays} days` : `${inquiry.duration} days`}</span>
                        </div>
                      </div>
                    </div>
                    <div className="adm-iq-right">
                      <StatusBadge status={inquiry.status} />
                      <span className="adm-iq-date">{fmtDate(inquiry.submittedAt)}</span>
                      {expandedId === inquiry.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {expandedId === inquiry.id && (
                    <div className="adm-iq-body">
                      <div className="adm-iq-details-grid">
                        <div className="adm-iq-detail-col">
                          <h4>Contact Details</h4>
                          <div className="adm-iq-detail-row"><Mail size={13} /><span>{inquiry.email}</span></div>
                          <div className="adm-iq-detail-row"><Phone size={13} /><span>{inquiry.phone}</span></div>
                          {inquiry.company && <div className="adm-iq-detail-row"><Building size={13} /><span>{inquiry.company}</span></div>}
                          {inquiry.budget && <div className="adm-iq-detail-row"><BarChart2 size={13} /><span>Budget: {inquiry.budget}</span></div>}
                        </div>
                        <div className="adm-iq-detail-col">
                          <h4>Campaign Request</h4>
                          <div className="adm-iq-detail-row"><Globe size={13} /><span>{PAGE_LABEL[inquiry.targetPage] || inquiry.targetPage}</span></div>
                          <div className="adm-iq-detail-row"><Clock size={13} /><span>Duration: {inquiry.duration === "custom" ? `${inquiry.customDays} days` : `${inquiry.duration} days`}</span></div>
                          <div className="adm-iq-detail-row"><MonitorPlay size={13} /><span>Type: {inquiry.adType}</span></div>
                          {inquiry.adTitle && <div className="adm-iq-detail-row"><ImageIcon size={13} /><span>Ad Title: {inquiry.adTitle}</span></div>}
                          {inquiry.linkUrl && <div className="adm-iq-detail-row"><LinkIcon size={13} /><a href={inquiry.linkUrl} target="_blank" rel="noopener noreferrer">{inquiry.linkUrl}</a></div>}
                        </div>
                      </div>

                      {inquiry.message && (
                        <div className="adm-iq-message">
                          <h4>Message from Advertiser</h4>
                          <p>"{inquiry.message}"</p>
                        </div>
                      )}

                      {inquiry.imageUrl && (
                        <div className="adm-iq-imgwrap">
                          <h4>Provided Ad Image</h4>
                          <div className="adm-iq-img-frame">
                            <img src={inquiry.imageUrl} alt="Advertiser provided" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        </div>
                      )}

                      <div className="adm-iq-note">
                        <label>Internal Admin Note</label>
                        <textarea
                          rows={2}
                          placeholder="Add notes about this deal, agreed price, contact history..."
                          value={adminNotes[inquiry.id] ?? inquiry.adminNote ?? ""}
                          onChange={e => setAdminNotes(n => ({ ...n, [inquiry.id]: e.target.value }))}
                        />
                      </div>

                      <div className="adm-iq-actions">
                        <div className="adm-iq-status-btns">
                          {(["pending", "contacted", "deal_done", "rejected"] as InquiryStatus[]).map(s => (
                            <button
                              key={s}
                              className={`adm-status-btn ${inquiry.status === s ? "adm-status-btn--active" : ""}`}
                              style={inquiry.status === s ? { background: STATUS_CONFIG[s].color + "20", borderColor: STATUS_CONFIG[s].color, color: STATUS_CONFIG[s].color } : {}}
                              onClick={() => updateStatus(inquiry.id, s, adminNotes[inquiry.id])}
                            >
                              {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                            </button>
                          ))}
                        </div>
                        <div className="adm-iq-right-actions">
                          <button className="adm-btn-delete" onClick={() => handleDelete(inquiry.id)}><Trash2 size={14} /></button>
                          {inquiry.status === "deal_done" && (
                            <button className="adm-btn-publish-now" onClick={() => setPublishingInquiry(inquiry)}>
                              <Send size={14} /> Publish Ad
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PUBLISHED ADS TAB ── */}
      {activeTab === "published" && (
        <div className="adm-content">
          {publishedAds.length === 0 ? (
            <div className="adm-empty">
              <MonitorPlay size={40} />
              <h3>No published ads yet</h3>
              <p>Mark an inquiry as "Deal Done" and publish it to see live ads here.</p>
            </div>
          ) : (
            <div className="adm-published-grid">
              {publishedAds.map(ad => {
                const isExpired = new Date(ad.expiresAt) < new Date();
                return (
                  <div key={ad.id} className={`adm-pub-card ${!ad.isActive || isExpired ? "adm-pub-card--inactive" : ""}`}>
                    <div className="adm-pub-img-wrap">
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} alt={ad.altText} className="adm-pub-img" />
                      ) : (
                        <div className="adm-pub-no-img"><ImageIcon size={24} /><span>No Image</span></div>
                      )}
                      <div className="adm-pub-overlay-badges">
                        {isExpired ? (
                          <span className="adm-pub-badge adm-pub-badge--expired">Expired</span>
                        ) : ad.isActive ? (
                          <span className="adm-pub-badge adm-pub-badge--live">● Live</span>
                        ) : (
                          <span className="adm-pub-badge adm-pub-badge--paused">Paused</span>
                        )}
                        <span className="adm-pub-badge adm-pub-badge--page">{PAGE_LABEL[ad.targetPage] || ad.targetPage}</span>
                      </div>
                    </div>
                    <div className="adm-pub-body">
                      <div className="adm-pub-title">{ad.adTitle}</div>
                      <div className="adm-pub-advertiser">{ad.advertiser}</div>
                      <div className="adm-pub-dates">
                        <span><Calendar size={11} /> Starts: {new Date(ad.publishedAt).toLocaleDateString("en-IN")}</span>
                        <span><Calendar size={11} /> Ends: {new Date(ad.expiresAt).toLocaleDateString("en-IN")}</span>
                      </div>
                      <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="adm-pub-url">
                        <LinkIcon size={11} /> {ad.linkUrl}
                      </a>
                    </div>
                    <div className="adm-pub-footer">
                      <button
                        className={`adm-pub-toggle ${ad.isActive ? "adm-pub-toggle--pause" : "adm-pub-toggle--activate"}`}
                        onClick={() => toggleAdActive(ad.id)}
                        disabled={isExpired}
                      >
                        {ad.isActive ? "Pause" : "Activate"}
                      </button>
                      <button className="adm-pub-delete" onClick={() => deleteAd(ad.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PAGE SETTINGS TAB ── */}
      {activeTab === "settings" && <PageSettings />}

      {/* PUBLISH MODAL */}
      {publishingInquiry && (
        <PublishModal
          inquiry={publishingInquiry}
          onClose={() => setPublishingInquiry(null)}
          onPublish={(ad) => handlePublish(ad, publishingInquiry.id)}
        />
      )}
    </div>
  );
}