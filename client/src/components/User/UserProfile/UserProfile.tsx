// client/src/components/User/UserProfile/UserProfile.tsx
// ──────────────────────────────────────────────────────────────
// All data comes from the real backend. No localStorage, no static arrays.

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  History, BarChart2, Edit2, Eye,
  Share2, Clock, X, User, Mail, Phone,
  Image as ImageIcon, ArrowRight,  Loader2, Lock,
} from "lucide-react";
import "./UserProfile.css";
import {
  getMe,
  updateProfile,
  changePassword,
  logoutUser,
  getReadingHistory,
  getAnalytics,
} from "../../../api/user/userauth";
import type {
  AuthUser,
  ReadingHistoryItem,
  AnalyticsData,
} from "../../../api/user/userauth";

// ─────────────────────────────────────────────
// COLOR PALETTES (data is real, colors are just cosmetic cycling)
// ─────────────────────────────────────────────

const CATEGORY_COLORS = ["#0d1f3c", "#e60000", "#2563eb", "#64748b", "#94a3b8", "#16a34a", "#9333ea"];

const PLATFORM_COLORS: Record<string, string> = {
  whatsapp: "#25D366",
  facebook: "#1877F2",
  twitter: "#0d1f3c",
  linkedin: "#0A66C2",
  other: "#94a3b8",
};

