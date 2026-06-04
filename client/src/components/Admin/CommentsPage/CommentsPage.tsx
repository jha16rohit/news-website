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
  Send
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

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
};

const CommentsPage = () => {
  const [activeTab, setActiveTab] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, reported: 0, approvedToday: 0 });
  const [loading, setLoading] = useState(false);

  // Inline admin reply control tokens
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");

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

  // ✅ 3. DISPATCH OFFICIAL ADMIN REPLY SUBMIT HANDLER
  const handleAdminReplySubmit = async (commentId: string, newsId: string) => {
    if (!adminReplyText.trim()) return;
    try {
      await adminReplyComment(commentId, newsId, adminReplyText.trim());
      setAdminReplyText("");
      setReplyingToId(null);
      alert("Official reply posted successfully!");
      loadComments();
    } catch (err) {
      alert("Failed to submit official admin reply context.");
    }
  };

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

      {/* RENDER COMMENTS SYSTEM */}
      <div className="comments-list">
        {loading ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>⏳ Loading direct database entries…</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No comments found in this tab.</div>
        ) : (
          comments.map((c) => {
          //  const isPendingMode = c.status === "pending" && !c.isReported;
            const isReportedMode = activeTab === "reported" || c.isReported || c.status === "rejected";

            /* 🟥 CASE 1: DISPLAY REPORTED CARD CONDITION */
            if (isReportedMode) {
              return (
                <div key={c.id} className="comment-item reported">
                  <div className="comment-avatar">{getInitials(c.user)}</div>
                  <div className="comment-body">
                    <div className="comment-top">
                      <strong>{c.user}</strong>
                      <span className="time">{c.time}</span>
                      <span className="status reported">Reported ({c.reportCount} flags)</span>
                    </div>
                    <p>{c.text}</p>
                    <div className="report-reason" style={{ margin: "6px 0", padding: "6px 10px", background: "#fff1f1", borderRadius: 6, fontSize: 13, color: "#c53030" }}>
                      <strong>on Article:</strong> {c.article}
                    </div>
                    <div className="actions">
                      <button className="btn approve" onClick={() => handleApprove(c.id)}><Check size={16} /> Dismiss / Approve</button>
                      <button className="btn danger" onClick={() => handleDelete(c.id)}><Trash2 size={16} /> Delete Comment</button>
                    </div>
                  </div>
                </div>
              );
            }

            /* 🟩 CASE 2: DISPLAY APPROVED CARD CONDITION */
            if (c.status === "approved") {
              return (
                <div key={c.id} className="comment-item approved">
                  <div className="comment-avatar">{getInitials(c.user)}</div>
                  <div className="comment-body">
                    <div className="comment-top">
                      <strong>{c.user}</strong>
                      <span className="time">{c.time}</span>
                      <span className="status approved">Approved</span>
                    </div>
                    <p>{c.text}</p>
                    <span className="article-link" style={{ color: "#2563eb", display: "inline-block", margin: "4px 0", fontSize: 13, fontWeight: 500 }}>
                      on {c.article} ↗
                    </span>
                    <div className="comment-footer" style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="likes" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#64748b" }}>
                        <ThumbsUp size={15} /> {c.likes} Likes
                      </span>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn reply-toggle" style={{ border: "1px solid #cbd5e1", padding: "4px 10px", background: "#f8fafc", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }} onClick={() => setReplyingToId(replyingToId === c.id ? null : c.id)}>
                          <CornerDownRight size={13} /> Official Reply
                        </button>
                        <button className="btn reject-revoke-ui" style={{ fontSize: 12, padding: "4px 10px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer" }} onClick={() => handleReject(c.id)}>
                          Revoke Approval
                        </button>
                      </div>
                    </div>

                    {/* ADMIN REPLY BOX PLUG */}
                    {replyingToId === c.id && (
                      <div className="admin-reply-box-wrap" style={{ marginTop: 12, borderLeft: "3px solid #6366f1", paddingLeft: 12 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input type="text" className="cna-input" style={{ flex: 1, padding: "6px 12px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6 }} placeholder="Write official admin reply..." value={adminReplyText} onChange={(e) => setAdminReplyText(e.target.value)} />
                          <button style={{ padding: "6px 12px", background: "#6366f1", color: "white", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }} onClick={() => handleAdminReplySubmit(c.id, c.newsId)}>
                            <Send size={12} /> Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            /* 🟨 CASE 3: DISPLAY PENDING CARD CONDITION */
            return (
              <div key={c.id} className="comment-item">
                <div className="comment-avatar">{getInitials(c.user)}</div>
                <div className="comment-body">
                  <div className="comment-top">
                    <strong>{c.user}</strong>
                    <span className="time">{c.time}</span>
                    <span className="status pending">Pending</span>
                  </div>
                  <p>{c.text}</p>
                  <span className="article-link" style={{ color: "#2563eb", display: "inline-block", margin: "4px 0", fontSize: 13, fontWeight: 500 }}>
                    on {c.article} ↗
                  </span>
                  <div className="comment-footer" style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="likes" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#64748b" }}>
                      <ThumbsUp size={15} /> {c.likes} Likes
                    </span>
                    <div className="actions" style={{ display: "flex", gap: 8 }}>
                      <button className="btn approve" onClick={() => handleApprove(c.id)}><Check size={14} /> Approve</button>
                      <button className="btn reject" onClick={() => handleReject(c.id)}><X size={14} /> Reject</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommentsPage;