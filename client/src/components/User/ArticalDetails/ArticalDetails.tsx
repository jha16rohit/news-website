import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar, Clock, User, Share2, Facebook, Instagram,
  ThumbsUp, ThumbsDown, MessageSquare, MoreHorizontal,
  ChevronDown, Flag, Copy, Tag, MapPin, ArrowRight,
  Zap, Camera
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import "./ArticalDetails.css";
import Advertisement from "../Advertisment/Advertisment";
import { votePoll } from "../../../api/user/poll";


// ─── Types ────────────────────────────────────────────────────────────────────
type VoteType = "like" | "dislike" | null;

interface CommentType {
  id: number;
  author: string;
  avatar: string;
  profilePic?: string | null;
  time: string;
  text: string;
  likes: number;
  dislikes: number;
  userVote: VoteType;
  isVerified?: boolean;
  replies: CommentType[];
}

interface LiveUpdate {
  id: number;
  time: string;
  text: string;
  timestamp: string;
  title?: string;
  isHighlight?: boolean;
  isBreaking?: boolean;
  imageUrl?: string;
  imageCaption?: string;
  imageCredit?: string;
  tweetUrl?: string;
  poll?: {
    question: string;
    totalVotes?: number;
    options: {
      id: string;
      label: string;
      votes: number;
    }[];
  };
  sourceUrl?: string;
  sourceLabel?: string;
  tags?: string[];
}

interface ArticleData {
  id: string;
  headline: string;
  shortTitle?: string;
  excerpt?: string;
  content: string;
  category: string;
  categoryId?: string;
  author: string;
  publishedAt?: string;
  readTime: string;
  imageUrl?: string;
  imageCaption?: string;
  photoCredit?: string;
  isLive: boolean;
  isBreaking: boolean;
  liveUpdates: LiveUpdate[];
  tags: string[];
  views: number;
  location?: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  language?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE = "http://localhost:5001/api";
const MOCK_USERS = ["Aditi Sharma", "Noah Pierre", "Skill Sprout", "Mollie Hall"];


const INITIAL_COMMENTS: CommentType[] = [
  {
    id: 1, author: "Noah Pierre", avatar: "NP", profilePic: null,
    time: "58 minutes ago",
    text: "Great coverage! Keep up the excellent journalism.",
    likes: 25, dislikes: 3, userVote: null,
    replies: [
      {
        id: 2, author: "LocalNewz", avatar: "LN", profilePic: null,
        isVerified: true, time: "8 minutes ago",
        text: "Thank you for your kind words! We strive to bring accurate and timely news.",
        likes: 2, dislikes: 0, userVote: null, replies: [],
      },
    ],
  },
  {
    id: 3, author: "Mollie Hall", avatar: "MH", profilePic: null,
    time: "5 hours ago",
    text: "Very informative article. Shared with my network!",
    likes: 12, dislikes: 1, userVote: null, replies: [],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatDate(iso?: string): string {
  if (!iso) return "Recently";
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function calcReadTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function normalizeArticle(raw: any): ArticleData {
  const articleType = raw.articleType ?? "STANDARD";
  return {
    id: String(raw._id ?? raw.id ?? ""),
    headline: raw.headline ?? raw.title ?? "",
    shortTitle: raw.shortTitle,
    excerpt: raw.excerpt ?? raw.subtitle,
    content: raw.content ?? "",
    category:
      typeof raw.categoryId === "object"
        ? raw.categoryId?.name ?? "News"
        : raw.category ?? "News",
    categoryId:
      typeof raw.categoryId === "object"
        ? String(raw.categoryId?._id ?? "")
        : String(raw.categoryId ?? ""),
    author:
      typeof raw.authorId === "object"
        ? raw.authorId?.name ?? "LocalNewz Team"
        : "LocalNewz Team",
    publishedAt: raw.publishedAt,
    readTime: calcReadTime(raw.content ?? ""),
    imageUrl: raw.featuredImage ?? raw.imageUrl ?? raw.img,
    imageCaption: raw.imageCaption,
    photoCredit: raw.photoCredit,
    isLive: articleType === "LIVE" && raw.statusType !== "ended",
    isBreaking: articleType === "BREAKING" && raw.statusType === "published",
    liveUpdates: Array.isArray(raw.liveUpdates) ? raw.liveUpdates : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    views: raw.views ?? 0,
    location: raw.location,
    slug: raw.slug,
    metaTitle: raw.metaTitle,
    metaDescription: raw.metaDescription,
    language: raw.language,
  };
}

// ─── Poll Component ───────────────────────────────────────────────────────────
interface PollProps {
  update: LiveUpdate;
  onVote: (updateId: string, optionId: string) => void;
}

const PollBlock: React.FC<PollProps> = ({ update, onVote }) => {
  if (!update.poll) return null;

  const storageKey = `poll_${update.id}`;
  const hasVoted = !!localStorage.getItem(storageKey);
  const selectedId = localStorage.getItem(storageKey);
  const total = update.poll.options.reduce((s, o) => s + o.votes, 0);

  return (
    <div className="ad-live-update-poll">
      <p className="ad-live-poll-q">{update.poll.question}</p>

      {update.poll.options.map((opt, i) => {
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        const isSelected = selectedId === opt.id;

        if (hasVoted) {
          // ── RESULT VIEW ──
          return (
            <div
              key={i}
              className={`ad-live-poll-option${isSelected ? " ad-live-poll-option--selected" : ""}`}
            >
              <div className="ad-live-poll-option-top">
                <span className="ad-live-poll-option-label">
                  {isSelected && (
                    <span style={{ marginRight: 6, fontSize: 12 }}>✔</span>
                  )}
                  {opt.label}
                </span>
                <span className="ad-live-poll-pct">{pct}%</span>
              </div>
              <div className="ad-live-poll-bar-wrap">
                <div
                  className="ad-live-poll-bar"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        }

        // ── VOTE VIEW ──
        return (
          <button
            key={i}
            className="ad-live-poll-btn"
            onClick={() => {
              localStorage.setItem(storageKey, opt.id);
              onVote(String(update.id), opt.id);
            }}
          >
            {opt.label}
          </button>
        );
      })}

      {hasVoted && total > 0 && (
        <p className="ad-live-poll-votes">
          {total.toLocaleString()} {total === 1 ? "vote" : "votes"}
        </p>
      )}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const ArticleDetail: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  // ── Article state ─────────────────────────────────────────────────────────
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Sidebar state ─────────────────────────────────────────────────────────
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);

  // ── Live updates polling ──────────────────────────────────────────────────
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [newUpdateCount, setNewUpdateCount] = useState(0);

  // ── Comment state ─────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<{
    name: string; initials: string; profilePic: string | null;
  } | null>(null);
  const [comments, setComments] = useState<CommentType[]>(INITIAL_COMMENTS);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);

  const commentInputRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const liveCountRef = useRef(0);

  useEffect(() => {
  const script = document.createElement("script");

  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;

  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
}, []);

  // ── Fetch article ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    setError(null);

    const url = `${BASE}/news/${articleId}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Article not found");
        return r.json();
      })
      .then((raw) => {
        const normalized = normalizeArticle(raw);
        setArticle(normalized);
        setLiveUpdates(normalized.liveUpdates);
        liveCountRef.current = normalized.liveUpdates.length;
      })
      .catch(() => setError("Article not found or unavailable."))
      .finally(() => setLoading(false));
  }, [articleId]);

  // ── Fetch recent news ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/news/recent?limit=6`)
      .then((r) => r.json())
      .then((d) => setRecentNews(d.news ?? []))
      .catch(() => {});
  }, []);

  // ── Fetch related news once article loads ────────────────────────────────
  useEffect(() => {
    if (!article?.categoryId || !article?.id) return;
    fetch(`${BASE}/news?categoryId=${article.categoryId}&limit=5&status=PUBLISHED`)
      .then((r) => r.json())
      .then((d) => {
        const filtered = (d.news ?? []).filter(
          (n: any) => String(n._id ?? n.id) !== String(article.id)
        );
        setRelatedNews(filtered.slice(0, 4));
      })
      .catch(() => {});
  }, [article?.categoryId, article?.id]);