const PLATFORM_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  twitter: "X/Twitter",
  linkedin: "LinkedIn",
  other: "Other",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function computeInitials(name: string): string {
  const words = name.trim().split(" ");
  if (words.length > 1) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
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

  // ── Reading history (last 7 days) ─────────────────────────────

  const [history,        setHistory]        = useState<ReadingHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── Analytics ──────────────────────────────────────────────────

  const [analytics,        setAnalytics]        = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

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

  // ── Load user + history + analytics on mount ──────────────────

  useEffect(() => {
    getMe()
      .then(({ user }) => {
        setUser(user);
        setEditName(user.name || "");
        setEditEmail(user.email || "");
        setEditPhone(user.phone || "");
        setEditProfilePic(user.profilePic || null);

        // Fire both in parallel once we know we're authenticated
        getReadingHistory()
          .then(({ history }) => setHistory(history))
          .catch(() => setHistory([]))
          .finally(() => setHistoryLoading(false));

        getAnalytics()
          .then((data) => setAnalytics(data))
          .catch(() => setAnalytics(null))
          .finally(() => setAnalyticsLoading(false));
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
      setPassError("The new password must be at least 6 characters long.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("The passwords do not matched.");
      return;
    }

    setPassLoading(true);
    try {
      const res = await changePassword({ currentPassword: currentPass, newPassword: newPass });
      setPassSuccess(res.message || "Password changed successfully!");
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

  const heroReads = analytics ? analytics.totals.reads : "—";
  const heroShares = analytics ? analytics.totals.shares : "—";
  const heroTime = analytics ? analytics.totals.timeLabel : "—";

  const maxDailyReads = analytics
    ? Math.max(1, ...analytics.dailyReading.map((d) => d.reads))
    : 1;

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
              <div className="up-hstat"><span className="up-hstat-num">{heroReads}</span><span className="up-hstat-lbl">Read</span></div>
              <div className="up-hstat-div" />
              <div className="up-hstat"><span className="up-hstat-num">{heroShares}</span><span className="up-hstat-lbl">Shared</span></div>
              <div className="up-hstat-div" />
              <div className="up-hstat"><span className="up-hstat-num">{heroTime}</span><span className="up-hstat-lbl">Time</span></div>
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

          {/* HISTORY — last 7 days only, real data */}
          {activeTab === "history" && (
            <div className="up-pane fade-up" key="h">
              <div className="up-pane-title">
                <h2>Recently Read</h2>
                <span className="up-badge">{history.length} article{history.length !== 1 ? "s" : ""}</span>
              </div>

              {historyLoading ? (
                <div className="up-empty-state">
                  <Loader2 size={20} className="spin-icon" />
                  <p>Loading your reading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="up-empty-state">
                  <History size={28} />
                  <p>No articles read in the last 7 days.</p>
                  <Link to="/" className="up-edit-btn">Browse News</Link>
                </div>
              ) : (
                <div className="up-history-grid">
                  {history.map((a, i) => (
                    <Link to={`/article/${a.slug}`} key={a.id} className="up-hcard" style={{ "--i": i } as React.CSSProperties}>
                      <div className="up-hcard-img">
                        {a.image
                          ? <img src={a.image} alt={a.headline} />
                          : <div className="up-hcard-img-fallback" />}
                        <span className="up-hcard-tag">{a.category}</span>
                      </div>
                      <div className="up-hcard-body">
                        <h4>{a.headline}</h4>
                        <p className="up-hcard-meta"><Clock size={11} />{timeAgo(a.readAt)}</p>
                      </div>
                      <div className="up-hcard-cta"><span>Read</span><ArrowRight size={13} /></div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS — real data */}
          {activeTab === "analytics" && (
            <div className="up-pane fade-up" key="a">
              <div className="up-pane-title">
                <h2>Your Analytics</h2>
              </div>

              {analyticsLoading ? (
                <div className="up-empty-state">
                  <Loader2 size={20} className="spin-icon" />
                  <p>Loading your analytics...</p>
                </div>
              ) : !analytics ? (
                <div className="up-empty-state">
                  <BarChart2 size={28} />
                  <p>Analytics not available right now.</p>
                </div>
              ) : (
                <div className="up-analytics-grid">

                  {/* Weekly chart */}
                  <div className="up-acard up-acard-wide">
                    <div className="up-acard-hd"><h3>Daily Reading</h3><p>Articles read per day (this week)</p></div>
                    <div className="up-chart">
                      {analytics.dailyReading.map((d, i) => (
                        <div key={d.date} className="up-chart-col" style={{ "--i": i } as React.CSSProperties}>
                          <span className="up-chart-val">{d.reads}</span>
                          <div className="up-chart-track">
                            <div className="up-chart-bar" style={{ "--h": `${(d.reads / maxDailyReads) * 100}%` } as React.CSSProperties} />
                          </div>
                          <span className="up-chart-day">{d.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="up-acard">
                    <div className="up-acard-hd"><h3>Categories</h3><p>Reading distribution</p></div>
                    {analytics.categories.length === 0 ? (
                      <p className="up-empty-inline">No reading data yet.</p>
                    ) : (
                      <div className="up-cat-list">
                        {analytics.categories.map((c, i) => {
                          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                          return (
                            <div key={c.label} className="up-cat-row">
                              <div className="up-cat-hd">
                                <span className="up-cat-dot" style={{ background: color }} />
                                <span className="up-cat-name">{c.label}</span>
                                <span className="up-cat-val">{c.value}%</span>
                              </div>
                              <div className="up-track">
                                <div className="up-track-fill" style={{ "--w": `${c.value}%`, "--c": color } as React.CSSProperties} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Platforms */}
                  <div className="up-acard">
                    <div className="up-acard-hd"><h3>Share Platforms</h3><p>Where stories travel</p></div>
                    {analytics.platforms.length === 0 ? (
                      <p className="up-empty-inline">No shares yet.</p>
                    ) : (
                      <div className="up-plat-list">
                        {analytics.platforms.map((p) => (
                          <div key={p.name} className="up-plat-row">
                            <span className="up-plat-dot" style={{ background: PLATFORM_COLORS[p.name] || "#94a3b8" }} />
                            <span className="up-plat-name">{PLATFORM_LABELS[p.name] || p.name}</span>
                            <div className="up-plat-track">
                              <div className="up-plat-fill" style={{ "--w": `${p.pct}%`, "--c": PLATFORM_COLORS[p.name] || "#94a3b8" } as React.CSSProperties} />
                            </div>
                            <span className="up-plat-num">{p.pct}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="up-summary-row">
                      <div className="up-summary-item"><Eye size={15} className="up-sum-icon" /><strong>{analytics.totals.reads}</strong><span>Reads</span></div>
                      <div className="up-summary-item"><Share2 size={15} className="up-sum-icon" /><strong>{analytics.totals.shares}</strong><span>Shares</span></div>
                    </div>
                  </div>

                </div>
              )}
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