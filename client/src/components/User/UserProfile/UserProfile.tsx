// client/src/components/User/UserProfile/UserProfile.tsx
// ──────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  History, BarChart2, Edit2, X, Mail, Image as ImageIcon, 
  Loader2, Lock, MessageSquare, CalendarDays, Smartphone, 
<<<<<<< HEAD
  Globe, Mic, LogOut, Phone, Trash2
=======
  Globe, Mic, LogOut, Phone, Trash2,
>>>>>>> Testing
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
<<<<<<< HEAD

import type { AuthUser } from "../../../api/user/userauth";

// ─────────────────────────────────────────────
// LOCAL TYPES (Ensures no import errors)
// ─────────────────────────────────────────────
export interface ReadingHistoryItem {
  id: string;
  slug: string;
  image?: string;
  headline: string;
  category: string;
  readAt: string;
}

export interface AnalyticsData {
  totals: { reads: number | string; shares: number | string; timeLabel: string };
  dailyReading: { date: string; day: string; reads: number }[];
  categories: { label: string; value: number }[];
  platforms: { name: string; pct: number }[];
}

// 👇 TEMPORARY MOCKS: Prevents White Screen of Death until you build these APIs 👇
const getReadingHistory = async () => {
  return { history: [] }; // Returns empty history for now
};

const getAnalytics = async () => {
  return null; // Returns empty analytics for now
};

// ─────────────────────────────────────────────
// COLOR PALETTES
// ─────────────────────────────────────────────
const CATEGORY_COLORS = ["#0b1423", "#e60000", "#2563eb", "#64748b", "#94a3b8", "#16a34a", "#9333ea"];

const PLATFORM_COLORS: Record<string, string> = {
  whatsapp: "#25D366", facebook: "#1877F2", instagram: "#E13060", twitter: "#0b1423",
  linkedin: "#0A66C2", other: "#94a3b8",
};

=======
import type {
  AuthUser,
  ReadingHistoryItem,
  AnalyticsData,
} from "../../../api/user/userauth";
import { fetchMyComments } from "../../../api/user/comment";
import type { MyComment } from "../../../api/user/comment";

// ─────────────────────────────────────────────
// COLOR PALETTES
// ─────────────────────────────────────────────
const CATEGORY_COLORS = ["#0b1423", "#e60000", "#2563eb", "#64748b", "#94a3b8", "#16a34a", "#9333ea"];

// 👇 NEW: Added back for Share Platforms
const PLATFORM_COLORS: Record<string, string> = {
  whatsapp: "#25D366", facebook: "#1877F2", instagram: "#E13060", twitter: "#0b1423",
  linkedin: "#0A66C2", other: "#94a3b8",
};

>>>>>>> Testing
const PLATFORM_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", facebook: "Facebook", instagram: "Instagram", twitter: "X/Twitter",
  linkedin: "LinkedIn", other: "Other",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function computeInitials(name: string): string {
  const words = name.trim().split(" ");
  if (words.length > 1) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatDateMatch(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
<<<<<<< HEAD
=======

function formatMemberSince(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
>>>>>>> Testing

const UserProfile: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"history" | "saved" | "comments" | "analytics">("history");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // ── User state ───────────────────
  const [user, setUser] = useState<AuthUser | null>(null);

  // ── Reading history ─────────────────────────────
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── Analytics ──────────────────────────────────────────────────
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

<<<<<<< HEAD
=======
  // ── My comments ────────────────────────────────────────────────
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

>>>>>>> Testing
  // ── Edit profile form state ───────────────────────────────────
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editProfilePic, setEditProfilePic] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Change password form state ───────────────────────────────
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(({ user }) => {
        setUser(user);
        setEditName(user.name || "");
        setEditEmail(user.email || "");
        setEditPhone(user.phone || "");
        setEditProfilePic(user.profilePic || null);

        getReadingHistory()
<<<<<<< HEAD
          .then((res: any) => setHistory(res.history))
=======
          .then(({ history }) => setHistory(history))
>>>>>>> Testing
          .catch(() => setHistory([]))
          .finally(() => setHistoryLoading(false));

        getAnalytics()
<<<<<<< HEAD
          .then((data: any) => setAnalytics(data))
          .catch(() => setAnalytics(null))
          .finally(() => setAnalyticsLoading(false));
=======
          .then((data) => setAnalytics(data))
          .catch(() => setAnalytics(null))
          .finally(() => setAnalyticsLoading(false));

        fetchMyComments()
          .then(({ comments }) => setMyComments(comments))
          .catch(() => setMyComments([]))
          .finally(() => setCommentsLoading(false));
>>>>>>> Testing
      })
      .catch(() => navigate("/"))
      .finally(() => {
        setPageLoading(false);
        requestAnimationFrame(() => setMounted(true));
      });
  }, [navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditLoading(true);

    try {
      const { user: updated } = await updateProfile({
        name: editName,
        email: editEmail,
        phone: editPhone || undefined,
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

  const handleLogout = async () => {
    await logoutUser().catch(() => {});
    navigate("/");
  };

  const openEditModal = () => {
    if (!user) return;
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || "");
    setEditProfilePic(user.profilePic || null);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  if (pageLoading) {
    return (
      <div className="up-loader-wrapper">
        <Loader2 size={24} className="spin-icon" />
        <span>Loading profile...</span>
      </div>
    );
  }

  if (!user) return null;

  const initials = computeInitials(user.name);
  const heroReads = analytics ? analytics.totals.reads : "0";
  const heroShares = analytics ? analytics.totals.shares : "—";
  const heroTime = analytics ? analytics.totals.timeLabel : "0m";
<<<<<<< HEAD
  const maxDailyReads = analytics ? Math.max(1, ...analytics.dailyReading.map((d: any) => d.reads)) : 1;
=======
  const maxDailyReads = analytics ? Math.max(1, ...analytics.dailyReading.map((d) => d.reads)) : 1;
  // analytics.categories already comes sorted by % descending from the API
  const topCategories = analytics ? analytics.categories.slice(0, 3) : [];

>>>>>>> Testing

  return (
    <>
      <div className={`up-root ${mounted ? "is-mounted" : ""}`}>
        <div className="up-content-wrapper">
          
          {/* ══ HERO CARD ══════════════════════════════════ */}
          <section className="up-hero-card">
            
            {/* Left Navy Column */}
            <div className="up-hero-left">
              <div className="up-avatar-ring">
                <div className="up-avatar">
                  {user.profilePic
                    ? <img src={user.profilePic} alt={user.name} className="up-avatar-img" />
                    : <span>{initials}</span>}
                </div>
              </div>
              <h2 className="up-left-name">{user.name}</h2>

              
              <div className="up-left-stats">
                <div className="up-lstat">
                  <strong>{heroReads}</strong>
                  <span>ARTICLES READ</span>
                </div>
                <div className="up-lstat-divider" />
                <div className="up-lstat">
                  <strong>{heroShares}</strong>
                  <span>SHARED</span>
                </div>
                <div className="up-lstat-divider" />
                <div className="up-lstat">
                  <strong>{heroTime}</strong>
                  <span>READ TIME</span>
                </div>
              </div>

              <div className="up-left-member">
<<<<<<< HEAD
                <CalendarDays size={14} /> Member since Jan 2024
=======
                <CalendarDays size={14} /> Member since {formatMemberSince(user.createdAt)}
>>>>>>> Testing
              </div>
            </div>

            {/* Right White Column */}
            <div className="up-hero-right">
              <div className="up-r-top">
                <div className="up-r-info-block">
                  <p className="up-r-eyebrow">READER PROFILE</p>
                  <h1 className="up-r-name">{user.name}</h1>
                  <div className="up-r-contact">
                    <span><Mail size={15} /> {user.email}</span>
                    {user.phone && <span><Phone size={15} /> {user.phone}</span>}
                  </div>
                  
                  <div className="up-r-interests">
                    <p className="up-r-interests-lbl">Followed Topics</p>
                    <div className="up-r-interests-tags">
<<<<<<< HEAD
                      <span className="up-interest-tag">Technology</span>
                      <span className="up-interest-tag">Frontend Web Dev</span>
                      <span className="up-interest-tag">Education</span>
=======
                      {topCategories.length > 0 ? (
                        topCategories.map((c) => (
                          <span key={c.label} className="up-interest-tag">{c.label}</span>
                        ))
                      ) : (
                        <span className="up-interest-tag up-interest-tag-empty">
                          {analyticsLoading ? "Loading…" : "Read some articles to see your top topics"}
                        </span>
                      )}
>>>>>>> Testing
                    </div>
                  </div>
                </div>
                
                {/* Decorative Graphic */}
                <div className="up-r-graphic">
                  <div className="up-g-globe"><Globe size={80} strokeWidth={1} /></div>
                  <div className="up-g-phone"><Smartphone size={60} strokeWidth={1.5} /></div>
                  <div className="up-g-mic"><Mic size={28} /></div>
                  <div className="up-g-badge">BREAKING<br/>NEWS</div>
                  <div className="up-g-badge-bottom">NEWS</div>
                </div>
              </div>

              <div className="up-hero-btns">
                <button className="up-btn up-btn-red" onClick={openEditModal}>
                  <Edit2 size={14} /> Edit Profile
                </button>
                <button className="up-btn up-btn-outline" onClick={() => { setPassError(null); setPassSuccess(null); setIsPassModalOpen(true); }}>
                  <Lock size={14} /> Change Password
                </button>
                <button className="up-btn up-btn-outline" onClick={handleLogout}>
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          </section>

          {/* ══ TABS ══════════════════════════════════ */}
          <div className="up-tabs-container">
            <button className={`up-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
              <History size={16} /> Reading History
            </button>
            <button className={`up-tab ${activeTab === "comments" ? "active" : ""}`} onClick={() => setActiveTab("comments")}>
              <MessageSquare size={16} /> My Comments
            </button>
            <button className={`up-tab ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
              <BarChart2 size={16} /> Analytics
            </button>
          </div>

          {/* ══ CONTENT AREA ═══════════════════════════════ */}
          <div className="up-tab-content">

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <div className="up-pane fade-up" key="h">
                <div className="up-pane-header">
                  <h2>Recently Read</h2>
                  <Link to="/" className="up-view-all">View All</Link>
                </div>

                {historyLoading ? (
                  <div className="up-empty-state"><Loader2 size={24} className="spin-icon" /><p>Loading history...</p></div>
                ) : history.length === 0 ? (
                  <div className="up-empty-state"><History size={32} /><p>No articles read recently.</p></div>
                ) : (
                  <div className="up-cards-grid">
<<<<<<< HEAD
                    {history.map((a: any, i: number) => (
=======
                    {history.map((a, i) => (
>>>>>>> Testing
                      <Link to={`/article/${a.slug}`} key={a.id} className="up-news-card" style={{ "--i": i } as React.CSSProperties}>
                        <div className="up-nc-img-wrap">
                          {a.image ? <img src={a.image} alt={a.headline} /> : <div className="up-nc-fallback" />}
                          <span className="up-nc-badge">{a.category}</span>
                        </div>
                        <div className="up-nc-body">
                          <h4 className="up-nc-title">{a.headline}</h4>
                          <div className="up-nc-meta">
                            <span>2 min read</span>
                            <span>{formatDateMatch(a.readAt)}</span>
                          </div>
                          <div className="up-nc-tags">
                            <span className="up-tag-pill">{a.category}</span>
                            <span className="up-tag-pill">News</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

<<<<<<< HEAD
            {/* COMMENTS TAB (Placeholder) */}
            {activeTab === "comments" && (
              <div className="up-pane fade-up" key="c">
                <div className="up-pane-header"><h2>My Comments</h2></div>
                <div className="up-empty-state"><MessageSquare size={32} /><p>No comments posted yet.</p></div>
=======
            {/* COMMENTS TAB */}
            {activeTab === "comments" && (
              <div className="up-pane fade-up" key="c">
                <div className="up-pane-header"><h2>My Comments</h2></div>
                {commentsLoading ? (
                  <div className="up-empty-state"><Loader2 size={24} className="spin-icon" /><p>Loading comments...</p></div>
                ) : myComments.length === 0 ? (
                  <div className="up-empty-state"><MessageSquare size={32} /><p>No comments posted yet.</p></div>
                ) : (
                  <div className="up-comments-list">
                    {myComments.map((c) => (
                      <Link
                        to={c.newsSlug ? `/article/${c.newsSlug}` : "#"}
                        key={c.id}
                        className="up-comment-card"
                      >
                        <div className="up-comment-meta">
                          <span className="up-comment-news">
                            {c.isReply ? "Reply on: " : ""}{c.newsHeadline}
                          </span>
                          <span className="up-comment-date">{formatDateMatch(c.time)}</span>
                        </div>
                        <p className="up-comment-text">{c.text}</p>
                        <div className="up-comment-stats">
                          <span>👍 {c.likes}</span>
                          <span>👎 {c.dislikes}</span>
                          {c.status !== "approved" && (
                            <span className={`up-comment-status up-comment-status-${c.status}`}>
                              {c.status}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
>>>>>>> Testing
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div className="up-pane fade-up" key="a">
                <div className="up-pane-header"><h2>Your Analytics</h2></div>
                {analyticsLoading ? (
                  <div className="up-empty-state"><Loader2 size={24} className="spin-icon" /><p>Loading analytics...</p></div>
                ) : !analytics ? (
                  <div className="up-empty-state"><BarChart2 size={32} /><p>Analytics not available.</p></div>
                ) : (
                  <div className="up-analytics-grid">
                    <div className="up-acard up-acard-wide">
                      <div className="up-acard-hd"><h3>Daily Reading</h3></div>
                      <div className="up-chart">
<<<<<<< HEAD
                        {analytics.dailyReading.map((d: any, i: number) => (
=======
                        {analytics.dailyReading.map((d, i) => (
>>>>>>> Testing
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

                    <div className="up-acard">
                      <div className="up-acard-hd"><h3>Categories</h3></div>
                      <div className="up-cat-list">
<<<<<<< HEAD
                        {analytics.categories.map((c: any, i: number) => (
=======
                        {analytics.categories.map((c, i) => (
>>>>>>> Testing
                          <div key={c.label} className="up-cat-row">
                            <span className="up-cat-name"><span className="up-cat-dot" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}/>{c.label}</span>
                            <span className="up-cat-val">{c.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

<<<<<<< HEAD
=======
                    {/* 👇 NEW: Platforms Card exactly like you asked 👇 */}
>>>>>>> Testing
                    <div className="up-acard">
                      <div className="up-acard-hd"><h3>Share Platforms</h3></div>
                      {analytics.platforms.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "var(--up-muted)" }}>No shares yet.</p>
                      ) : (
                        <div className="up-plat-list">
<<<<<<< HEAD
                          {analytics.platforms.map((p: any) => (
=======
                          {analytics.platforms.map((p) => (
>>>>>>> Testing
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
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ EDIT PROFILE MODAL ═════════════════════════════════ */}
      {isEditModalOpen && (
        <div className="up-overlay">
          <div className="up-modal">
            <button className="up-modal-close" onClick={() => setIsEditModalOpen(false)} disabled={editLoading}><X size={17} /></button>
            <div className="up-modal-top">
              <div className="up-modal-av-container">
                <div className="up-modal-av" onClick={() => fileInputRef.current?.click()} title="Change photo">
                  {editProfilePic ? <img src={editProfilePic} alt="Preview" className="up-avatar-img" /> : <span>{initials}</span>}
                  <div className="up-av-overlay"><ImageIcon size={16} /></div>
                </div>
                {editProfilePic && (
                  <button type="button" className="up-remove-photo-btn" onClick={() => setEditProfilePic(null)}>
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
              
              <div>
                <p className="up-modal-tag">Edit Profile</p>
                <h2 className="up-modal-name">{user.name}</h2>
              </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/jpeg,image/png" style={{ display: "none" }} />

            {editError && (
              <div className="up-modal-error"><span>{editError}</span><button onClick={() => setEditError(null)}><X size={12} /></button></div>
            )}

            <form className="up-form" onSubmit={handleSaveProfile}>
              <div className="up-field">
                <label>Full Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required disabled={editLoading} />
              </div>
              <div className="up-field">
                <label>Email Address</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required disabled={editLoading} />
              </div>
              <div className="up-field">
                <label>Phone Number</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} disabled={editLoading} />
              </div>
              <div className="up-modal-actions">
                <button type="button" className="up-btn-ghost" onClick={() => setIsEditModalOpen(false)} disabled={editLoading}>Cancel</button>
                <button type="submit" className="up-btn-primary" disabled={editLoading}>
                  {editLoading ? <Loader2 size={14} className="spin-icon" /> : "Save Changes"}
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
            <button className="up-modal-close" onClick={() => setIsPassModalOpen(false)} disabled={passLoading}><X size={17} /></button>
            <div className="up-modal-top">
              <div><p className="up-modal-tag">Security</p><h2 className="up-modal-name">Change Password</h2></div>
            </div>

            {passError && <div className="up-modal-error"><span>{passError}</span><button onClick={() => setPassError(null)}><X size={12} /></button></div>}
            {passSuccess && <div className="up-modal-success"><span>{passSuccess}</span></div>}

            <form className="up-form" onSubmit={handleChangePassword}>
              <div className="up-field"><label>Current Password</label><input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} required disabled={passLoading} /></div>
              <div className="up-field"><label>New Password</label><input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required disabled={passLoading} /></div>
              <div className="up-field"><label>Confirm New Password</label><input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required disabled={passLoading} /></div>
              <div className="up-modal-actions">
                <button type="button" className="up-btn-ghost" onClick={() => setIsPassModalOpen(false)} disabled={passLoading}>Cancel</button>
                <button type="submit" className="up-btn-primary" disabled={passLoading}>
                  {passLoading ? <Loader2 size={14} className="spin-icon" /> : "Update Password"}
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