  useEffect(() => {
  if (
    window &&
    (window as any).twttr
  ) {
    (window as any)
      .twttr.widgets.load();
  }
}, [liveUpdates]);
  // ── Live updates polling (every 30 s for live articles) ──────────────────
  useEffect(() => {
    if (!article?.isLive || !articleId) return;
    const interval = setInterval(() => {
      const url = `${BASE}/news/${articleId}`;

      fetch(url)
        .then((r) => r.json())
        .then((raw) => {
          const updates: LiveUpdate[] = Array.isArray(raw.liveUpdates)
            ? raw.liveUpdates
            : [];
          if (updates.length > liveCountRef.current) {
            setNewUpdateCount(updates.length - liveCountRef.current);
          }
          liveCountRef.current = updates.length;
          setLiveUpdates(updates);
        })
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [article?.isLive, articleId]);

  // ── User from localStorage ────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("localNewzUser");
    if (saved) setCurrentUser(JSON.parse(saved));

    const outsideClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".cmt-toolbar") && !t.closest(".cmt-menu-wrap")) {
        setShowMentionPicker(false);
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", outsideClick);
    return () => document.removeEventListener("mousedown", outsideClick);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleShare = (platform: "fb" | "tw" | "ig" | "copy" | "native") => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(article?.headline ?? "");
    if (platform === "fb") window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    if (platform === "tw") window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, "_blank");
    if (platform === "ig") { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }
    if (platform === "copy") { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }
    if (platform === "native" && navigator.share) navigator.share({ title: article?.headline, url: window.location.href });
  };

  const insertAtCursor = (text: string) => {
    document.execCommand("insertText", false, text);
    setShowMentionPicker(false);
  };

  const handleVote = (
    commentId: number,
    voteType: VoteType,
    isReply = false,
    parentId: number | null = null
  ) => {
    const update = (c: CommentType): CommentType => {
      let likes = c.likes;
      let dislikes = c.dislikes;
      if (c.userVote === "like") likes--;
      if (c.userVote === "dislike") dislikes--;
      const finalVote = c.userVote === voteType ? null : voteType;
      if (finalVote === "like") likes++;
      if (finalVote === "dislike") dislikes++;
      return { ...c, likes, dislikes, userVote: finalVote };
    };
    setComments((prev) =>
      prev.map((c) => {
        if (!isReply && c.id === commentId) return update(c);
        if (isReply && c.id === parentId)
          return { ...c, replies: c.replies.map((r) => (r.id === commentId ? update(r) : r)) };
        return c;
      })
    );
  };

  const handleCommentSubmit = () => {
    const html = commentInputRef.current?.innerHTML ?? "";
    if (!html.trim()) return;
    setComments([
      {
        id: Date.now(), author: currentUser?.name ?? "Reader",
        avatar: currentUser?.initials ?? "RE", profilePic: currentUser?.profilePic ?? null,
        time: "Just now", text: html, likes: 0, dislikes: 0, userVote: null, replies: [],
      },
      ...comments,
    ]);
    if (commentInputRef.current) commentInputRef.current.innerHTML = "";
  };

  const handleReplySubmit = (parentId: number) => {
    const html = replyInputRef.current?.innerHTML ?? "";
    if (!html.trim()) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? {
              ...c,
              replies: [
                ...c.replies,
                {
                  id: Date.now(), author: currentUser?.name ?? "Reader",
                  avatar: currentUser?.initials ?? "RE", profilePic: currentUser?.profilePic ?? null,
                  time: "Just now", text: html, likes: 0, dislikes: 0, userVote: null, replies: [],
                },
              ],
            }
          : c
      )
    );
    setReplyingToId(null);
  };

  const scrollToLive = () => {
    liveRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setNewUpdateCount(0);
  };

  const handlePollVote = async (updateId: string, optionId: string) => {
    try {
      if (!article) return;
      await votePoll(article.id, updateId, optionId);
      const response = await fetch(`${BASE}/news/${articleId}`);
      const data = await response.json();
      setLiveUpdates(data.liveUpdates || []);
    } catch (error) {
      console.error(error);
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="ad-skeleton-wrapper">
        <div className="ad-skeleton-hero" />
        <div className="ad-skeleton-title" />
        <div className="ad-skeleton-meta" />
        <div className="ad-skeleton-body" />
        <div className="ad-skeleton-body" style={{ width: "80%" }} />
        <div className="ad-skeleton-body" style={{ width: "60%" }} />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="ad-error-wrapper">
        <div className="ad-error-icon">📰</div>
        <h2>Article Not Found</h2>
        <p>{error ?? "This article may have been removed or is unavailable."}</p>
        <button className="ad-error-btn" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  const displayCategory =
    article.category.charAt(0).toUpperCase() + article.category.slice(1).toLowerCase();
  const totalComments =
    comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0);

  return (
    <div className="ad-page-wrapper">
      {/* ── BREAKING BANNER ── */}
      {article.isBreaking && (
        <div className="ad-breaking-banner">
          <Zap size={14} />
          <span className="ad-breaking-label">BREAKING NEWS</span>
          <span className="ad-breaking-text">{article.shortTitle ?? article.headline}</span>
        </div>
      )}

      <div className="ad-container">
        <main className="ad-main-content">

          {/* ── BREADCRUMB ── */}
          <div className="ad-breadcrumb">
            <Link to="/" className="ad-bc-link">Home</Link>
            <span className="ad-bc-sep">/</span>
            <Link to={`/category/${article.category.toLowerCase()}`} className="ad-bc-link">
              {displayCategory}
            </Link>
            <span className="ad-bc-sep">/</span>
            <span className="ad-bc-current">{article.headline}</span>
          </div>

          {/* ── BADGES ROW ── */}
          <div className="ad-badges-row">
            <span className="ad-category-badge">{article.category}</span>
            {article.isLive && (
              <span className="ad-live-badge">
                <span className="ad-live-dot-sm" /> LIVE
              </span>
            )}
            {article.isBreaking && (
              <span className="ad-breaking-badge">
                <Zap size={10} /> BREAKING
              </span>
            )}
          </div>

          {/* ── HEADLINE ── */}
          <h1 className="ad-headline">{article.headline}</h1>

          {/* ── EXCERPT / SUBHEADLINE ── */}
          {article.excerpt && (
            <p className="ad-subheadline">{article.excerpt}</p>
          )}

          {/* ── META ROW ── */}
          <div className="ad-meta-row">
            <div className="ad-meta-left">
              <span><User size={14} /> {article.author}</span>
              <span><Calendar size={14} /> {formatDate(article.publishedAt)}</span>
              {article.location && (
                <span><MapPin size={14} /> {article.location}</span>
              )}
            </div>
            <div className="ad-meta-right">
              <span className="ad-share-label"><Share2 size={14} /> Share:</span>
              <button className="ad-share-btn fb" onClick={() => handleShare("fb")} title="Share on Facebook"><Facebook size={14} /></button>
              <button className="ad-share-btn ig" onClick={() => handleShare("ig")} title="Share on Instagram"><Instagram size={14} /></button>
              <button className="ad-share-btn tw" onClick={() => handleShare("tw")} title="Share on X"><FaXTwitter size={14} /></button>
              <button className="ad-share-btn copy" onClick={() => handleShare("copy")} title="Copy link"><Copy size={14} /></button>
            </div>
          </div>

          {/* ── HERO IMAGE ── */}
          {article.imageUrl && (
            <figure className="ad-hero-figure">
              <img src={article.imageUrl} alt={article.headline} className="ad-hero-image" />
              {(article.imageCaption || article.photoCredit) && (
                <figcaption className="ad-hero-caption">
                  {article.imageCaption && <span>{article.imageCaption}</span>}
                  {article.photoCredit && (
                    <span className="ad-photo-credit"><Camera size={18} /> {article.photoCredit}</span>
                  )}
                </figcaption>
              )}
            </figure>
          )}

          {/* ── ARTICLE BODY ── */}
          <div
            className="ad-article-body"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* ── ADVERTISEMENT ── */}
          <div style={{ margin: "50px 0" }}>
            <Advertisement page={article.category?.toLowerCase() ?? "all"} />
          </div>

          {/* ── LIVE UPDATES (main body) ── */}
          {article.isLive && liveUpdates.length > 0 && (
            <div className="ad-main-live-section" ref={liveRef} id="main-detailed-live-updates">
              <div className="ad-main-live-header">
                <span className="ad-main-live-dot" />
                <h2>LIVE UPDATES</h2>
                <span className="ad-live-count-badge">{liveUpdates.length} updates</span>
              </div>

              <div className="ad-main-live-timeline">
                {liveUpdates.map((update, index) => (
                  <div key={update.id ?? index} className="ad-main-live-item">

                    {/* TIME */}
                    <div className="ad-main-live-time">
                      <Clock size={15} />
                      {update.time}
                      {update.isBreaking && (
                        <span className="ad-live-update-badge ad-live-update-badge--breaking">BREAKING</span>
                      )}
                      {update.isHighlight && (
                        <span className="ad-live-update-badge ad-live-update-badge--highlight">HIGHLIGHT</span>
                      )}
                    </div>

                    <div className="ad-main-live-content">
                      {/* TITLE */}
                      {update.title && (
                        <h4 className="ad-live-update-title">{update.title}</h4>
                      )}

                      {/* TEXT */}
                      {update.text && update.text.replace(/<[^>]*>/g, "").trim() && (
                        <div
                          className="ad-live-update-text"
                          dangerouslySetInnerHTML={{ __html: update.text }}
                        />
                      )}

                      {/* IMAGE */}
                      {update.imageUrl && (
                        <div className="ad-live-update-image-wrap">
                          <img src={update.imageUrl} alt={update.imageCaption ?? ""} />
                          {(update.imageCaption || update.imageCredit) && (
                            <div className="ad-live-update-caption">
                              {update.imageCaption}
                              {update.imageCredit && (
                                <span className="ad-live-update-credit"><Camera size={18} /> {update.imageCredit}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TWEET */}
                      {
  update.tweetUrl && (
    <blockquote
      className="twitter-tweet"
      data-theme="light"
    >
      <a
        href={update.tweetUrl}
      >
        {update.tweetUrl}
      </a>
    </blockquote>
  )
}

                      {/* ── POLL ── */}
                      {update.poll && (
                        <PollBlock update={update} onVote={handlePollVote} />
                      )}

                      {/* SOURCE */}
                      {update.sourceUrl && (
                        <div className="ad-live-update-source">
                          Source:{" "}
                          <a href={update.sourceUrl} target="_blank" rel="noopener noreferrer">
                            {update.sourceLabel ?? update.sourceUrl}
                          </a>
                        </div>
                      )}

                      {/* TAGS */}
                      {update.tags && update.tags.length > 0 && (
                        <div className="ad-live-update-tags">
                          {update.tags.map((t) => (
                            <span key={t} className="ad-live-update-tag">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── COMMENTS ── */}
          <div className="comments-section">
            <div className="cmt-input-box">
              <div
                ref={commentInputRef}
                className="cmt-textarea"
                contentEditable
                data-placeholder="Add comment..."
              />
              <div className="cmt-toolbar">
                
                {showMentionPicker && (
                  <div className="cmt-popup-menu" style={{ flexDirection: "column", gap: "4px", left: "120px" }}>
                    <span style={{ fontSize: "10px", color: "#94a3b8", padding: "0 8px", fontWeight: 700, textTransform: "uppercase" }}>Tag a user</span>
                    {MOCK_USERS.map((u) => (
                      <button
                        key={u}
                        className="cmt-mention-btn"
                        onMouseDown={(ev) => { ev.preventDefault(); insertAtCursor(`@${u} `); }}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                )}
                <button className="cmt-submit" onClick={handleCommentSubmit}>Submit</button>
              </div>
            </div>

            <div className="cmt-header">
              <h3>
                Comments <span className="cmt-count">{totalComments}</span>
              </h3>
              <button className="cmt-sort">Most recent <ChevronDown size={14} /></button>
            </div>

            <div className="cmt-list">
              {comments.map((comment) => (
                <div key={comment.id} className="cmt-thread">
                  <div className="cmt-item">
                    <div className="cmt-avatar">
                      {comment.profilePic ? (
                        <img src={comment.profilePic} alt={comment.author} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : comment.avatar}
                    </div>
                    <div className="cmt-content">
                      <div className="cmt-meta">
                        <span className="cmt-author">{comment.author}</span>
                        <span className="cmt-time">{comment.time}</span>
                      </div>
                      <div className="cmt-text" dangerouslySetInnerHTML={{ __html: comment.text }} />
                      <div className="cmt-actions">
                        <button className={`cmt-action-btn ${comment.userVote === "like" ? "active" : ""}`} onClick={() => handleVote(comment.id, "like")}>
                          <ThumbsUp size={14} fill={comment.userVote === "like" ? "currentColor" : "none"} /> {comment.likes}
                        </button>
                        <button className={`cmt-action-btn ${comment.userVote === "dislike" ? "active" : ""}`} onClick={() => handleVote(comment.id, "dislike")}>
                          <ThumbsDown size={14} fill={comment.userVote === "dislike" ? "currentColor" : "none"} /> {comment.dislikes}
                        </button>
                        <button className="cmt-action-btn cmt-reply-btn" onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}>
                          <MessageSquare size={14} /> Reply
                        </button>
                        <div className="cmt-menu-wrap">
                          <button className="cmt-more-btn" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === comment.id ? null : comment.id); }}>
                            <MoreHorizontal size={14} />
                          </button>
                          {openMenuId === comment.id && (
                            <div className="cmt-dropdown">
                              <button onClick={() => { navigator.clipboard.writeText(window.location.href); setOpenMenuId(null); }}><Copy size={14} /> Copy Link</button>
                              <button onClick={() => { alert("Comment reported."); setOpenMenuId(null); }}><Flag size={14} /> Report</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {replyingToId === comment.id && (
                        <div className="cmt-reply-box">
                          <div ref={replyInputRef} className="cmt-textarea" contentEditable data-placeholder={`Replying to ${comment.author}...`} />
                          <div className="cmt-reply-actions">
                            <button className="cmt-cancel" onClick={() => setReplyingToId(null)}>Cancel</button>
                            <button className="cmt-submit" onClick={() => handleReplySubmit(comment.id)}>Reply</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {comment.replies.length > 0 && (
                    <div className="cmt-replies-container">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="cmt-item">
                          <div className="cmt-avatar cmt-avatar-small">
                            {reply.profilePic ? (
                              <img src={reply.profilePic} alt={reply.author} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                            ) : reply.avatar}
                          </div>
                          <div className="cmt-content">
                            <div className="cmt-meta">
                              <span className="cmt-author">
                                {reply.author}
                                {reply.isVerified && <span className="cmt-verified">✔</span>}
                              </span>
                              <span className="cmt-time">{reply.time}</span>
                            </div>
                            <div className="cmt-text" dangerouslySetInnerHTML={{ __html: reply.text }} />
                            <div className="cmt-actions">
                              <button className={`cmt-action-btn ${reply.userVote === "like" ? "active" : ""}`} onClick={() => handleVote(reply.id, "like", true, comment.id)}>
                                <ThumbsUp size={14} fill={reply.userVote === "like" ? "currentColor" : "none"} /> {reply.likes}
                              </button>
                              <button className={`cmt-action-btn ${reply.userVote === "dislike" ? "active" : ""}`} onClick={() => handleVote(reply.id, "dislike", true, comment.id)}>
                                <ThumbsDown size={14} fill={reply.userVote === "dislike" ? "currentColor" : "none"} /> {reply.dislikes}
                              </button>
                              <button className="cmt-action-btn cmt-reply-btn" onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}>
                                <MessageSquare size={14} /> Reply
                              </button>
                              <div className="cmt-menu-wrap">
                                <button className="cmt-more-btn" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === reply.id ? null : reply.id); }}>
                                  <MoreHorizontal size={14} />
                                </button>
                                {openMenuId === reply.id && (
                                  <div className="cmt-dropdown">
                                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); setOpenMenuId(null); }}><Copy size={14} /> Copy Link</button>
                                    <button onClick={() => { alert("Reply reported."); setOpenMenuId(null); }}><Flag size={14} /> Report</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* ── SIDEBAR ── */}
        <aside className="ad-sidebar">

          {/* LIVE UPDATES WIDGET */}
          {article.isLive && liveUpdates.length > 0 && (
            <div className="ad-sidebar-widget ad-live-widget">
              <div className="ad-live-header">
                <span className="ad-live-dot" />
                <h3 className="ad-widget-title">LIVE UPDATES</h3>
                {newUpdateCount > 0 && (
                  <span className="ad-new-update-badge">{newUpdateCount} new</span>
                )}
              </div>
              <div className="ad-widget-divider" />
              <div className="ad-live-list">
                {liveUpdates.slice(0, 4).map((update, index) => (
                  <div
                    key={update.id ?? index}
                    className="ad-live-item"
                    onClick={scrollToLive}
                    style={{ cursor: "pointer" }}
                    title="Click to view full update"
                  >
                    <span className="ad-live-time">{update.time}</span>
                    <p className="ad-live-text">
                      {(
                        update.title ||
                        update.text?.replace(/<[^>]*>/g, "") ||
                        update.poll?.question ||
                        "Live Update"
                      ).slice(0, 55)}
                    </p>
                  </div>
                ))}
              </div>
              <button className="ad-live-view-all" onClick={scrollToLive}>
                View all updates <ArrowRight size={13} />
              </button>
            </div>
          )}

          {/* RECENT NEWS WIDGET */}
          {recentNews.length > 0 && (
            <div className="ad-sidebar-widget">
              <h3 className="ad-widget-title" style={{ color: "#0f172a" }}>Recent News</h3>
              <div className="ad-widget-divider" />
              <div className="ad-recent-list">
                {recentNews.slice(0, 5).map((item) => {
                  const itemId = String(item._id ?? item.id ?? "");
                  const catName =
                    typeof item.categoryId === "object"
                      ? item.categoryId?.name ?? "News"
                      : item.categoryName ?? "News";
                  return (
                    <Link
                      key={itemId}
                      to={`/article/${itemId}`}
                      className="ad-recent-item"
                    >
                      {item.featuredImage && (
                        <img
                          src={item.featuredImage}
                          alt={item.headline}
                          className="ad-recent-img"
                        />
                      )}
                      <div className="ad-recent-info">
                        <span className="ad-recent-cat">{catName}</span>
                        <h4 className="ad-recent-title">
                          {item.shortTitle ?? item.headline}
                        </h4>
                        <span className="ad-recent-time">
                          <Clock size={11} /> {formatDate(item.publishedAt)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAGS WIDGET */}
          {article.tags.length > 0 && (
            <div className="ad-sidebar-widget">
              <h3 className="ad-widget-title" style={{ color: "#0f172a" }}>
                <Tag size={14} style={{ display: "inline", marginRight: 6 }} />
                Tags
              </h3>
              <div className="ad-widget-divider" />
              <div className="ad-sidebar-tags">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`}
                    className="ad-sidebar-tag"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* RELATED NEWS WIDGET */}
          {relatedNews.length > 0 && (
            <div className="ad-sidebar-widget ad-sticky-widget">
              <h3 className="ad-widget-title" style={{ color: "#0f172a" }}>Related News</h3>
              <div className="ad-widget-divider" />
              {relatedNews.map((item) => {
                const itemId = String(item._id ?? item.id ?? "");
                return (
                  <Link key={itemId} to={`/article/${itemId}`} className="ad-related-item">
                    {item.featuredImage && (
                      <img
                        src={item.featuredImage}
                        alt={item.headline}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="ad-related-info">
                      <h4>{item.shortTitle ?? item.headline}</h4>
                      <span>{formatDate(item.publishedAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </aside>
      </div>
    </div>
  );
};

export default ArticleDetail;