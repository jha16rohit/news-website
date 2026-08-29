import { useState, useEffect, useCallback } from "react";
import "./CommentsPage.css";
import {
  Clock,
  Check,
  AlertTriangle,
  MessageSquare,
  Search,
  ThumbsUp,
  Trash2,
  X,
  CornerDownRight,
  Send,
  ChevronDown
} from "lucide-react";
import {
  adminFetchCommentStats,
  adminApproveComment,
  adminRejectComment,
  adminDeleteComment,
  adminReplyComment,
} from "../../../api/user/comment";

type Status = "all" | "pending" | "approved" | "reported";

interface Comment {
  id: string;
  user: string;
  time: string;
  text: string;
  article: string; // Dynamic headline binding state
  newsId: string;
  likes: number;
  status: "pending" | "approved" | "rejected";
  reportReason?: string;
  reportCount: number;
  isReported: boolean;
}

interface Stats {
  total: string | number;
  pending: string | number;
  reported: string | number;
  approvedToday: string | number;
}

// const getInitials = (name: string) => {
//   if (!name) return "?";
//   const parts = name.trim().split(" ");
//   if (parts.length === 1) return parts[0][0].toUpperCase();
//   return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
// };

// ✅ Column count per breakpoint — mirrors the .comments-grid media queries in CommentsPage.css
const computeColumns = (width: number) => {
  if (width < 560) return 1;       // mobile
  if (width < 860) return 2;       // mini tablet
  if (width < 1280) return 3;      // tablet
  if (width < 1800) return 5;      // desktop
  return Math.max(5, Math.floor(width / 260)); // large screens, auto-adjust
};

const ROWS_PER_PAGE = 2;

const CommentsPage = () => {
  const [activeTab, setActiveTab] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, reported: 0, approvedToday: 0 });
  const [loading, setLoading] = useState(false);

  // ✅ Reply popup (modal) state — replaces the old inline reply box
  const [replyModalComment, setReplyModalComment] = useState<Comment | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");

  // ✅ Load-more pagination state, responsive per screen size
  const [columns, setColumns] = useState<number>(() =>
    typeof window !== "undefined" ? computeColumns(window.innerWidth) : 5
  );
  const [page, setPage] = useState(1);
  const visibleCount = columns * ROWS_PER_PAGE * page;

  useEffect(() => {
    const handleResize = () => setColumns(computeColumns(window.innerWidth));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminFetchCommentStats();
      if (data) {
        setStats({
          total: data.total ?? 0,
          pending: data.pending ?? 0,
          reported: data.reported ?? 0,
          approvedToday: data.approvedToday ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to load backend stats:", err);
    }
  };

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (activeTab !== "all") qs.set("status", activeTab);
      if (search.trim()) qs.set("search", search);
      qs.set("limit", "50");

      const res = await fetch(`http://localhost:5001/api/admin/comments?${qs.toString()}`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include" 
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.comments) {
          const mapped = data.comments.map((c: any) => {
            let timeLabel = "Some time ago";
            if (c.time) {
              const dateObj = new Date(c.time);
              timeLabel = isNaN(dateObj.getTime()) 
                ? c.time 
                : dateObj.toLocaleDateString("en-IN", { dateStyle: "medium" }) + " " + 
                  dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
            }

            return {
              id: c.id,
              user: c.author ?? "Unknown User",
              time: timeLabel,
              text: c.text ?? "",
              // ✅ Displays Article Heading instead of Raw ID string
              article: c.newsHeadline || "Story Headline", 
              newsId: c.newsId ?? "",
              likes: c.likes ?? 0,
              status: c.status,
              reportReason: c.isReported || c.reportCount > 0 ? "Flagged content verification pending" : undefined,
              reportCount: c.reportCount ?? 0,
              isReported: c.isReported || c.reportCount > 0,
            };
          });
          setComments(mapped);
        }
      }
    } catch (err) {
      console.error("Error fetching comments list:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, getAuthHeaders]);

  useEffect(() => {
    loadStats();
    loadComments();
    setPage(1); // ✅ reset pagination whenever the tab or search filter changes
  }, [loadComments]);

  const handleApprove = async (id: string) => {
    try {
      await adminApproveComment(id);
      loadStats(); loadComments();
    } catch { alert("Failed to approve comment"); }
  };

  const handleReject = async (id: string) => {
    try {
      await adminRejectComment(id);
      loadStats(); loadComments();
    } catch { alert("Failed to reject comment"); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this comment from the database?")) return;
    try {
      await adminDeleteComment(id);
      loadStats(); loadComments();
    } catch { alert("Failed to delete comment"); }
  };

  // ✅ Opens the reply popup for a given comment
  const openReplyModal = (c: Comment) => {
    setAdminReplyText("");
    setReplyModalComment(c);
  };

  const closeReplyModal = () => {
    setReplyModalComment(null);
    setAdminReplyText("");
  };

  // ✅ 3. DISPATCH OFFICIAL ADMIN REPLY SUBMIT HANDLER
  const handleAdminReplySubmit = async (commentId: string, newsId: string) => {
    if (!adminReplyText.trim()) return;
    try {
      await adminReplyComment(commentId, newsId, adminReplyText.trim());
      alert("Official reply posted successfully!");
      closeReplyModal();
      loadComments();
    } catch (err) {
      alert("Failed to submit official admin reply context.");
    }
  };

  const visibleComments = comments.slice(0, visibleCount);
  const hasMore = comments.length > visibleCount;

  return (
    <div className="comments-page">
      {/* HEADER */}
      <div className="comments-header">
        <h1>Comments Moderation</h1>
        <p>Review and moderate user comments across articles dynamically</p>
      </div>

      {/* STATS CARDS */}
      <div className="comments-stats">
        <div className="comment-card">
          <div className="comment-icon warning"><Clock size={22} /></div>
          <div>
            <h2>{stats.pending}</h2>
            <span>Pending Review</span>
          </div>
        </div>

        <div className="comment-card">
          <div className="comment-icon success"><Check size={22} /></div>
          <div>
            <h2>{stats.approvedToday}</h2>
            <span>Approved Today</span>
          </div>
        </div>

        <div className="comment-card">
          <div className="comment-icon danger"><AlertTriangle size={22} /></div>
          <div>
            <h2>{stats.reported}</h2>
            <span>Reported</span>
          </div>
        </div>

        <div className="comment-card">
          <div className="comment-icon neutral"><MessageSquare size={22} /></div>
          <div>
            <h2>{stats.total}</h2>
            <span>Total Comments</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR CONTROLS */}
      <div className="comments-toolbar">
        <div className="comment-tabs">
          <button className={`tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>All Comments</button>
          <button className={`tab ${activeTab === "pending" ? "active" : ""}`} onClick={() => setActiveTab("pending")}>Pending <span className="count warning">{stats.pending}</span></button>
          <button className={`tab ${activeTab === "reported" ? "active" : ""}`} onClick={() => setActiveTab("reported")}>Reported <span className="count danger">{stats.reported}</span></button>
          <button className={`tab ${activeTab === "approved" ? "active" : ""}`} onClick={() => setActiveTab("approved")}>Approved</button>
        </div>

        <div className="comment-search">
          <Search size={18} />
          <input placeholder="Search comments..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* RENDER COMMENTS SYSTEM — CARD GRID */}
      <div className="comments-grid">
        {loading ? (
          <div className="comments-empty-state">⏳ Loading direct database entries…</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty-state">No comments found in this tab.</div>
        ) : (
          visibleComments.map((c) => {
            const isReportedMode = activeTab === "reported" || c.isReported || c.status === "rejected";

            /* 🟥 CASE 1: REPORTED CARD */
            if (isReportedMode) {
              return (
                <div key={c.id} className="comment-card-item reported">
                  <div className="cci-top">
                    {/* <div className="cci-avatar">{getInitials(c.user)}</div> */}
                    <div className="cci-identity">
                      <strong>{c.user}</strong>
                      <span className="cci-time">{c.time}</span>
                    </div>
                    <span className="status reported">{c.reportCount} flags</span>
                  </div>

                  <p className="cci-text">{c.text}</p>

                  <div className="cci-report-reason">
                    <strong>on:</strong> {c.article}
                  </div>

                  <div className="cci-actions">
                    <button className="btn approve" onClick={() => handleApprove(c.id)}>
                      <Check size={14} /> Approve
                    </button>
                    <button className="btn danger" onClick={() => handleDelete(c.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            }

            /* 🟩 CASE 2: APPROVED CARD */
            if (c.status === "approved") {
              return (
                <div key={c.id} className="comment-card-item approved">
                  <div className="cci-top">
                    {/* <div className="cci-avatar">{getInitials(c.user)}</div> */}
                    <div className="cci-identity">
                      <strong>{c.user}</strong>
                      <span className="cci-time">{c.time}</span>
                    </div>
                    <span className="status approved">Approved</span>
                  </div>

                  <p className="cci-text">{c.text}</p>

                  <a className="cci-article-link" title={c.article}>on {c.article} ↗</a>

                  <div className="cci-footer">
                    <span className="cci-likes">
                      <ThumbsUp size={13} /> {c.likes}
                    </span>
                    <div className="cci-actions">
                      <button className="btn reply-toggle" onClick={() => openReplyModal(c)}>
                        <CornerDownRight size={13} /> Reply
                      </button>
                      <button className="btn reject-revoke-ui" onClick={() => handleReject(c.id)}>
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            /* 🟨 CASE 3: PENDING CARD */
            return (
              <div key={c.id} className="comment-card-item pending">
                <div className="cci-top">
                  {/* <div className="cci-avatar">{getInitials(c.user)}</div> */}
                  <div className="cci-identity">
                    <strong>{c.user}</strong>
                    <span className="cci-time">{c.time}</span>
                  </div>
                  <span className="status pending">Pending</span>
                </div>

                <p className="cci-text">{c.text}</p>

                <a className="cci-article-link" title={c.article}>on {c.article} ↗</a>

                <div className="cci-footer">
                  <span className="cci-likes">
                    <ThumbsUp size={13} /> {c.likes}
                  </span>
                  <div className="cci-actions">
                    <button className="btn approve" onClick={() => handleApprove(c.id)}>
                      <Check size={14} /> Approve
                    </button>
                    <button className="btn reject" onClick={() => handleReject(c.id)}>
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ✅ LOAD MORE — reveals the next 2 rows worth of cards for the current screen size */}
      {!loading && hasMore && (
        <div className="comments-load-more-wrap">
          <button className="comments-load-more" onClick={() => setPage((p) => p + 1)}>
            Load More <ChevronDown size={16} />
          </button>
        </div>
      )}

      {/* ✅ REPLY POPUP — shows the full comment text plus the reply box */}
      {replyModalComment && (
        <div className="reply-modal-overlay" onClick={closeReplyModal}>
          <div className="reply-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reply-modal-header">
              <div className="cci-identity">
                <strong>{replyModalComment.user}</strong>
                <span className="cci-time">{replyModalComment.time}</span>
              </div>
              <button className="reply-modal-close" onClick={closeReplyModal}>
                <X size={18} />
              </button>
            </div>

            <div className="reply-modal-body">
              <p className="reply-modal-text">{replyModalComment.text}</p>
              <a className="cci-article-link" title={replyModalComment.article}>
                on {replyModalComment.article} ↗
              </a>
            </div>

            <div className="reply-modal-footer">
              <textarea
                className="reply-modal-textarea"
                placeholder="Write official admin reply..."
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                rows={3}
                autoFocus
              />
              <button
                className="reply-modal-send"
                onClick={() => handleAdminReplySubmit(replyModalComment.id, replyModalComment.newsId)}
              >
                <Send size={14} /> Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsPage;