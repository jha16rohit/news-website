import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./ScheduledPosts.css";
import { fetchAllNews, deleteNews as apiDeleteNews, updateNews as apiUpdateNews } from "../../../api/news";
import {
  CalendarClock, FileText, Clock, ChevronLeft, ChevronRight,
  Trash2, Edit3, Eye, Send, MoreHorizontal, Search,
  AlertCircle, CheckCircle2, CalendarDays, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RemoteArticle {
  id:              string;
  title:           string;
  category:        string;
  articleCategory: string;
  status:          "Published" | "Draft" | "Scheduled";
  scheduledFor:    string | null;
  publishedAt:     string | null;
  views:           string;
}

/* ─── helpers ─── */
function formatScheduled(iso: string): { date: string; time: string; relative: string } {
  const d   = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH  = Math.floor(diffMs / 3_600_000);
  const diffD  = Math.floor(diffMs / 86_400_000);
  let relative = "";
  if (diffMs < 0)       relative = "Overdue";
  else if (diffH < 1)   relative = "< 1 hour";
  else if (diffH < 24)  relative = `In ${diffH}h`;
  else if (diffD === 1) relative = "Tomorrow";
  else                  relative = `In ${diffD} days`;
  return {
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    relative,
  };
}

/* ─── Calendar helpers ─── */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function getDaysInMonth(year: number, month: number): number { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number): number { return new Date(year, month, 1).getDay(); }

/* ─── Confirm Dialog ─── */
const ConfirmDialog: React.FC<{ message: string; onConfirm: () => void; onCancel: () => void; }> = ({ message, onConfirm, onCancel }) => (
  <div className="sp-confirm-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
    <div className="sp-confirm-box">
      <div className="sp-confirm-icon"><AlertCircle size={22} /></div>
      <p className="sp-confirm-msg">{message}</p>
      <div className="sp-confirm-actions">
        <button className="sp-btn sp-btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="sp-btn sp-btn-danger" onClick={onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
);

/* ─── Article Row Menu ─── */
const ArticleMenu: React.FC<{
  article: RemoteArticle;
  onPublish?: () => void;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ onPublish, onDelete, onEdit }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="sp-menu-wrap">
      <button className="sp-icon-btn" onClick={() => setOpen(p => !p)} aria-label="Options">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="sp-dropdown" onMouseLeave={() => setOpen(false)}>
          <button className="sp-dropdown-item" onClick={() => { onEdit(); setOpen(false); }}>
            <Edit3 size={14} /> Edit
          </button>
          {onPublish && (
            <button className="sp-dropdown-item sp-dropdown-item--publish" onClick={() => { onPublish(); setOpen(false); }}>
              <Send size={14} /> Publish Now
            </button>
          )}
          <button className="sp-dropdown-item sp-dropdown-item--danger" onClick={() => { onDelete(); setOpen(false); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const ScheduledPosts: React.FC = () => {
  const navigate = useNavigate();

  const [scheduledArticles, setScheduledArticles] = useState<RemoteArticle[]>([]);
  const [draftArticles, setDraftArticles]         = useState<RemoteArticle[]>([]);
  const [loading, setLoading]                     = useState(true);

  // Calendar state
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // Search / filter
  const [searchQuery, setSearchQuery] = useState("");

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<null | { message: string; fn: () => void }>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"scheduled" | "drafts">("scheduled");

  // ── Fetch ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const scheduledData = await fetchAllNews({ limit: 100 }).catch(() => null);

      const allNews = scheduledData?.news ?? [];

      const mapArticle = (n: any): RemoteArticle => ({
        id:              n.id,
        title:           n.headline,
        category:        n.articleType || "STANDARD",
articleCategory: n.category?.name || "",
        status:          n.status === "PUBLISHED" ? "Published" : n.status === "DRAFT" ? "Draft" : "Scheduled",
        scheduledFor:    n.scheduledAt || null,
        publishedAt:     n.publishedAt || null,
        views:           String(n.views ?? 0),
      });

      setScheduledArticles(allNews.filter((n: any) => n.status === "SCHEDULED").map(mapArticle));
      setDraftArticles(allNews.filter((n: any) => n.status === "DRAFT").map(mapArticle));
    } catch (err) {
      console.error("Failed to fetch scheduled/draft posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Calendar ── */
  const scheduledDates = useMemo(() => {
    const set = new Set<number>();
    scheduledArticles.forEach(a => {
      if (a.scheduledFor) {
        const d = new Date(a.scheduledFor);
        if (d.getFullYear() === calYear && d.getMonth() === calMonth) set.add(d.getDate());
      }
    });
    return set;
  }, [scheduledArticles, calYear, calMonth]);

  const selectedDayArticles = useMemo(() => {
    if (!selectedDay) return scheduledArticles;
    return scheduledArticles.filter(a => {
      if (!a.scheduledFor) return false;
      const d = new Date(a.scheduledFor);
      return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === selectedDay;
    });
  }, [scheduledArticles, selectedDay, calYear, calMonth]);

  const filteredScheduled = useMemo(() => {
    const base = selectedDay ? selectedDayArticles : scheduledArticles;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(a => a.title.toLowerCase().includes(q) || (a.articleCategory || "").toLowerCase().includes(q));
  }, [selectedDayArticles, scheduledArticles, selectedDay, searchQuery]);

  const filteredDrafts = useMemo(() => {
    if (!searchQuery.trim()) return draftArticles;
    const q = searchQuery.toLowerCase();
    return draftArticles.filter(a => a.title.toLowerCase().includes(q) ||(a.articleCategory || "").toLowerCase().includes(q));
  }, [draftArticles, searchQuery]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDayDow = getFirstDayOfMonth(calYear, calMonth);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1);
    setSelectedDay(null);
  };

  /* ── Actions ── */
  const confirm = (message: string, fn: () => void) => setConfirmAction({ message, fn });

  const publishNow = (article: RemoteArticle) => {
    confirm(`Publish "${article.title.slice(0, 50)}…" now?`, async () => {
      try {
        await apiUpdateNews(article.id, { status: "PUBLISHED" } as any);
        setScheduledArticles(prev => prev.filter(a => a.id !== article.id));
      } catch (err) { console.error(err); }
      setConfirmAction(null);
    });
  };

  const deleteArt = (article: RemoteArticle) => {
    confirm(`Delete "${article.title.slice(0, 50)}…"? This cannot be undone.`, async () => {
      try {
        await apiDeleteNews(article.id);
        setScheduledArticles(prev => prev.filter(a => a.id !== article.id));
        setDraftArticles(prev => prev.filter(a => a.id !== article.id));
      } catch (err) { console.error(err); }
      setConfirmAction(null);
    });
  };

  const publishDraft = (article: RemoteArticle) => {
    confirm(`Publish draft "${article.title.slice(0, 50)}…" now?`, async () => {
      try {
        await apiUpdateNews(article.id, { status: "PUBLISHED" } as any);
        setDraftArticles(prev => prev.filter(a => a.id !== article.id));
      } catch (err) { console.error(err); }
      setConfirmAction(null);
    });
  };

  /* ── Category color ── */
  const catColors: Record<string, string> = {
    Politics: "#dc2626", Business: "#2563eb", Sports: "#16a34a",
    Entertainment: "#9333ea", Technology: "#0ea5e9",
  };
  const getCatColor = (cat: string) => {
    for (const [key, val] of Object.entries(catColors)) {
      if (cat.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return "#6b7280";
  };

  return (
    <div className="sp-root">
      {confirmAction && (
        <ConfirmDialog message={confirmAction.message} onConfirm={confirmAction.fn} onCancel={() => setConfirmAction(null)} />
      )}

      {/* ── Page Header ── */}
      <header className="sp-page-header">
        <div className="sp-page-header-left">
          <h1 className="sp-page-title">Scheduled &amp; Drafts</h1>
          <p className="sp-page-subtitle">Manage your scheduled articles and saved drafts</p>
        </div>
        <div className="sp-page-header-right">
          <div className="sp-search-wrap">
            <Search size={14} className="sp-search-icon" />
            <input className="sp-search-input" placeholder="Search articles…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <button className="sp-search-clear" onClick={() => setSearchQuery("")}><X size={13} /></button>
            )}
          </div>
          <button className="sp-btn sp-btn-primary" onClick={() => navigate("/admin/create")}>
            + New Article
          </button>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <div className="sp-stats-bar">
        <div className="sp-stat sp-stat--scheduled">
          <CalendarClock size={16} />
          <span className="sp-stat-value">{scheduledArticles.length}</span>
          <span className="sp-stat-label">Scheduled</span>
        </div>
        <div className="sp-stat sp-stat--draft">
          <FileText size={16} />
          <span className="sp-stat-value">{draftArticles.length}</span>
          <span className="sp-stat-label">Drafts</span>
        </div>
        <div className="sp-stat sp-stat--today">
          <CalendarDays size={16} />
          <span className="sp-stat-value">
            {scheduledArticles.filter(a => {
              if (!a.scheduledFor) return false;
              const d = new Date(a.scheduledFor);
              return d.toDateString() === today.toDateString();
            }).length}
          </span>
          <span className="sp-stat-label">Today</span>
        </div>
        <div className="sp-stat sp-stat--overdue">
          <AlertCircle size={16} />
          <span className="sp-stat-value">
            {scheduledArticles.filter(a => a.scheduledFor && new Date(a.scheduledFor) < today).length}
          </span>
          <span className="sp-stat-label">Overdue</span>
        </div>
      </div>

      <div className="sp-body">

        {/* ── LEFT: Calendar ── */}
        <div className="sp-left-col">
          <div className="sp-calendar-card">
            <div className="sp-cal-header">
              <button className="sp-cal-nav" onClick={prevMonth} aria-label="Previous month"><ChevronLeft size={16} /></button>
              <span className="sp-cal-month-label">{MONTHS[calMonth]} {calYear}</span>
              <button className="sp-cal-nav" onClick={nextMonth} aria-label="Next month"><ChevronRight size={16} /></button>
            </div>
            <div className="sp-cal-grid">
              {DOW.map(d => <div key={d} className="sp-cal-dow">{d}</div>)}
              {Array.from({ length: firstDayDow }, (_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day     = i + 1;
                const isToday = today.getDate() === day && today.getMonth() === calMonth && today.getFullYear() === calYear;
                const hasDot  = scheduledDates.has(day);
                const isSel   = selectedDay === day;
                return (
                  <button key={day}
                    className={`sp-cal-day${isToday ? " sp-cal-day--today" : ""}${isSel ? " sp-cal-day--selected" : ""}${hasDot ? " sp-cal-day--has-events" : ""}`}
                    onClick={() => setSelectedDay(isSel ? null : day)}>
                    {day}
                    {hasDot && <span className="sp-cal-dot" />}
                  </button>
                );
              })}
            </div>
            {selectedDay && (
              <div className="sp-cal-footer">
                <span>{selectedDayArticles.length} article{selectedDayArticles.length !== 1 ? "s" : ""} on {MONTHS[calMonth]} {selectedDay}</span>
                <button className="sp-cal-clear" onClick={() => setSelectedDay(null)}>Show all</button>
              </div>
            )}
          </div>

          {/* Quick upcoming list */}
          <div className="sp-upcoming-card">
            <h3 className="sp-upcoming-title"><Clock size={14} /> Upcoming (Next 7 days)</h3>
            <div className="sp-upcoming-list">
              {scheduledArticles
                .filter(a => {
                  if (!a.scheduledFor) return false;
                  const diff = new Date(a.scheduledFor).getTime() - today.getTime();
                  return diff > 0 && diff < 7 * 86_400_000;
                })
                .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
                .slice(0, 5)
                .map(a => {
                  const { date, time } = formatScheduled(a.scheduledFor!);
                  return (
                    <div key={a.id} className="sp-upcoming-item">
                      <div className="sp-upcoming-dot" style={{ background: getCatColor(a.articleCategory) }} />
                      <div className="sp-upcoming-info">
                        <p className="sp-upcoming-headline">{a.title.slice(0, 48)}{a.title.length > 48 ? "…" : ""}</p>
                        <p className="sp-upcoming-time">{date} · {time}</p>
                      </div>
                    </div>
                  );
                })}
              {scheduledArticles.filter(a => {
                if (!a.scheduledFor) return false;
                const diff = new Date(a.scheduledFor!).getTime() - today.getTime();
                return diff > 0 && diff < 7 * 86_400_000;
              }).length === 0 && (
                <p className="sp-upcoming-empty">No articles in the next 7 days.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Tabs ── */}
        <div className="sp-right-col">

          <div className="sp-tabs">
            <button className={`sp-tab${activeTab === "scheduled" ? " sp-tab--active" : ""}`} onClick={() => setActiveTab("scheduled")}>
              <CalendarClock size={15} /> Scheduled
              {scheduledArticles.length > 0 && <span className="sp-tab-badge">{scheduledArticles.length}</span>}
            </button>
            <button className={`sp-tab${activeTab === "drafts" ? " sp-tab--active" : ""}`} onClick={() => setActiveTab("drafts")}>
              <FileText size={15} /> Drafts
              {draftArticles.length > 0 && <span className="sp-tab-badge sp-tab-badge--draft">{draftArticles.length}</span>}
            </button>
          </div>

          {/* ── SCHEDULED PANEL ── */}
          {activeTab === "scheduled" && (
            <div className="sp-panel">
              <div className="sp-panel-header">
                <h2 className="sp-panel-title">
                  {selectedDay ? `Scheduled on ${MONTHS[calMonth]} ${selectedDay}` : "All Scheduled Articles"}
                </h2>
                <span className="sp-panel-count">{filteredScheduled.length} article{filteredScheduled.length !== 1 ? "s" : ""}</span>
              </div>

              {loading ? (
                <div className="sp-empty" style={{ color: "#94a3b8", fontSize: 14 }}>Loading…</div>
              ) : filteredScheduled.length === 0 ? (
                <div className="sp-empty">
                  <CalendarClock size={40} strokeWidth={1.2} />
                  <p className="sp-empty-title">No scheduled articles</p>
                  <p className="sp-empty-sub">{selectedDay ? "No articles scheduled for this day." : "Create an article and use the Schedule button to plan ahead."}</p>
                  <button className="sp-btn sp-btn-primary" onClick={() => navigate("/admin/create")}>Create Article</button>
                </div>
              ) : (
                <div className="sp-article-list">
                  {filteredScheduled
                    .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
                    .map(article => {
                      const { date, time, relative } = formatScheduled(article.scheduledFor!);
                      const isOverdue = new Date(article.scheduledFor!) < today;
                      return (
                        <div key={article.id} className={`sp-article-row${isOverdue ? " sp-article-row--overdue" : ""}`}>
                          <div className="sp-article-color-bar" style={{ background: getCatColor(article.articleCategory) }} />
                          <div className="sp-article-main">
                            <div className="sp-article-top-row">
                              <span className={`sp-badge sp-badge--scheduled${isOverdue ? " sp-badge--overdue" : ""}`}>
                                {isOverdue ? <AlertCircle size={11} /> : <CalendarClock size={11} />}
                                {isOverdue ? "Overdue" : "Scheduled"}
                              </span>
                              <span className="sp-article-cat" style={{ color: getCatColor(article.articleCategory) }}>
                                {article.articleCategory || article.category}
                              </span>
                            </div>
                            <h3 className="sp-article-title">{article.title}</h3>
                            <div className="sp-article-meta-row">
                              <span className="sp-article-meta-item"><Clock size={12} /> {date} at {time}</span>
                              <span className={`sp-relative-badge${isOverdue ? " sp-relative-badge--overdue" : ""}`}>{relative}</span>
                            </div>
                          </div>
                          <div className="sp-article-actions">
                            <ArticleMenu
                              article={article}
                              onPublish={() => publishNow(article)}
                              onDelete={() => deleteArt(article)}
                              onEdit={() => navigate(`/admin/create?edit=${article.id}`)}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ── DRAFTS PANEL ── */}
          {activeTab === "drafts" && (
            <div className="sp-panel">
              <div className="sp-panel-header">
                <h2 className="sp-panel-title">Draft Articles</h2>
                <span className="sp-panel-count">{filteredDrafts.length} draft{filteredDrafts.length !== 1 ? "s" : ""}</span>
              </div>

              {loading ? (
                <div className="sp-empty" style={{ color: "#94a3b8", fontSize: 14 }}>Loading…</div>
              ) : filteredDrafts.length === 0 ? (
                <div className="sp-empty">
                  <FileText size={40} strokeWidth={1.2} />
                  <p className="sp-empty-title">No drafts saved</p>
                  <p className="sp-empty-sub">Save a draft while creating an article to continue editing it later.</p>
                  <button className="sp-btn sp-btn-primary" onClick={() => navigate("/admin/create")}>Create Article</button>
                </div>
              ) : (
                <div className="sp-article-list">
                  {filteredDrafts.map(article => (
                    <div key={article.id} className="sp-article-row sp-article-row--draft">
                      <div className="sp-article-color-bar sp-article-color-bar--draft" />
                      <div className="sp-article-main">
                        <div className="sp-article-top-row">
                          <span className="sp-badge sp-badge--draft"><FileText size={11} /> Draft</span>
                          <span className="sp-article-cat" style={{ color: getCatColor(article.articleCategory) }}>
                            {article.articleCategory || article.category}
                          </span>
                        </div>
                        <h3 className="sp-article-title">{article.title}</h3>
                        <div className="sp-article-meta-row">
                          <span className="sp-article-meta-item">
                            <Eye size={12} /> {article.views === "0" ? "Not published" : `${article.views} views`}
                          </span>
                          <span className="sp-draft-age">Saved draft</span>
                        </div>
                      </div>
                      <div className="sp-article-actions">
                        <button className="sp-publish-draft-btn" onClick={() => publishDraft(article)} title="Publish now">
                          <Send size={14} />
                        </button>
                        <ArticleMenu
                          article={article}
                          onPublish={() => publishDraft(article)}
                          onDelete={() => deleteArt(article)}
                          onEdit={() => navigate(`/admin/create?edit=${article.id}`)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredDrafts.length > 0 && (
                <div className="sp-draft-info-banner">
                  <CheckCircle2 size={14} />
                  <span>Drafts are only visible to admins and will not appear on the live site until published.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduledPosts;