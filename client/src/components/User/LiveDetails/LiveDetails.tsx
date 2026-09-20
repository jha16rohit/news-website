import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock, Facebook, AlertCircle, Radio, MapPin, Camera, Share2 } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import "./LiveDetails.css";
import { fetchNewsById } from "../../../api/news";
import Preloader from "../../Admin/Preloader/Preloder";
import NotFound404 from "../Errors/NotFound404";

interface LiveUpdate {
  id: string;
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

interface LiveArticle {
  _id: string;
  headline: string;
  shortTitle?: string;
  category: string;
  categoryId?: { name: string; color: string } | string;
  author: string;
  publishedAt?: string;
  views: number;
  featuredImage?: string;
  imageCaption?: string;
  photoCredit?: string;
  articleType: string;
  statusType?: string;
  liveUpdates: LiveUpdate[];
  metaTitle?: string;
  metaDescription?: string;
  location?: string;
  slug?: string;
}

const LiveDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [liveArticle, setLiveArticle] = useState<LiveArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const data = await fetchNewsById(eventId!);
        if (data && data.articleType === "LIVE") {
          setLiveArticle(data);
        } else {
          setNotFound(true);
        }
      } catch (error: any) {
        console.error("Failed to fetch live article:", error);
        const errorMessage = error?.message || "";
        if (errorMessage.includes("not found") || errorMessage.includes("404")) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };
    if (eventId) {
      fetchArticle();
    }
  }, [eventId]);

  if (loading) {
    return <Preloader />;
  }

  if (notFound || !liveArticle) {
    return <NotFound404 />;
  }

  const categoryName = typeof liveArticle.categoryId === "object" ? liveArticle.categoryId?.name : liveArticle.category;
  const status = liveArticle.statusType === "ended" ? "ENDED" : "LIVE";
  const lastUpdateTime = liveArticle.liveUpdates?.[0]?.time || "Just now";

  // SEO Metadata
  useEffect(() => {
    if (!liveArticle) return;

    document.title = liveArticle.metaTitle?.trim() || liveArticle.headline;

    const description = liveArticle.metaDescription?.trim() || liveArticle.shortTitle?.trim() || "";

    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;

    return () => {
      document.title = "LocalNewz";
    };
  }, [liveArticle]);

  return (
    <div className="live-page">
      <div className="live-container">
        
        {/* Main Feed Column */}
        <main className="live-main">
          
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="divider">/</span>
            <span className="current">Live Updates</span>
          </div>

          {/* Header Area */}
          <div className="live-header-box">
            <div className="live-badges">
              <span className="live-indicator">
                <span className="pulsing-dot"></span>
                {status}
              </span>
              <span className="live-category">{categoryName || "News"}</span>
            </div>
            <h1 className="live-headline">{liveArticle.headline}</h1>
            <div className="live-meta">
              <span><AlertCircle size={16} /> Last updated: {lastUpdateTime}</span>
              <span><Clock size={16} /> {liveArticle.views?.toLocaleString() || "0"} views</span>
            </div>
          </div>

          {/* Video / Main Image Area */}
          {liveArticle.featuredImage && (
            <div className="live-media-player">
              <img src={liveArticle.featuredImage} alt="Live Stream" className="live-video-placeholder" />
              <div className="play-button-overlay">▶</div>
              {(liveArticle.imageCaption || liveArticle.photoCredit) && (
                <figcaption className="hero-caption">
                  {liveArticle.imageCaption && <span>{liveArticle.imageCaption}</span>}
                  {liveArticle.photoCredit && (
                    <span className="photo-credit"><Camera size={18} /> {liveArticle.photoCredit}</span>
                  )}
                </figcaption>
              )}
            </div>
          )}

          {/* The Timeline Feed */}
          <div className="timeline-container">
            <div className="timeline-header">
              <h2>Latest Updates</h2>
              <div className="share-buttons">
                <button className="share-btn fb" onClick={() => handleShare("fb", liveArticle)} title="Share on Facebook"><Facebook size={14} /></button>
                <button className="share-btn tw" onClick={() => handleShare("tw", liveArticle)} title="Share on X"><FaXTwitter size={14} /></button>
                <button className="share-btn wa" onClick={() => handleShare("whatsapp", liveArticle)} title="Share on WhatsApp"><Share2 size={14} /></button>
                <button className="share-btn copy" onClick={() => handleShare("copy", liveArticle)} title="Copy link"><AlertCircle size={14} /></button>
              </div>
            </div>

            <div className="timeline-feed">
              {liveArticle.liveUpdates?.length > 0 ? (
                liveArticle.liveUpdates.map((update) => (
                  <div className={`timeline-item ${update.isBreaking ? 'important-update' : update.isHighlight ? 'highlight-update' : ''}`} key={update.id}>
                    {/* The dot and line */}
                    <div className="timeline-marker">
                      <div className={`timeline-dot${update.isBreaking ? ' breaking' : update.isHighlight ? ' highlight' : ''}`}></div>
                      <div className="timeline-line"></div>
                    </div>
                    {/* The content */}
                    <div className="timeline-content">
                      <span className="update-time">{update.time}</span>
                      {update.title && <h3 className="update-title">{update.title}</h3>}
                      {update.text && update.text.replace(/<[^>]*>/g, "").trim() && (
                        <p className="update-text" dangerouslySetInnerHTML={{ __html: update.text }} />
                      )}
                      {update.imageUrl && (
                        <div className="update-image-wrap">
                          <img src={update.imageUrl} alt={update.imageCaption || ""} className="update-image" />
                          {(update.imageCaption || update.imageCredit) && (
                            <div className="update-image-caption">
                              <span>{update.imageCaption}</span>
                              {update.imageCredit && (
                                <span className="update-image-credit"><Camera size={14} /> {update.imageCredit}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {update.tweetUrl && (
                        <div className="update-tweet">
                          <FaXTwitter size={14} />
                          <a href={update.tweetUrl} target="_blank" rel="noopener noreferrer" className="update-tweet-url">
                            {update.tweetUrl}
                          </a>
                        </div>
                      )}
                      {update.poll && (() => {
                          const poll = update.poll;
                          const total = poll.totalVotes || poll.options.reduce((s, o) => s + o.votes, 0);
                          return (
                            <div className="update-poll">
                              <p className="update-poll-q">{poll.question}</p>
                              {poll.options.map((opt, i) => {
                                const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                                return (
                                  <div key={i} className="update-poll-option">
                                    <span style={{ flex: 1 }}>{opt.label}</span>
                                    <div className="update-poll-bar-wrap">
                                      <div className="update-poll-bar" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="update-poll-votes">{pct}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      {update.sourceUrl && (
                        <div className="update-source">
                          <MapPin size={11} />
                          Source:{" "}
                          <a href={update.sourceUrl} target="_blank" rel="noopener noreferrer">
                            {update.sourceLabel || update.sourceUrl}
                          </a>
                        </div>
                      )}
                      {update.tags && update.tags.length > 0 && (
                        <div className="update-tags">
                          {update.tags.map(t => (
                            <span key={t} className="update-tag">#{t}</span>
                          ))}
                        </div>
                      )}
                      {(update.isBreaking || update.isHighlight) && (
                        <span className={`key-event-tag${update.isBreaking ? ' breaking' : ''}`}>
                          {update.isBreaking ? "BREAKING" : "HIGHLIGHT"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="timeline-empty">
                  <Radio size={32} />
                  <p>No live updates posted yet.</p>
                </div>
              )}
            </div>
          </div>

        </main>

        {/* Sidebar */}
        <aside className="live-sidebar">
          <div className="sidebar-widget">
            <h3 className="widget-title">About This Coverage</h3>
            <div className="widget-underline"></div>
            <p className="widget-text">
              {liveArticle.shortTitle || liveArticle.headline}
            </p>
            {liveArticle.location && (
              <p className="widget-text" style={{ marginTop: 12 }}>
                <MapPin size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                {liveArticle.location}
              </p>
            )}
            {liveArticle.publishedAt && (
              <p className="widget-text" style={{ marginTop: 8 }}>
                <Clock size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                Started: {new Date(liveArticle.publishedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>

          {liveArticle.liveUpdates && liveArticle.liveUpdates.length > 0 && (
            <div className="sidebar-widget">
              <h3 className="widget-title">Update Summary</h3>
              <div className="widget-underline"></div>
              <ul className="speaker-list">
                {liveArticle.liveUpdates.slice(0, 5).map((update) => (
                  <li key={update.id}>
                    <strong>{update.time}</strong> - {update.title || update.text?.replace(/<[^>]*>/g, "").slice(0, 60) || "Update"}
                  </li>
                ))}
                {liveArticle.liveUpdates.length > 5 && (
                  <li style={{ color: "#e60000", fontWeight: 600 }}>
                    +{liveArticle.liveUpdates.length - 5} more updates
                  </li>
                )}
              </ul>
            </div>
          )}

        </aside>

      </div>
    </div>
  );
};

// Share handler
const handleShare = (platform: "fb" | "tw" | "whatsapp" | "copy", article: LiveArticle) => {
  const slug = article.slug || article._id;
  if (!slug) return;

  const backendBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:5001";
  const shareUrl = `${backendBaseUrl}/share/news/${encodeURIComponent(slug)}`;

  if (platform === "fb") {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=500");
  } else if (platform === "tw") {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.headline)}`, "_blank", "width=600,height=500");
  } else if (platform === "whatsapp") {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${article.headline}\n${shareUrl}`)}`, "_blank");
  } else if (platform === "copy") {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied!");
  }
};

export default LiveDetail;