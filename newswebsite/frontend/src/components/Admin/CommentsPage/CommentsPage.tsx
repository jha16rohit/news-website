import { useState } from "react";
import "./CommentsPage.css";
import {
  Clock,
  Check,
  AlertTriangle,
  MessageSquare,
  Search,
  ThumbsUp,
  Reply,
  Trash2,
  X,
} from "lucide-react";

type Status = "pending" | "approved" | "reported";

interface Comment {
  id: number;
  user: string;
  time: string;
  text: string;
  article?: string;
  likes?: number;
  status: Status;
  reportReason?: string;
}

/* INITIALS HELPER */
const getInitials = (name: string) => {
  const parts = name.trim().split(" ");

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return (
    parts[0][0].toUpperCase() +
    parts[parts.length - 1][0].toUpperCase()
  );
};

const CommentsPage = () => {
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "approved" | "reported"
  >("all");

  const comments: Comment[] = [
    {
      id: 1,
      user: "Rajesh Kumar",
      time: "5 minutes ago",
      text:
        "Great analysis of the current political situation. Very insightful and well-researched article.",
      article:
        "Major Policy Reform Announced: What It Means for Citizens",
      likes: 12,
      status: "pending",
    },
    {
      id: 2,
      user: "Anonymous User",
      time: "1 hour ago",
      text:
        "This is completely biased reporting. You should be ashamed of publishing such one-sided content.",
      status: "reported",
      reportReason: "Offensive content",
    },
    {
      id: 3,
      user: "Sunil Verma",
      time: "2 hours ago",
      text:
        "Excellent match coverage! The analysis of the bowling performance was spot on.",
      article: "India vs Australia: Match Highlights",
      status: "approved",
    },
  ];

  const filteredComments =
    activeTab === "all"
      ? comments
      : comments.filter((c) => c.status === activeTab);

  return (
    <div className="comments-page">
      {/* HEADER */}
      <div className="comments-header">
        <h1>Comments Moderation</h1>
        <p>Review and moderate user comments across articles</p>
      </div>

      {/* STATS */}
      <div className="comments-stats">
        <div className="comment-card">
          <div className="comment-icon warning">
            <Clock size={22} />
          </div>
          <div>
            <h2>24</h2>
            <span>Pending Review</span>
          </div>
        </div>

        <div className="comment-card">
          <div className="comment-icon success">
            <Check size={22} />
          </div>
          <div>
            <h2>1,245</h2>
            <span>Approved Today</span>
          </div>
        </div>

        <div className="comment-card">
          <div className="comment-icon danger">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2>8</h2>
            <span>Reported</span>
          </div>
        </div>

        <div className="comment-card">
          <div className="comment-icon neutral">
            <MessageSquare size={22} />
          </div>
          <div>
            <h2>45.2K</h2>
            <span>Total Comments</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="comments-toolbar">
        <div className="comment-tabs">
          <button
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Comments
          </button>

          <button
            className={`tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending <span className="count warning">24</span>
          </button>

          <button
            className={`tab ${activeTab === "reported" ? "active" : ""}`}
            onClick={() => setActiveTab("reported")}
          >
            Reported <span className="count danger">8</span>
          </button>

          <button
            className={`tab ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Approved
          </button>
        </div>

        <div className="comment-search">
          <Search size={18} />
          <input placeholder="Search comments..." />
        </div>
      </div>

      {/* COMMENTS LIST */}
      <div className="comments-list">
        {filteredComments.map((c) => {
          /* REPORTED */
          if (c.status === "reported") {
            return (
              <div key={c.id} className="comment-item reported">
                <div className="comment-avatar">
                  {getInitials(c.user)}
                </div>

                <div className="comment-body">
                  <div className="comment-top">
                    <strong>{c.user}</strong>
                    <span className="time">{c.time}</span>
                    <span className="status reported">Reported</span>
                  </div>

                  <p>{c.text}</p>

                  <div className="report-reason">
                    <strong>Report reason:</strong> {c.reportReason}
                  </div>

                  <div className="actions">
                    <button className="btn approve">
                      <Check size={16} /> Dismiss Report
                    </button>
                    <button className="btn danger">
                      <Trash2 size={16} /> Delete Comment
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          /* APPROVED */
          if (c.status === "approved") {
            return (
              <div key={c.id} className="comment-item approved">
                <div className="comment-avatar">
                  {getInitials(c.user)}
                </div>

                <div className="comment-body">
                  <div className="comment-top">
                    <strong>{c.user}</strong>
                    <span className="time">{c.time}</span>
                    <span className="status approved">Approved</span>
                  </div>

                  <p>{c.text}</p>

                  <a className="article-link">
                    on {c.article} ↗
                  </a>
                </div>
              </div>
            );
          }

          /* PENDING */
          return (
            <div key={c.id} className="comment-item">
              <div className="comment-avatar">
                {getInitials(c.user)}
              </div>

              <div className="comment-body">
                <div className="comment-top">
                  <strong>{c.user}</strong>
                  <span className="time">{c.time}</span>
                  <span className="status pending">Pending</span>
                </div>

                <p>{c.text}</p>

                <a className="article-link">
                  on {c.article} ↗
                </a>

                <div className="comment-footer">
                  <span className="likes">
                    <ThumbsUp size={16} /> {c.likes}
                  </span>

                  <div className="actions">
                    <button className="btn ghost">
                      <Reply size={16} /> Reply
                    </button>
                    <button className="btn approve">
                      <Check size={16} /> Approve
                    </button>
                    <button className="btn reject">
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentsPage;
