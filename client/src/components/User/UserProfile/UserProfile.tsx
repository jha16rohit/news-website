// client/src/components/User/UserProfile/UserProfile.tsx
// ──────────────────────────────────────────────────────────────
// All data comes from the real backend.  No localStorage anywhere.

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  History, BarChart2, Edit2, Eye,
  Share2, Clock, X, User, Mail, Phone,
  Image as ImageIcon, ArrowRight, TrendingUp, Loader2, Lock,
} from "lucide-react";
import "./UserProfile.css";
import {
  getMe,
  updateProfile,
  changePassword,
  logoutUser,
} from "../../../api/user/userauth";
import type { AuthUser } from "../../../api/user/userauth";
// ─────────────────────────────────────────────
// STATIC DEMO DATA  (replace with real API data when ready)
// ─────────────────────────────────────────────

const HISTORY_ARTICLES = [
  { id: 4, category: "Sports",     title: "India Clinches Historic Test Series Win Against Australia 3-1",        time: "3 hours ago", read: "4 min", img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&q=80" },
  { id: 5, category: "Business",   title: "Sensex Surges 800 Points as FIIs Pour Record Capital Into Markets",   time: "4 hours ago", read: "5 min", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80" },
  { id: 6, category: "Politics",   title: "PM Modi At G20 Summit: Key Trade Deals Signed With 7 Nations",       time: "7 hours ago", read: "6 min", img: "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=400&q=80" },
  { id: 7, category: "Technology", title: "AI Revolution: How Indian Tech Giants Are Leading the Global Race",  time: "1 day ago",   read: "8 min", img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80" },
  { id: 8, category: "Health",     title: "Indian Scientists Develop Breakthrough Vaccine for Dengue Fever",    time: "1 day ago",   read: "3 min", img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&q=80" },
];

const CATEGORY_DATA = [
  { label: "Politics",   value: 38, color: "#0d1f3c" },
  { label: "Sports",     value: 27, color: "#e60000" },
  { label: "Business",   value: 19, color: "#2563eb" },
  { label: "Technology", value: 11, color: "#64748b" },
  { label: "Health",     value:  5, color: "#94a3b8" },
];

const WEEKLY_DATA = [
  { day: "M", reads: 12 }, { day: "T", reads: 19 }, { day: "W", reads: 8  },
  { day: "T", reads: 25 }, { day: "F", reads: 17 }, { day: "S", reads: 31 }, { day: "S", reads: 22 },
];

const PLATFORM_DATA = [
  { name: "WhatsApp",  pct: 47, color: "#25D366" },
  { name: "Facebook",  pct: 28, color: "#1877F2" },
  { name: "X/Twitter", pct: 14, color: "#0d1f3c" },
  { name: "LinkedIn",  pct: 11, color: "#0A66C2" },
];

const maxReads = Math.max(...WEEKLY_DATA.map(d => d.reads));

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function computeInitials(name: string): string {
  const words = name.trim().split(" ");
  if (words.length > 1) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const UserProfile: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab,      setActiveTab]      = useState<"history" | "analytics">("history");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [mounted,        setMounted]        = useState(false);
  const [pageLoading,    setPageLoading]    = useState(true);

  // ── User state (source of truth = backend) ───────────────────

  const [user, setUser] = useState<AuthUser | null>(null);

  // ── Edit profile form state ───────────────────────────────────

  const [editName,       setEditName]       = useState("");
  const [editEmail,      setEditEmail]      = useState("");
  const [editPhone,      setEditPhone]      = useState("");
  const [editProfilePic, setEditProfilePic] = useState<string | null>(null);
  const [editLoading,    setEditLoading]    = useState(false);
  const [editError,      setEditError]      = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Change password form state ───────────────────────────────

  const [currentPass,  setCurrentPass]  = useState("");
  const [newPass,      setNewPass]      = useState("");
  const [confirmPass,  setConfirmPass]  = useState("");
  const [passLoading,  setPassLoading]  = useState(false);
  const [passError,    setPassError]    = useState<string | null>(null);
  const [passSuccess,  setPassSuccess]  = useState<string | null>(null);

  // ── Load user on mount ───────────────────────────────────────

  useEffect(() => {
    getMe()
      .then(({ user }) => {
        setUser(user);
        setEditName(user.name || "");
        setEditEmail(user.email || "");
        setEditPhone(user.phone || "");
        setEditProfilePic(user.profilePic || null);
      })
      .catch(() => {
        // Not authenticated → redirect to home
        navigate("/");
      })
      .finally(() => {
        setPageLoading(false);
        requestAnimationFrame(() => setMounted(true));
      });
  }, [navigate]);

  // ── Image upload ─────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ── Save profile ─────────────────────────────────────────────

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditLoading(true);

    try {
      const { user: updated } = await updateProfile({
        name:       editName,
        email:      editEmail,
        phone:      editPhone || undefined,
        profilePic: editProfilePic,
      });
      setUser(updated);
      setIsEditModalOpen(false);
    } catch (err: any) {
      setEditError(err?.message || "Update failed. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Change password ───────────────────────────────────────────

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPass.length < 6) {
      setPassError("New password kam se kam 6 characters ka hona chahiye.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("Passwords match nahi kar rahe.");
      return;
    }

    setPassLoading(true);
    try {
      const res = await changePassword({ currentPassword: currentPass, newPassword: newPass });
      setPassSuccess(res.message || "Password badal gaya!");
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      setTimeout(() => setIsPassModalOpen(false), 1500);
    } catch (err: any) {
      setPassError(err?.message || "Failed to change password.");
    } finally {
      setPassLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────

  const handleLogout = async () => {
    await logoutUser().catch(() => {});
    navigate("/");
  };

  // ── Open edit modal ───────────────────────────────────────────

  const openEditModal = () => {
    if (!user) return;
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || "");
    setEditProfilePic(user.profilePic || null);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // ── Loading screen ────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 10, color: "#64748b" }}>
        <Loader2 size={22} className="spin-icon" />
        <span>Loading profile...</span>
      </div>
    );
  }

  if (!user) return null;

  const initials = computeInitials(user.name);

  // ── RENDER ────────────────────────────────────────────────────

  return (
    <>
      <div className={`up-root ${mounted ? "is-mounted" : ""}`}>

        {/* ══ HERO ══════════════════════════════════ */}
        <section className="up-hero">
          <div className="up-hero-navy">
            <div className="up-hero-pattern" aria-hidden="true" />
            <div className="up-avatar-wrap">
              <div className="up-avatar">
                {user.profilePic
                  ? <img src={user.profilePic} alt={user.name} className="up-avatar-img" />
                  : <span>{initials}</span>}
              </div>
            </div>
            <div className="up-hero-stats">
              <div className="up-hstat"><span className="up-hstat-num">142</span><span className="up-hstat-lbl">Read</span></div>
              <div className="up-hstat-div" />
              <div className="up-hstat"><span className="up-hstat-num">746</span><span className="up-hstat-lbl">Shared</span></div>
              <div className="up-hstat-div" />
              <div className="up-hstat"><span className="up-hstat-num">38h</span><span className="up-hstat-lbl">Time</span></div>
            </div>
          </div>

          <div className="up-hero-white">
            <p className="up-eyebrow"><span className="up-eyebrow-bar" />Reader Profile</p>
            <h1 className="up-hero-name">{user.name}</h1>
            <div className="up-hero-contacts">
              <span className="up-citem"><Mail size={12} />{user.email}</span>
              {user.phone && <span className="up-citem"><Phone size={12} />{user.phone}</span>}
            </div>
            <div className="up-hero-btns">
              <button className="up-edit-btn" onClick={openEditModal}>
                <Edit2 size={13} /> Edit Profile
              </button>
              <button className="up-edit-btn up-pass-btn" onClick={() => { setPassError(null); setPassSuccess(null); setIsPassModalOpen(true); }}>
                <Lock size={13} /> Change Password
              </button>
              <button className="up-edit-btn up-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </section>

        {/* ══ TABS ══════════════════════════════════ */}
        <div className="up-tabs-bar">
          <div className="up-tabs-inner">
            <button className={`up-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
              <History size={15} /> Reading History
            </button>
            <button className={`up-tab ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
              <BarChart2 size={15} /> Analytics
            </button>
          </div>
        </div>

        {/* ══ CONTENT ═══════════════════════════════ */}
        <div className="up-content">

          {/* HISTORY */}
          {activeTab === "history" && (
            <div className="up-pane fade-up" key="h">
              <div className="up-pane-title">
                <h2>Recently Read</h2>
                <span className="up-badge">{HISTORY_ARTICLES.length} articles</span>
              </div>
              <div className="up-history-grid">
                {HISTORY_ARTICLES.map((a, i) => (
                  <Link to={`/article/${a.id}`} key={a.id} className="up-hcard" style={{ "--i": i } as React.CSSProperties}>
                    <div className="up-hcard-img">
                      <img src={a.img} alt={a.title} />
                      <span className="up-hcard-tag">{a.category}</span>
                    </div>
                    <div className="up-hcard-body">
                      <h4>{a.title}</h4>
                      <p className="up-hcard-meta"><Clock size={11} />{a.time}<span className="up-dot" />{a.read} read</p>
                    </div>
                    <div className="up-hcard-cta"><span>Read</span><ArrowRight size={13} /></div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="up-pane fade-up" key="a">
              <div className="up-pane-title">
                <h2>Your Analytics</h2>
                <span className="up-badge up-badge-green"><TrendingUp size={11} /> +24% this week</span>
              </div>
              <div className="up-analytics-grid">

                {/* Weekly chart */}
                <div className="up-acard up-acard-wide">
                  <div className="up-acard-hd"><h3>Daily Reading</h3><p>Articles read per day</p></div>
                  <div className="up-chart">
                    {WEEKLY_DATA.map((d, i) => (
                      <div key={i} className="up-chart-col" style={{ "--i": i } as React.CSSProperties}>
                        <span className="up-chart-val">{d.reads}</span>
                        <div className="up-chart-track">
                          <div className="up-chart-bar" style={{ "--h": `${(d.reads / maxReads) * 100}%` } as React.CSSProperties} />
                        </div>
                        <span className="up-chart-day">{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="up-acard">
                  <div className="up-acard-hd"><h3>Categories</h3><p>Reading distribution</p></div>
                  <div className="up-cat-list">
                    {CATEGORY_DATA.map(c => (
                      <div key={c.label} className="up-cat-row">
                        <div className="up-cat-hd">
                          <span className="up-cat-dot" style={{ background: c.color }} />
                          <span className="up-cat-name">{c.label}</span>
                          <span className="up-cat-val">{c.value}%</span>
                        </div>
                        <div className="up-track">
                          <div className="up-track-fill" style={{ "--w": `${c.value}%`, "--c": c.color } as React.CSSProperties} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div className="up-acard">
                  <div className="up-acard-hd"><h3>Share Platforms</h3><p>Where stories travel</p></div>
                  <div className="up-plat-list">
                    {PLATFORM_DATA.map(p => (
                      <div key={p.name} className="up-plat-row">
                        <span className="up-plat-dot" style={{ background: p.color }} />
                        <span className="up-plat-name">{p.name}</span>
                        <div className="up-plat-track">
                          <div className="up-plat-fill" style={{ "--w": `${p.pct}%`, "--c": p.color } as React.CSSProperties} />
                        </div>
                        <span className="up-plat-num">{p.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="up-summary-row">
                    <div className="up-summary-item"><Eye size={15} className="up-sum-icon" /><strong>142</strong><span>Reads</span></div>
                    <div className="up-summary-item"><Share2 size={15} className="up-sum-icon" /><strong>746</strong><span>Shares</span></div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ EDIT PROFILE MODAL ═════════════════════════════════ */}
      {isEditModalOpen && (
        <div className="up-overlay">
          <div className="up-modal">
            <button className="up-modal-close" onClick={() => setIsEditModalOpen(false)} disabled={editLoading}>
              <X size={17} />
            </button>

            <div className="up-modal-top">
              <div className="up-modal-av" onClick={() => fileInputRef.current?.click()} title="Change photo">
                {editProfilePic
                  ? <img src={editProfilePic} alt="Preview" className="up-avatar-img" />
                  : <span>{initials}</span>}
                <div className="up-av-overlay"><ImageIcon size={16} /></div>
              </div>
              <div>
                <p className="up-modal-tag">Edit Profile</p>
                <h2 className="up-modal-name">{user.name}</h2>
                <p className="up-modal-hint">Click avatar to change photo</p>
              </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/jpeg,image/png" style={{ display: "none" }} />

            {editError && (
              <div className="up-modal-error">
                <span>{editError}</span>
                <button onClick={() => setEditError(null)}><X size={12} /></button>
              </div>
            )}

            <form className="up-form" onSubmit={handleSaveProfile}>
              <div className="up-field">
                <label><User size={11} />Full Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required placeholder="Your full name" disabled={editLoading} />
              </div>
              <div className="up-field">
                <label><Mail size={11} />Email Address</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required placeholder="your@email.com" disabled={editLoading} />
              </div>
              <div className="up-field">
                <label><Phone size={11} />Phone Number</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 00000 00000" disabled={editLoading} />
              </div>
              <div className="up-modal-actions">
                <button type="button" className="up-btn-ghost" onClick={() => setIsEditModalOpen(false)} disabled={editLoading}>Cancel</button>
                <button type="submit" className="up-btn-primary" disabled={editLoading}>
                  {editLoading ? <><Loader2 size={14} className="spin-icon" /> Saving...</> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ CHANGE PASSWORD MODAL ══════════════════════════════ */}
      {isPassModalOpen && (
        <div className="up-overlay">
          <div className="up-modal">
            <button className="up-modal-close" onClick={() => setIsPassModalOpen(false)} disabled={passLoading}>
              <X size={17} />
            </button>
            <div className="up-modal-top">
              <div><p className="up-modal-tag">Security</p><h2 className="up-modal-name">Change Password</h2></div>
            </div>

            {passError && (
              <div className="up-modal-error">
                <span>{passError}</span>
                <button onClick={() => setPassError(null)}><X size={12} /></button>
              </div>
            )}
            {passSuccess && <div className="up-modal-success"><span>{passSuccess}</span></div>}

            <form className="up-form" onSubmit={handleChangePassword}>
              <div className="up-field">
                <label><Lock size={11} />Current Password</label>
                <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} required placeholder="Your current password" disabled={passLoading} />
              </div>
              <div className="up-field">
                <label><Lock size={11} />New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required placeholder="Minimum 6 characters" disabled={passLoading} />
              </div>
              <div className="up-field">
                <label><Lock size={11} />Confirm New Password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required placeholder="Repeat new password" disabled={passLoading} />
              </div>
              <div className="up-modal-actions">
                <button type="button" className="up-btn-ghost" onClick={() => setIsPassModalOpen(false)} disabled={passLoading}>Cancel</button>
                <button type="submit" className="up-btn-primary" disabled={passLoading}>
                  {passLoading ? <><Loader2 size={14} className="spin-icon" /> Updating...</> : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;