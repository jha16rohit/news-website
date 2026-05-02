import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Livestories.css";
import { useNavigate } from "react-router-dom";
import { fetchAllNews, deleteNews as apiDeleteNews, updateNews as apiUpdateNews } from "../../../api/news";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveUpdate {
  id:        number;
  time:      string;
  text:      string;
  timestamp: string;
}

interface LiveStory {
  id:              string;   // backend UUID
  title:           string;
  articleCategory: string;
  status:          "live" | "ended" | "draft";
  views:           string;
  liveStartedAt?:  string | null;
  liveUpdates:     LiveUpdate[];
  published:       string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function timeSince(isoStr?: string | null): string {
  if (!isoStr) return "—";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
}

let nextUpdateId = 1000;

// ─── Component ────────────────────────────────────────────────────────────────
const LiveStoriesPage: React.FC = () => {
  const navigate = useNavigate();

  const [stories, setStories]             = useState<LiveStory[]>([]);
  const [loading, setLoading]             = useState(true);
  const [openMenuId, setOpenMenuId]       = useState<string | null>(null);
  const [addUpdateId, setAddUpdateId]     = useState<string | null>(null);
  const [updateInput, setUpdateInput]     = useState("");
  const [search, setSearch]               = useState("");
  const [deleteModal, setDeleteModal]     = useState<string | null>(null);
  const updateInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch live stories ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllNews({ articleType: "LIVE", limit: 100 });
     if (!data?.news) {
  setStories([]);
  return;
}

      const mapped: LiveStory[] = data.news.map((n: any) => {
      let status: LiveStory["status"] = "live";

if (n.status === "DRAFT") {
  status = "draft";
} else if (n.status === "ENDED") {
  status = "ended";
}

        return {
          id:              n.id,
          title:           n.headline,
articleCategory: n.category?.name || "",      
    status,
          views:           String(n.views ?? 0),
          liveStartedAt:   n.publishedAt || null,
          liveUpdates:     (n.liveUpdates ?? []).map((u: any, i: number) => ({
            id:        i + 1,
            time:      u.time || new Date(u.timestamp || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            text:      u.text,
            timestamp: u.timestamp || new Date().toISOString(),
          })),
          published: n.status === "ENDED"
            ? new Date(n.updatedAt || n.publishedAt || Date.now()).toLocaleDateString("en-IN", { dateStyle: "medium" })
            : "Live",
        };
      });

      setStories(mapped);
    } catch (err) {
      console.error("Failed to fetch live stories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived lists ─────────────────────────────────────────────────────────
  const liveArticles  = stories.filter(s => s.status === "live");
  const endedArticles = stories.filter(s => s.status === "ended");
  const draftArticles = stories.filter(s => s.status === "draft");

  const filterStories = (list: LiveStory[]) =>
    search ? list.filter(s => s.title.toLowerCase().includes(search.toLowerCase())) : list;

  const filteredLive  = filterStories(liveArticles);
  const filteredEnded = filterStories(endedArticles);
  const filteredDraft = filterStories(draftArticles);

  const totalUpdates = stories.reduce((s, a) => s + (a.liveUpdates?.length ?? 0), 0);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAddUpdate = async (storyId: string) => {
    if (!updateInput.trim()) return;
    const now = new Date();
    const newUpdate: LiveUpdate = {
      id:        nextUpdateId++,
      time:      now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      text:      updateInput.trim(),
      timestamp: now.toISOString(),
    };
    // Optimistic update
    setStories(prev => prev.map(s =>
      s.id === storyId ? { ...s, liveUpdates: [newUpdate, ...s.liveUpdates] } : s
    ));
    setUpdateInput("");
    setAddUpdateId(null);
    // Persist to backend
    try {
      const story = stories.find(s => s.id === storyId);
      if (story) {
        await apiUpdateNews(storyId, {
          liveUpdates: [newUpdate, ...story.liveUpdates],
        } as any);
      }
    } catch (err) { console.error("Failed to add update:", err); }
  };

  const handleEndLive = async (storyId: string) => {
    setStories(prev => prev.map(s =>
      s.id === storyId ? { ...s, status: "ended", published: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }) } : s
    ));
    try {
      await apiUpdateNews(storyId, { status: "ENDED" } as any);
    } catch (err) { console.error("Failed to end live:", err); }
  };

  const handleGoLive = async (storyId: string) => {
    setStories(prev => prev.map(s =>
      s.id === storyId ? { ...s, status: "live", liveStartedAt: new Date().toISOString(), published: "Live" } : s
    ));
    try {
      await apiUpdateNews(storyId, { status: "PUBLISHED", articleType: "LIVE" } as any);
    } catch (err) { console.error("Failed to go live:", err); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await apiDeleteNews(deleteModal);
      setStories(prev => prev.filter(s => s.id !== deleteModal));
    } catch (err) { console.error("Delete failed:", err); }
    setDeleteModal(null);
  };

  const toggleMenu = (id: string) => setOpenMenuId(openMenuId === id ? null : id);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="ls-page" onClick={() => setOpenMenuId(null)}>

      {/* Header */}
      <div className="ls-header">
        <div className="ls-header-left">
          <div className="ls-title-row">
            <span className="ls-live-icon"><span className="ls-live-dot" /></span>
            <h1 className="ls-title">Live Stories</h1>
          </div>
          <p className="ls-subtitle">Manage real-time live coverage and event updates</p>
        </div>
        <div className="ls-header-actions">
          <button className="ls-btn-refresh" onClick={loadData} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
            </svg>
            Refresh
          </button>
          <button className="ls-btn-new" onClick={() => navigate("/admin/create?type=live")}>
            <span>+</span> New Live Story
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="ls-stats">
        <div className="ls-stat-card">
          <div className="ls-stat-info">
            <span className="ls-stat-label">Currently Live</span>
            <span className="ls-stat-value">{liveArticles.length}</span>
          </div>
          <span className="ls-stat-icon ls-stat-icon--live">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <path d="M16.24 7.76a6 6 0 0 1 0 8.49" /><path d="M7.76 7.76a6 6 0 0 0 0 8.49" />
              <path d="M20.07 4.93a10 10 0 0 1 0 14.14" /><path d="M3.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
          </span>
        </div>
        <div className="ls-stat-card">
          <div className="ls-stat-info">
            <span className="ls-stat-label">Draft (Ready)</span>
            <span className="ls-stat-value">{draftArticles.length}</span>
          </div>
          <span className="ls-stat-icon ls-stat-icon--draft">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
        </div>
        <div className="ls-stat-card">
          <div className="ls-stat-info">
            <span className="ls-stat-label">Past Live</span>
            <span className="ls-stat-value">{endedArticles.length}</span>
          </div>
          <span className="ls-stat-icon ls-stat-icon--past">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </span>
        </div>
        <div className="ls-stat-card">
          <div className="ls-stat-info">
            <span className="ls-stat-label">Total Updates</span>
            <span className="ls-stat-value">{totalUpdates}</span>
          </div>
          <span className="ls-stat-icon ls-stat-icon--updates">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="ls-search-wrap">
        <svg className="ls-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input className="ls-search" type="text" placeholder="Search live stories..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* ── CURRENTLY LIVE ── */}
      <section className="ls-section">
        <div className="ls-section-header">
          <span className="ls-section-dot" />
          <h2 className="ls-section-title">Current Live</h2>
          <span className="ls-badge ls-badge--active">{filteredLive.length} active</span>
        </div>
        <div className="ls-stories-list">
          {loading && (
            <div style={{ padding: "24px", textAlign: "center", color: "#999", fontSize: "13px" }}>Loading…</div>
          )}
          {!loading && filteredLive.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: "#999", fontSize: "13px" }}>No live stories currently active</div>
          )}
          {filteredLive.map(story => (
            <div className="ls-story-card" key={story.id}>
              <div className="ls-story-main">
                <div className="ls-story-tags">
                  <span className="ls-tag ls-tag--live">LIVE</span>
                  <span className="ls-story-category">{story.articleCategory}</span>
                </div>
                <h3 className="ls-story-title">{story.title}</h3>
                <div className="ls-story-meta">
                  <span className="ls-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    Started: {story.liveStartedAt ? new Date(story.liveStartedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                  <span className="ls-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {story.liveUpdates?.length ?? 0} updates
                  </span>
                  <span className="ls-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    {story.views} views
                  </span>
                  <span className="ls-meta-item">
                    Last update: {story.liveUpdates?.length ? timeSince(story.liveUpdates[0].timestamp) : "—"}
                  </span>
                </div>

                {/* Inline Add Update */}
                {addUpdateId === story.id && (
                  <div className="ls-inline-update" onClick={e => e.stopPropagation()}>
                    <input
                      ref={updateInputRef}
                      className="ls-update-input"
                      placeholder="Write a live update..."
                      value={updateInput}
                      onChange={e => setUpdateInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddUpdate(story.id)}
                      autoFocus
                    />
                    <button className="ls-btn-go-live" style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => handleAddUpdate(story.id)}>Post</button>
                    <button className="ls-btn-edit-icon" onClick={() => { setAddUpdateId(null); setUpdateInput(""); }}>✕</button>
                  </div>
                )}
              </div>

              <div className="ls-story-actions" onClick={e => e.stopPropagation()}>
                <button className="ls-btn-add-update" onClick={() => {
                  setAddUpdateId(story.id === addUpdateId ? null : story.id);
                  setUpdateInput("");
                  setTimeout(() => updateInputRef.current?.focus(), 50);
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Add Update
                </button>
                <button className="ls-btn-end-live" onClick={() => handleEndLive(story.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  End Live
                </button>
                <div className="ls-more-wrap">
                  <button className="ls-btn-more" onClick={() => toggleMenu(story.id)}>···</button>
                  {openMenuId === story.id && (
                    <div className="ls-dropdown">
                      <button className="ls-dropdown-item" onClick={() => { navigate(`/admin/create?edit=${story.id}&type=live`); setOpenMenuId(null); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Story
                      </button>
                      <button className="ls-dropdown-item ls-dropdown-item--danger" onClick={() => { setDeleteModal(story.id); setOpenMenuId(null); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                        Delete Story
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DRAFT ── */}
      {filteredDraft.length > 0 && (
        <section className="ls-section">
          <div className="ls-section-header ls-section-header--muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <h2 className="ls-section-title">Draft — Ready to Go Live</h2>
            <span className="ls-badge ls-badge--count">{filteredDraft.length}</span>
          </div>
          <div className="ls-stories-list">
            {filteredDraft.map(story => (
              <div className="ls-story-card ls-story-card--draft" key={story.id}>
                <div className="ls-story-main">
                  <div className="ls-story-tags">
                    <span className="ls-tag ls-tag--draft">DRAFT</span>
                    <span className="ls-story-category">{story.articleCategory}</span>
                  </div>
                  <h3 className="ls-story-title">{story.title}</h3>
                  <p className="ls-story-note">Ready to go live — click "Go Live Now" to start live coverage</p>
                </div>
                <div className="ls-story-actions" onClick={e => e.stopPropagation()}>
                  <button className="ls-btn-go-live" onClick={() => handleGoLive(story.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="2" fill="white" />
                      <path d="M16.24 7.76a6 6 0 0 1 0 8.49" /><path d="M7.76 7.76a6 6 0 0 0 0 8.49" />
                    </svg>
                    Go Live Now
                  </button>
                  <button className="ls-btn-edit-icon" onClick={() => navigate(`/admin/create?edit=${story.id}&type=live`)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PAST LIVE ── */}
      <section className="ls-section">
        <div className="ls-section-header ls-section-header--muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
          <h2 className="ls-section-title">Past Live</h2>
          <span className="ls-badge ls-badge--count">{filteredEnded.length}</span>
        </div>
        <div className="ls-stories-list">
          {filteredEnded.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: "#999", fontSize: "13px" }}>No ended live stories yet</div>
          )}
          {filteredEnded.map(story => (
            <div className="ls-story-card" key={story.id}>
              <div className="ls-story-main">
                <div className="ls-story-tags">
                  <span className="ls-tag ls-tag--ended">ENDED</span>
                  <span className="ls-story-category">{story.articleCategory}</span>
                </div>
                <h3 className="ls-story-title">{story.title}</h3>
                <div className="ls-story-meta">
                  <span className="ls-meta-item">{story.published}</span>
                  <span className="ls-meta-item">{story.liveUpdates?.length ?? 0} updates</span>
                  <span className="ls-meta-item">{story.views} views</span>
                </div>
              </div>
              <div className="ls-story-actions" onClick={e => e.stopPropagation()}>
                <button className="ls-btn-icon-ghost">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <div className="ls-more-wrap">
                  <button className="ls-btn-more" onClick={() => toggleMenu(story.id)}>···</button>
                  {openMenuId === story.id && (
                    <div className="ls-dropdown">
                      <button className="ls-dropdown-item ls-dropdown-item--danger" onClick={() => { setDeleteModal(story.id); setOpenMenuId(null); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DELETE MODAL */}
      {deleteModal !== null && (
        <div className="ls-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="ls-modal" onClick={e => e.stopPropagation()}>
            <div className="ls-modal-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <h4>Delete Story?</h4>
            <p>This action cannot be undone. All updates will be lost.</p>
            <div className="ls-modal-actions">
              <button className="ls-modal-cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="ls-modal-confirm" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStoriesPage;