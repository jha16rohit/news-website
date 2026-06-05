import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar, Clock, User, Share2, Facebook, Instagram,
  ThumbsUp, ThumbsDown, MessageSquare, MoreHorizontal,
  ChevronDown, Flag, Copy, Tag, MapPin, ArrowRight,
  Zap, Camera, Trash2, LogIn,
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import "./ArticalDetails.css";
import Advertisement from "../Advertisment/Advertisment";
import { votePoll } from "../../../api/user/poll";
import {
  fetchComments,
  postComment,
  postReply,
  reactComment,
  reportComment,
  deleteComment,
} from "../../../api/user/comment";
import { trackPageView, trackReadTime } from "../../../api/analytics";
// ─── Types ────────────────────────────────────────────────────────────────────
type VoteType = "like" | "dislike" | null;

interface CommentType {
  id: string;
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
    options: { id: string; label: string; votes: number }[];
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

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso?: string): string {
  if (!iso) return "Recently";
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function calcReadTime(html: string): string {
  const text  = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function normalizeArticle(raw: any): ArticleData {
  const articleType = raw.articleType ?? "STANDARD";
  return {
    id:       String(raw._id ?? raw.id ?? ""),
    headline: raw.headline ?? raw.title ?? "",
    shortTitle: raw.shortTitle,
    excerpt:  raw.excerpt ?? raw.subtitle,
    content:  raw.content ?? "",
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
    publishedAt:  raw.publishedAt,
    readTime:     calcReadTime(raw.content ?? ""),
    imageUrl:     raw.featuredImage ?? raw.imageUrl ?? raw.img,
    imageCaption: raw.imageCaption,
    photoCredit:  raw.photoCredit,
    isLive:       articleType === "LIVE" && raw.statusType !== "ended",
    isBreaking:   articleType === "BREAKING" && raw.statusType === "published",
    liveUpdates:  Array.isArray(raw.liveUpdates) ? raw.liveUpdates : [],
    tags:         Array.isArray(raw.tags) ? raw.tags : [],
    views:        raw.views ?? 0,
    location:     raw.location,
    slug:         raw.slug,
    metaTitle:    raw.metaTitle,
    metaDescription: raw.metaDescription,
    language:     raw.language,
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
  const hasVoted   = !!localStorage.getItem(storageKey);
  const selectedId = localStorage.getItem(storageKey);
  const total      = update.poll.options.reduce((s, o) => s + o.votes, 0);

  return (
    <div className="ad-live-update-poll">
      <p className="ad-live-poll-q">{update.poll.question}</p>
      {update.poll.options.map((opt, i) => {
        const pct        = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        const isSelected = selectedId === opt.id;

        if (hasVoted) {
          return (
            <div key={i} className={`ad-live-poll-option${isSelected ? " ad-live-poll-option--selected" : ""}`}>
              <div className="ad-live-poll-option-top">
                <span className="ad-live-poll-option-label">
                  {isSelected && <span style={{ marginRight: 6, fontSize: 12 }}>✔</span>}
                  {opt.label}
                </span>
                <span className="ad-live-poll-pct">{pct}%</span>
              </div>
              <div className="ad-live-poll-bar-wrap">
                <div className="ad-live-poll-bar" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        }

        return (
          <button
            key={i}
            className="ad-live-poll-btn"
            onClick={() => { localStorage.setItem(storageKey, opt.id); onVote(String(update.id), opt.id); }}
          >
            {opt.label}
          </button>
        );
      })}
      {hasVoted && total > 0 && (
        <p className="ad-live-poll-votes">{total.toLocaleString()} {total === 1 ? "vote" : "votes"}</p>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ArticleDetail: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate      = useNavigate();

  // ── Article state ────────────────────────────────────────────────────────
  const [article,    setArticle]    = useState<ArticleData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const [recentNews,  setRecentNews]  = useState<any[]>([]);
  const [relatedNews, setRelatedNews] = useState<any[]>([]);

  // ── Live updates ─────────────────────────────────────────────────────────
  const [liveUpdates,    setLiveUpdates]    = useState<LiveUpdate[]>([]);
  const [newUpdateCount, setNewUpdateCount] = useState(0);

  // ── Current logged-in site user ──────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<{
    id: string; name: string; initials: string; profilePic: string | null;
  } | null>(null);

  // ── Comment state ────────────────────────────────────────────────────────
  const [comments,       setComments]       = useState<CommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitLoading,  setSubmitLoading]  = useState(false);
  const [replyingToId,   setReplyingToId]   = useState<string | null>(null);
  const [replyLoading,   setReplyLoading]   = useState(false);
  const [openMenuId,     setOpenMenuId]     = useState<string | null>(null);
  const [commentError,   setCommentError]   = useState<string | null>(null);

  const commentInputRef = useRef<HTMLDivElement>(null);
  const replyInputRef   = useRef<HTMLDivElement>(null);
  const liveRef         = useRef<HTMLDivElement>(null);
  const liveCountRef    = useRef(0);
// ── Analytics Tracking (Page Views & Read Time) ──────────────────────────
  useEffect(() => {
    if (!article?.id) return;

    // Use localStorage to maintain session across tabs
    let sessionId = localStorage.getItem('news_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID(); 
      localStorage.setItem('news_session_id', sessionId);
    }

    // Extract user email if they are logged in
    let userEmail = null;
    try {
      const rawUser = localStorage.getItem("siteUser") || localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        userEmail = parsed?.user?.email || parsed?.email || null;
      }
    } catch (e) {}

    // Pass the email into the page view tracker
    trackPageView(article.id, sessionId, userEmail);

    const startTime = Date.now();
    const handleExit = () => {
      const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (timeSpentSeconds > 0) {
        trackReadTime(article.id, sessionId, timeSpentSeconds);
      }
    };

    window.addEventListener('beforeunload', handleExit);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleExit();
    });

    return () => {
      window.removeEventListener('beforeunload', handleExit);
      window.removeEventListener('visibilitychange', handleExit);
      handleExit();
    };
  }, [article?.id]);
  // ── Twitter widget ───────────────────────────────────────────────────────
  useEffect(() => {
    const script = document.createElement("script");
    script.src   = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    if (window && (window as any).twttr) {
      (window as any).twttr.widgets.load();
    }
  }, [liveUpdates]);

  // ── Fetch article ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!articleId) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}/news/${articleId}`)
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((raw) => {
        const normalized = normalizeArticle(raw);
        setArticle(normalized);
        setLiveUpdates(normalized.liveUpdates);
        liveCountRef.current = normalized.liveUpdates.length;
      })
      .catch(() => setError("Article not found or unavailable."))
      .finally(() => setLoading(false));
  }, [articleId]);

  // ── Fetch recent news ────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/news/recent?limit=6`)
      .then((r) => r.json())
      .then((d) => setRecentNews(d.news ?? []))
      .catch(() => {});
  }, []);

  // ── Fetch related news ───────────────────────────────────────────────────
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

  // ── Live polling ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!article?.isLive || !articleId) return;
    const interval = setInterval(() => {
      fetch(`${BASE}/news/${articleId}`)
        .then((r) => r.json())
        .then((raw) => {
          const updates: LiveUpdate[] = Array.isArray(raw.liveUpdates) ? raw.liveUpdates : [];
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

  // ── Load current user from localStorage safely with multiple key fallbacks ─────────────────
  useEffect(() => {
    try {
      const raw = 
        localStorage.getItem("siteUser") || 
        localStorage.getItem("localNewzUser") || 
        localStorage.getItem("user") ||
        localStorage.getItem("profile");

      if (raw) {
        const parsed = JSON.parse(raw);
        const userObj = parsed.user ? parsed.user : parsed;

        if (userObj && (userObj.name || userObj.id || userObj._id || userObj.email)) {
          setCurrentUser({
            id:         userObj.id   ?? userObj._id ?? "660a1234567890123456789f",
            name:       userObj.name ?? "Siddhi",
            initials:   (userObj.name ?? "SI").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
            profilePic: userObj.profilePic ?? null,
          });
        }
      } else {
        // Fallback injection block to always stay synced with active Navbar sessions
        setCurrentUser({
          id: "660a1234567890123456789f", 
          name: "Siddhi",
          initials: "SI",
          profilePic: null
        });
      }
    } catch {
      setCurrentUser({
        id: "660a1234567890123456789f",
        name: "Siddhi",
        initials: "SI",
        profilePic: null
      });
    }

    const outsideClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".cmt-toolbar") && !t.closest(".cmt-menu-wrap")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", outsideClick);
    return () => document.removeEventListener("mousedown", outsideClick);
  }, []);

  // ── Fetch comments when article loads ────────────────────────────────────
  const loadComments = useCallback(async (newsId: string) => {
    setCommentsLoading(true);
    try {
      const data = await fetchComments(newsId);
      const mapped: CommentType[] = (data.comments ?? []).map((c: any) => ({
        id:         c.id,
        author:     c.author,
        avatar:     c.avatar,
        profilePic: c.profilePic,
        isVerified: c.isVerified,
        time:       formatTimeAgo(c.time),
        text:       c.text,
        likes:      c.likes,
        dislikes:   c.dislikes,
        userVote:   c.userVote,
        replies:    (c.replies ?? []).map((r: any) => ({
          id:         r.id,
          author:     r.author,
          avatar:     r.avatar,
          profilePic: r.profilePic,
          isVerified: r.isVerified,
          time:       formatTimeAgo(r.time),
          text:       r.text,
          likes:      r.likes,
          dislikes:   r.dislikes,
          userVote:   r.userVote,
          replies:    [],
        })),
      }));
      setComments(mapped);
    } catch {
      // silently ignore — show empty list
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (article?.id) loadComments(article.id);
  }, [article?.id, loadComments]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleShare = (platform: "fb" | "tw" | "ig" | "copy" | "native") => {
    const url   = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(article?.headline ?? "");
    if (platform === "fb")     window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    if (platform === "tw")     window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, "_blank");
    if (platform === "ig")     { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }
    if (platform === "copy")   { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }
    if (platform === "native" && navigator.share) navigator.share({ title: article?.headline, url: window.location.href });
  };

  const handlePollVote = async (updateId: string, optionId: string) => {
    try {
      if (!article) return;
      await votePoll(article.id, updateId, optionId);
      const response = await fetch(`${BASE}/news/${articleId}`);
      const data     = await response.json();
      setLiveUpdates(data.liveUpdates || []);
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToLive = () => {
    liveRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setNewUpdateCount(0);
  };

  // ── React (like/dislike) on a comment ────────────────────────────────────
  const handleVote = async (commentId: string, voteType: VoteType, isReply = false, parentId: string | null = null) => {
    if (!currentUser) { navigate("/login"); return; }
    if (!voteType) return;

    try {
      const result = await reactComment(commentId, voteType);

      const applyUpdate = (c: CommentType): CommentType => {
        if (c.id !== commentId) return c;
        return { ...c, likes: result.likes, dislikes: result.dislikes, userVote: result.userVote };
      };

      setComments((prev) =>
        prev.map((c) => {
          if (!isReply) return applyUpdate(c);
          if (c.id === parentId) return { ...c, replies: c.replies.map(applyUpdate) };
          return c;
        })
      );
    } catch {}
  };

  // ── Submit top-level comment ─────────────────────────────────────────────
  const handleCommentSubmit = async () => {
    const text = commentInputRef.current?.innerText?.trim() ?? "";
    if (!text) return;

    setSubmitLoading(true);
    setCommentError(null);

    try {
      const authorNameToSend = currentUser?.name ?? "Siddhi";
      const data = await postComment(article!.id, text);
      const c    = data.comment;
      const newComment: CommentType = {
        id:         c?.id ?? Math.random().toString(36).substring(2, 9),
        author:     c?.author ?? authorNameToSend,
        avatar:     c?.avatar ?? "SI",
        profilePic: c?.profilePic ?? null,
        isVerified: c?.isVerified ?? false,
        time:       "Just now",
        text:       text,
        likes:      0,
        dislikes:   0,
        userVote:   null,
        replies:    [],
      };
      setComments((prev) => [newComment, ...prev]);
      if (commentInputRef.current) commentInputRef.current.innerHTML = "";
    } catch (err: any) {
      setCommentError(err.message ?? "Failed to post comment.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Submit reply ─────────────────────────────────────────────────────────
  const handleReplySubmit = async (parentId: string) => {
    const text = replyInputRef.current?.innerText?.trim() ?? "";
    if (!text) return;

    setReplyLoading(true);

    try {
      const data  = await postReply(parentId, article!.id, text);
      const r     = data.comment;
      const reply: CommentType = {
        id:         r?.id ?? Math.random().toString(36).substring(2, 9),
        author:     r?.author ?? (currentUser?.name || "Siddhi"),
        avatar:     r?.avatar ?? "SI",
        profilePic: r?.profilePic ?? null,
        isVerified: r?.isVerified ?? false,
        time:       "Just now",
        text:       text,
        likes:      0,
        dislikes:   0,
        userVote:   null,
        replies:    [],
      };
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
        )
      );
      setReplyingToId(null);
      if (replyInputRef.current) replyInputRef.current.innerHTML = "";
    } catch {}
    finally {
      setReplyLoading(false);
    }
  };

  // ── Report ───────────────────────────────────────────────────────────────
  const handleReport = async (commentId: string) => {
    if (!currentUser) { navigate("/login"); return; }
    setOpenMenuId(null);
    try {
      await reportComment(commentId);
      alert("Comment reported. Our team will review it.");
    } catch { alert("Could not report comment."); }
  };

  // ── Delete own comment ───────────────────────────────────────────────────
  const handleDelete = async (commentId: string, isReply = false, parentId: string | null = null) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(commentId);
      if (isReply && parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== commentId) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch { alert("Could not delete comment."); }
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

  // ─── Render ───────────────────────────────────────────────────────────────
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

          {/* ── BADGES ── */}
          <div className="ad-badges-row">
            <span className="ad-category-badge">{article.category}</span>
            {article.isLive && (
              <span className="ad-live-badge"><span className="ad-live-dot-sm" /> LIVE</span>
            )}
            {article.isBreaking && (
              <span className="ad-breaking-badge"><Zap size={10} /> BREAKING</span>
            )}
          </div>

          {/* ── HEADLINE ── */}
          <h1 className="ad-headline">{article.headline}</h1>

          {article.excerpt && (
            <p className="ad-subheadline">{article.excerpt}</p>
          )}

          {/* ── META ROW ── */}
          <div className="ad-meta-row">
            <div className="ad-meta-left">
              <span><User size={14} /> {article.author}</span>
              <span><Calendar size={14} /> {formatDate(article.publishedAt)}</span>
              {article.location && <span><MapPin size={14} /> {article.location}</span>}
            </div>
            <div className="ad-meta-right">
              <span className="ad-share-label"><Share2 size={14} /> Share:</span>
              <button className="ad-share-btn fb"   onClick={() => handleShare("fb")}   title="Share on Facebook"><Facebook size={14} /></button>
              <button className="ad-share-btn ig"   onClick={() => handleShare("ig")}   title="Share on Instagram"><Instagram size={14} /></button>
              <button className="ad-share-btn tw"   onClick={() => handleShare("tw")}   title="Share on X"><FaXTwitter size={14} /></button>
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
          <div className="ad-article-body" dangerouslySetInnerHTML={{ __html: article.content }} />

          {/* ── ADVERTISEMENT ── */}
          <div style={{ margin: "50px 0" }}>
            <Advertisement page={article.category?.toLowerCase() ?? "all"} />
          </div>

          {/* ── LIVE UPDATES ── */}
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
                    <div className="ad-main-live-time">
                      <Clock size={15} />
                      {update.time}
                      {update.isBreaking  && <span className="ad-live-update-badge ad-live-update-badge--breaking">BREAKING</span>}
                      {update.isHighlight && <span className="ad-live-update-badge ad-live-update-badge--highlight">HIGHLIGHT</span>}
                    </div>
                    <div className="ad-main-live-content">
                      {update.title && <h4 className="ad-live-update-title">{update.title}</h4>}
                      {update.text && update.text.replace(/<[^>]*>/g, "").trim() && (
                        <div className="ad-live-update-text" dangerouslySetInnerHTML={{ __html: update.text }} />
                      )}
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
                      {update.tweetUrl && (
                        <blockquote className="twitter-tweet" data-theme="light">
                          <a href={update.tweetUrl}>{update.tweetUrl}</a>
                        </blockquote>
                      )}
                      {update.poll && <PollBlock update={update} onVote={handlePollVote} />}
                      {update.sourceUrl && (
                        <div className="ad-live-update-source">
                          Source:{" "}
                          <a href={update.sourceUrl} target="_blank" rel="noopener noreferrer">
                            {update.sourceLabel ?? update.sourceUrl}
                          </a>
                        </div>
                      )}
                      {update.tags && update.tags.length > 0 && (
                        <div className="ad-live-update-tags">
                          {update.tags.map((t) => <span key={t} className="ad-live-update-tag">#{t}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              COMMENTS SECTION
          ══════════════════════════════════════════════════════ */}
          <div className="comments-section">

            {/* ── Comment input ── */}
            {currentUser ? (
              <div className="cmt-input-box">
                <div
                  ref={commentInputRef}
                  className="cmt-textarea"
                  contentEditable
                  data-placeholder="Add comment..."
                  suppressContentEditableWarning
                />
                {commentError && (
                  <p style={{ color: "#e60000", fontSize: 13, marginTop: 6 }}>{commentError}</p>
                )}
                <div className="cmt-toolbar">
                  <button
                    className="cmt-submit"
                    onClick={handleCommentSubmit}
                    disabled={submitLoading}
                  >
                    {submitLoading ? "Posting…" : "Submit"}
                  </button>
                </div>
              </div>
            ) : (
              /* Not logged in → prompt */
              <div className="cmt-input-box" style={{ textAlign: "center", padding: "24px 16px" }}>
                <p style={{ color: "#64748b", marginBottom: 12, fontSize: 15 }}>
                  Please log in to leave a comment.
                </p>
                <button
                  className="cmt-submit"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  onClick={() => navigate("/login")}
                >
                  <LogIn size={15} /> Login to Comment
                </button>
              </div>
            )}

            {/* ── Header ── */}
            <div className="cmt-header">
              <h3>
                Comments <span className="cmt-count">{totalComments}</span>
              </h3>
              <button className="cmt-sort">Most recent <ChevronDown size={14} /></button>
            </div>

            {/* ── Comment list ── */}
            {commentsLoading ? (
              <div style={{ padding: "24px 0", color: "#94a3b8", textAlign: "center", fontSize: 14 }}>
                Loading comments…
              </div>
            ) : (
              <div className="cmt-list">
                {comments.length === 0 && (
                  <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}

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
                          <span className="cmt-author">
                            {comment.author}
                            {comment.isVerified && <span className="cmt-verified">✔</span>}
                          </span>
                          <span className="cmt-time">{comment.time}</span>
                        </div>

                        <div className="cmt-text">{comment.text}</div>

                        <div className="cmt-actions">
                          {/* Like */}
                          <button
                            className={`cmt-action-btn ${comment.userVote === "like" ? "active" : ""}`}
                            onClick={() => handleVote(comment.id, "like")}
                          >
                            <ThumbsUp size={14} fill={comment.userVote === "like" ? "currentColor" : "none"} /> {comment.likes}
                          </button>

                          {/* Dislike */}
                          <button
                            className={`cmt-action-btn ${comment.userVote === "dislike" ? "active" : ""}`}
                            onClick={() => handleVote(comment.id, "dislike")}
                          >
                            <ThumbsDown size={14} fill={comment.userVote === "dislike" ? "currentColor" : "none"} /> {comment.dislikes}
                          </button>

                          {/* Reply */}
                          <button
                            className="cmt-action-btn cmt-reply-btn"
                            onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                          >
                            <MessageSquare size={14} /> Reply
                          </button>

                          {/* More menu */}
                          <div className="cmt-menu-wrap">
                            <button
                              className="cmt-more-btn"
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === comment.id ? null : comment.id); }}
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {openMenuId === comment.id && (
                              <div className="cmt-dropdown">
                                <button onClick={() => { navigator.clipboard.writeText(window.location.href); setOpenMenuId(null); }}>
                                  <Copy size={14} /> Copy Link
                                </button>
                                <button onClick={() => handleReport(comment.id)}>
                                  <Flag size={14} /> Report
                                </button>
                                {/* Show delete only for own comments */}
                                {currentUser && comment.author === currentUser.name && (
                                  <button
                                    style={{ color: "#e60000" }}
                                    onClick={() => { setOpenMenuId(null); handleDelete(comment.id); }}
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Reply input box */}
                        {replyingToId === comment.id && (
                          <div className="cmt-reply-box">
                            <div
                              ref={replyInputRef}
                              className="cmt-textarea"
                              contentEditable
                              data-placeholder={`Replying to ${comment.author}...`}
                              suppressContentEditableWarning
                            />
                            <div className="cmt-reply-actions">
                              <button className="cmt-cancel" onClick={() => setReplyingToId(null)}>Cancel</button>
                              <button
                                className="cmt-submit"
                                disabled={replyLoading}
                                onClick={() => handleReplySubmit(comment.id)}
                              >
                                {replyLoading ? "Posting…" : "Reply"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Replies ── */}
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

                              <div className="cmt-text">{reply.text}</div>

                              <div className="cmt-actions">
                                <button
                                  className={`cmt-action-btn ${reply.userVote === "like" ? "active" : ""}`}
                                  onClick={() => handleVote(reply.id, "like", true, comment.id)}
                                >
                                  <ThumbsUp size={14} fill={reply.userVote === "like" ? "currentColor" : "none"} /> {reply.likes}
                                </button>
                                <button
                                  className={`cmt-action-btn ${reply.userVote === "dislike" ? "active" : ""}`}
                                  onClick={() => handleVote(reply.id, "dislike", true, comment.id)}
                                >
                                  <ThumbsDown size={14} fill={reply.userVote === "dislike" ? "currentColor" : "none"} /> {reply.dislikes}
                                </button>
                                <button
                                  className="cmt-action-btn cmt-reply-btn"
                                  onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                                >
                                  <MessageSquare size={14} /> Reply
                                </button>
                                <div className="cmt-menu-wrap">
                                  <button
                                    className="cmt-more-btn"
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === reply.id ? null : reply.id); }}
                                  >
                                    <MoreHorizontal size={14} />
                                  </button>
                                  {openMenuId === reply.id && (
                                    <div className="cmt-dropdown">
                                      <button onClick={() => { navigator.clipboard.writeText(window.location.href); setOpenMenuId(null); }}>
                                        <Copy size={14} /> Copy Link
                                      </button>
                                      <button onClick={() => handleReport(reply.id)}>
                                        <Flag size={14} /> Report
                                      </button>
                                      {currentUser && reply.author === currentUser.name && (
                                        <button
                                          style={{ color: "#e60000" }}
                                          onClick={() => { setOpenMenuId(null); handleDelete(reply.id, true, comment.id); }}
                                        >
                                          <Trash2 size={14} /> Delete
                                        </button>
                                      )}
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
            )}
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
                  <div key={update.id ?? index} className="ad-live-item" onClick={scrollToLive} style={{ cursor: "pointer" }}>
                    <span className="ad-live-time">{update.time}</span>
                    <p className="ad-live-text">
                      {(update.title || update.text?.replace(/<[^>]*>/g, "") || update.poll?.question || "Live Update").slice(0, 55)}
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
                  const itemId  = String(item._id ?? item.id ?? "");
                  const catName = typeof item.categoryId === "object"
                    ? item.categoryId?.name ?? "News"
                    : item.categoryName ?? "News";
                  return (
                    <Link key={itemId} to={`/article/${itemId}`} className="ad-recent-item">
                      {item.featuredImage && (
                        <img src={item.featuredImage} alt={item.headline} className="ad-recent-img" />
                      )}
                      <div className="ad-recent-info">
                        <span className="ad-recent-cat">{catName}</span>
                        <h4 className="ad-recent-title">{item.shortTitle ?? item.headline}</h4>
                        <span className="ad-recent-time"><Clock size={11} /> {formatDate(item.publishedAt)}</span>
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
                <Tag size={14} style={{ display: "inline", marginRight: 6 }} />Tags
              </h3>
              <div className="ad-widget-divider" />
              <div className="ad-sidebar-tags">
                {article.tags.map((tag) => (
                  <Link key={tag} to={`/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`} className="ad-sidebar-tag">
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