import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Livestories.css"
import { useNavigate } from "react-router-dom";
import { fetchAllNews, deleteNews as apiDeleteNews, updateNews as apiUpdateNews } from "../../../api/news";
 
// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveUpdate {
  id:          number;
  time:        string;
  text:        string;
  timestamp:   string;
  title?:      string;
  isHighlight?: boolean;
  isBreaking?:  boolean;
  imageUrl?:    string;
  imageCaption?: string;
  imageCredit?:  string;
  tweetUrl?:    string;
  poll?:        PollData;
  sourceUrl?:   string;
  sourceLabel?: string;
  tags?:        string[];
}
 
interface PollData {
  question: string;
  options:  { label: string; votes: number }[];
}
 
interface LiveStory {
  id:              string;
  title:           string;
  articleCategory: string;
  status:          "live" | "ended" | "draft";
  views:           string;
  liveStartedAt?:  string | null;
  liveUpdates:     LiveUpdate[];
  published:       string;
  endedAt?:        string | null;
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
 
function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}
 
function mapStory(n: any): LiveStory {
  let status: LiveStory["status"] = "live";
  if (n.statusType === "ended") status = "ended";
  else if (n.status === "DRAFT") status = "draft";
  return {
    id:              n.id,
    title:           n.headline,
    articleCategory: n.category?.name || "",
    status,
    views:           String(n.views ?? 0),
    liveStartedAt:   n.publishedAt || null,
    endedAt:         n.statusType === "ended" ? (n.updatedAt || null) : null,
    liveUpdates:     (n.liveUpdates ?? []).map((u: any, i: number) => ({
      id:        i + 1,
      time:      u.time || new Date(u.timestamp || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      text:      u.text,
      timestamp: u.timestamp || new Date().toISOString(),
      title:        u.title,
      isHighlight:  u.isHighlight,
      isBreaking:   u.isBreaking,
      imageUrl:     u.imageUrl,
      imageCaption: u.imageCaption,
      imageCredit:  u.imageCredit,
      tweetUrl:     u.tweetUrl,
      poll:         u.poll,
      sourceUrl:    u.sourceUrl,
      sourceLabel:  u.sourceLabel,
      tags:         u.tags,
    })),
    published: n.statusType === "ended"
      ? formatDate(n.updatedAt || n.publishedAt)
      : "Live",
  };
}
 
let nextUpdateId = 1000;
 
// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconBroadcast = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49" /><path d="M7.76 7.76a6 6 0 0 0 0 8.49" />
    <path d="M20.07 4.93a10 10 0 0 1 0 14.14" /><path d="M3.93 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);
const IconClock = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconMsg = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconEye = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconAdd = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const IconStop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);
const IconEdit = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const IconImage = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IconTwitter = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconPoll = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const IconStar = ({ size = 16, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconZap = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconLink = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const IconTag = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IconX = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconCalendar = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconArchive = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);
const IconActivity = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconSpinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="9" strokeDasharray="28 56" />
  </svg>
);
 
// ─── Add Update Panel ─────────────────────────────────────────────────────────
interface AddUpdatePanelProps {
  storyId: string;
  onPost:  (storyId: string, update: Partial<LiveUpdate>) => void;
  onClose: () => void;
}
 
const AddUpdatePanel: React.FC<AddUpdatePanelProps> = ({ storyId, onPost, onClose }) => {
  const [title, setTitle]             = useState("");
  const [text, setText]               = useState("");
  const [isHighlight, setIsHighlight] = useState(false);
  const [isBreaking, setIsBreaking]   = useState(false);
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageCredit, setImageCredit]   = useState("");
  const [tweetUrl, setTweetUrl]       = useState("");
  const [showPoll, setShowPoll]       = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [sourceUrl, setSourceUrl]     = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [tagInput, setTagInput]       = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
 
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };
 
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/^#/, "");
      if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
      setTagInput("");
    }
  };
 
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));
 
  const addPollOption = () => {
    if (pollOptions.length < 4) setPollOptions(prev => [...prev, ""]);
  };
 
  const handlePost = () => {
    if (!text.trim()) return;
    const update: Partial<LiveUpdate> = {
      text:        text.trim(),
      title:       title.trim() || undefined,
      isHighlight,
      isBreaking,
      imageUrl:    imagePreview || undefined,
      imageCaption: imageCaption.trim() || undefined,
      imageCredit:  imageCredit.trim() || undefined,
      tweetUrl:    tweetUrl.trim() || undefined,
      sourceUrl:   sourceUrl.trim() || undefined,
      sourceLabel: sourceLabel.trim() || undefined,
      tags:        tags.length ? tags : undefined,
      poll: showPoll && pollQuestion.trim()
        ? { question: pollQuestion, options: pollOptions.filter(Boolean).map(o => ({ label: o, votes: 0 })) }
        : undefined,
    };
    onPost(storyId, update);
  };
 
  return (
    <div className="aup-overlay" onClick={onClose}>
      <div className="aup-panel" onClick={e => e.stopPropagation()}>
        {/* Panel Header */}
        <div className="aup-header">
          <div className="aup-header-left">
            <span className="aup-live-dot" />
            <span className="aup-header-title">Add Live Update</span>
          </div>
          <button className="aup-close" onClick={onClose}><IconX size={16} /></button>
        </div>
 
        <div className="aup-body">
          {/* Toggle Badges Row */}
          <div className="aup-toggles-row">
            <button
              className={`aup-toggle-btn ${isBreaking ? "aup-toggle-btn--breaking active" : ""}`}
              onClick={() => setIsBreaking(v => !v)}
            >
              <IconZap size={13} />
              <span>Breaking</span>
            </button>
            <button
              className={`aup-toggle-btn ${isHighlight ? "aup-toggle-btn--highlight active" : ""}`}
              onClick={() => setIsHighlight(v => !v)}
            >
              <IconStar size={13} />
              <span>Highlight</span>
            </button>
          </div>
 
          {/* Title */}
          <div className="aup-field">
            <label className="aup-label">Update Title <span className="aup-optional">optional</span></label>
            <input
              className="aup-input"
              placeholder="e.g. BJP crosses 250 seats"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
 
          {/* Main Content */}
          <div className="aup-field">
            <label className="aup-label">Update Content <span className="aup-required">*</span></label>
            <div className="aup-richbar">
              <button className="aup-richbtn" title="Bold" onMouseDown={e => { e.preventDefault(); document.execCommand("bold"); }}>
                <strong>B</strong>
              </button>
              <button className="aup-richbtn" title="Italic" onMouseDown={e => { e.preventDefault(); document.execCommand("italic"); }}>
                <em>I</em>
              </button>
              <button className="aup-richbtn" title="Bullet list" onMouseDown={e => { e.preventDefault(); document.execCommand("insertUnorderedList"); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
                  <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
                </svg>
              </button>
              <button className="aup-richbtn" title="Quote" onMouseDown={e => { e.preventDefault(); document.execCommand("formatBlock", false, "blockquote"); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                </svg>
              </button>
            </div>
            <div
              className="aup-textarea"
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Write the update content here. Supports bold, italic, bullet points and quotes..."
              onInput={e => setText((e.target as HTMLDivElement).innerHTML)}
            />
          </div>
 
          {/* Image Upload */}
          <div className="aup-field">
            <label className="aup-label"><IconImage size={13} /> Image Upload <span className="aup-optional">optional</span></label>
            <div
              className="aup-image-drop"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <div className="aup-image-preview-wrap">
                  <img src={imagePreview} alt="preview" className="aup-image-preview" />
                  <button className="aup-image-remove" onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(""); }}>
                    <IconX size={12} />
                  </button>
                </div>
              ) : (
                <div className="aup-image-placeholder">
                  <IconImage size={24} />
                  <span>Click to upload image</span>
                  <small>JPG, PNG, GIF, WebP</small>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
            </div>
            {imagePreview && (
              <div className="aup-image-meta">
                <input className="aup-input" placeholder="Image caption..." value={imageCaption} onChange={e => setImageCaption(e.target.value)} />
                <input className="aup-input" placeholder="Photo credit (e.g. Reuters)" value={imageCredit} onChange={e => setImageCredit(e.target.value)} />
              </div>
            )}
          </div>
 
          {/* Tweet Embed */}
          <div className="aup-field">
            <label className="aup-label"><IconTwitter size={13} /> X / Twitter Embed <span className="aup-optional">optional</span></label>
            <input
              className="aup-input"
              placeholder="https://x.com/user/status/..."
              value={tweetUrl}
              onChange={e => setTweetUrl(e.target.value)}
            />
            {tweetUrl && (
              <div className="aup-tweet-preview">
                <IconTwitter size={14} />
                <span className="aup-tweet-preview-url">{tweetUrl}</span>
                <span className="aup-tweet-badge">Will embed as tweet card</span>
              </div>
            )}
          </div>
 
          {/* Poll */}
          <div className="aup-field">
            <div className="aup-field-toggle-header">
              <label className="aup-label"><IconPoll size={13} /> Poll <span className="aup-optional">optional</span></label>
              <button
                className={`aup-field-toggle ${showPoll ? "active" : ""}`}
                onClick={() => setShowPoll(v => !v)}
              >
                {showPoll ? "Remove Poll" : "Add Poll"}
              </button>
            </div>
            {showPoll && (
              <div className="aup-poll-builder">
                <input
                  className="aup-input"
                  placeholder="Poll question, e.g. Who will win Delhi election?"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                />
                <div className="aup-poll-options">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="aup-poll-option-row">
                      <span className="aup-poll-option-label">Option {i + 1}</span>
                      <input
                        className="aup-input"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={e => {
                          const c = [...pollOptions];
                          c[i] = e.target.value;
                          setPollOptions(c);
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <button className="aup-poll-remove" onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))}>
                          <IconX size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 4 && (
                  <button className="aup-add-option-btn" onClick={addPollOption}>
                    <IconAdd /> Add Option
                  </button>
                )}
              </div>
            )}
          </div>
 
          {/* Source Link */}
          <div className="aup-field">
            <label className="aup-label"><IconLink size={13} /> Source Link <span className="aup-optional">optional</span></label>
            <div className="aup-source-row">
              <input className="aup-input" placeholder="https://..." value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} style={{ flex: 2 }} />
              <input className="aup-input" placeholder="Label (e.g. PTI Report)" value={sourceLabel} onChange={e => setSourceLabel(e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>
 
          {/* Tags */}
          <div className="aup-field">
            <label className="aup-label"><IconTag size={13} /> Tags <span className="aup-optional">press Enter to add</span></label>
            <div className="aup-tags-wrap">
              {tags.map(t => (
                <span key={t} className="aup-tag-chip">
                  #{t}
                  <button className="aup-tag-remove" onClick={() => removeTag(t)}><IconX size={10} /></button>
                </span>
              ))}
              <input
                className="aup-tags-input"
                placeholder="#Election2026 #NarendraModi"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>
        </div>
 
        {/* Footer */}
        <div className="aup-footer">
          <div className="aup-footer-badges">
            {isBreaking && <span className="aup-badge-breaking"><IconZap size={11} /> BREAKING</span>}
            {isHighlight && <span className="aup-badge-highlight"><IconStar size={11} /> HIGHLIGHT</span>}
          </div>
          <div className="aup-footer-actions">
            <button className="aup-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="aup-btn-post" onClick={handlePost} disabled={!text.trim()}>
              <IconBroadcast />
              Post Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
 
// ─── Component ────────────────────────────────────────────────────────────────
const LiveStoriesPage: React.FC = () => {
  const navigate = useNavigate();
 
  const [stories, setStories]         = useState<LiveStory[]>([]);
  const [loading, setLoading]         = useState(true);
  const [openMenuId, setOpenMenuId]   = useState<string | null>(null);
  const [addUpdateId, setAddUpdateId] = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [endingId, setEndingId]       = useState<string | null>(null);
 
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllNews({ articleType: "LIVE", limit: 100 });
      if (!data?.news) { setStories([]); return; }
      setStories(data.news.map(mapStory));
    } catch (err) {
      console.error("Failed to fetch live stories:", err);
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => { loadData(); }, [loadData]);
 
  const liveArticles  = stories.filter(s => s.status === "live");
  const endedArticles = stories.filter(s => s.status === "ended");
  const draftArticles = stories.filter(s => s.status === "draft");
 
  const filterStories = (list: LiveStory[]) =>
    search ? list.filter(s => s.title.toLowerCase().includes(search.toLowerCase())) : list;
 
  const filteredLive  = filterStories(liveArticles);
  const filteredEnded = filterStories(endedArticles);
  const filteredDraft = filterStories(draftArticles);
  const totalUpdates  = stories.reduce((s, a) => s + (a.liveUpdates?.length ?? 0), 0);
 
  const handleAddUpdate = async (storyId: string, partialUpdate: Partial<LiveUpdate>) => {
    const now = new Date();
    const newUpdate: LiveUpdate = {
      id:        nextUpdateId++,
      time:      now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      text:      partialUpdate.text || "",
      timestamp: now.toISOString(),
      ...partialUpdate,
    };
    setStories(prev => prev.map(s =>
      s.id === storyId ? { ...s, liveUpdates: [newUpdate, ...s.liveUpdates] } : s
    ));
    setAddUpdateId(null);
    try {
      const story = stories.find(s => s.id === storyId);
      if (story) {
        await apiUpdateNews(storyId, { liveUpdates: [newUpdate, ...story.liveUpdates] } as any);
      }
    } catch (err) { console.error("Failed to add update:", err); }
  };
 
  const handleEndLive = async (storyId: string) => {
    const now = new Date();
    setStories(prev => prev.map(s =>
      s.id === storyId ? { ...s, status: "ended", endedAt: now.toISOString(), published: formatDate(now.toISOString()) } : s
    ));
    setEndingId(storyId);
    try {
      await apiUpdateNews(storyId, { status: "PUBLISHED", statusType: "ended" } as any);
    } catch (err) {
      console.error("Failed to end live:", err);
      setStories(prev => prev.map(s =>
        s.id === storyId ? { ...s, status: "live", endedAt: null, published: "Live" } : s
      ));
    } finally {
      setEndingId(null);
    }
  };
 
  const handleGoLive = async (storyId: string) => {
    setStories(prev => prev.map(s =>
      s.id === storyId ? { ...s, status: "live", liveStartedAt: new Date().toISOString(), published: "Live" } : s
    ));
    try {
      await apiUpdateNews(storyId, { status: "PUBLISHED", statusType: "published", articleType: "LIVE" } as any);
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
 
  return (
    <>
     
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
        </div>
 
        {/* Stats */}
        <div className="ls-stats">
          <div className="ls-stat-card">
            <div className="ls-stat-info">
              <span className="ls-stat-label">Currently Live</span>
              <span className="ls-stat-value">{liveArticles.length}</span>
            </div>
            <span className="ls-stat-icon ls-stat-icon--live"><IconBroadcast /></span>
          </div>
          <div className="ls-stat-card">
            <div className="ls-stat-info">
              <span className="ls-stat-label">Draft (Ready)</span>
              <span className="ls-stat-value">{draftArticles.length}</span>
            </div>
            <span className="ls-stat-icon ls-stat-icon--draft"><IconClock size={28} /></span>
          </div>
          <div className="ls-stat-card">
            <div className="ls-stat-info">
              <span className="ls-stat-label">Past Live</span>
              <span className="ls-stat-value">{endedArticles.length}</span>
            </div>
            <span className="ls-stat-icon ls-stat-icon--past"><IconArchive /></span>
          </div>
          <div className="ls-stat-card">
            <div className="ls-stat-info">
              <span className="ls-stat-label">Total Updates</span>
              <span className="ls-stat-value">{totalUpdates}</span>
            </div>
            <span className="ls-stat-icon ls-stat-icon--updates"><IconActivity /></span>
          </div>
        </div>
 
        {/* Search */}
        <div className="ls-search-wrap">
          <span className="ls-search-icon"><IconSearch /></span>
          <input className="ls-search" type="text" placeholder="Search live stories..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
 
        {/* CURRENTLY LIVE */}
        <section className="ls-section">
          <div className="ls-section-header">
            <span className="ls-section-dot" />
            <h2 className="ls-section-title">Current Live</h2>
            <span className="ls-badge ls-badge--active">{filteredLive.length} active</span>
          </div>
          <div className="ls-stories-list">
            {loading && <div className="ls-empty">Loading…</div>}
            {!loading && filteredLive.length === 0 && <div className="ls-empty">No live stories currently active</div>}
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
                      <IconClock /> Started: {story.liveStartedAt ? new Date(story.liveStartedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                    <span className="ls-meta-item"><IconMsg /> {story.liveUpdates?.length ?? 0} updates</span>
                    <span className="ls-meta-item"><IconEye /> {story.views} views</span>
                    <span className="ls-meta-item">Last update: {story.liveUpdates?.length ? timeSince(story.liveUpdates[0].timestamp) : "—"}</span>
                  </div>
                </div>
                <div className="ls-story-actions" onClick={e => e.stopPropagation()}>
                  <button className="ls-btn-add-update" onClick={() => setAddUpdateId(story.id)}>
                    <IconAdd /> Add Update
                  </button>
                  <button className="ls-btn-end-live" onClick={() => handleEndLive(story.id)} disabled={endingId === story.id}>
                    {endingId === story.id ? <IconSpinner /> : <IconStop />}
                    {endingId === story.id ? "Ending…" : "End Live"}
                  </button>
                  <div className="ls-more-wrap">
                    <button className="ls-btn-more" onClick={() => toggleMenu(story.id)}>···</button>
                    {openMenuId === story.id && (
                      <div className="ls-dropdown">
                        <button className="ls-dropdown-item" onClick={() => { navigate(`/admin/create?edit=${story.id}&type=live`); setOpenMenuId(null); }}>
                          <IconEdit /> Edit Story
                        </button>
                        <button className="ls-dropdown-item ls-dropdown-item--danger" onClick={() => { setDeleteModal(story.id); setOpenMenuId(null); }}>
                          <IconTrash /> Delete Story
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
 
        {/* DRAFT */}
        {filteredDraft.length > 0 && (
          <section className="ls-section">
            <div className="ls-section-header ls-section-header--muted">
              <IconClock size={16} />
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
                      <IconBroadcast /> Go Live Now
                    </button>
                    <button className="ls-btn-edit-icon" onClick={() => navigate(`/admin/create?edit=${story.id}&type=live`)}>
                      <IconEdit size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
 
        {/* PAST LIVE */}
        <section className="ls-section">
          <div className="ls-section-header ls-section-header--muted">
            <IconArchive size={16} />
            <h2 className="ls-section-title">Past Live</h2>
            <span className="ls-badge ls-badge--count">{filteredEnded.length}</span>
          </div>
          <div className="ls-stories-list">
            {loading && <div className="ls-empty">Loading…</div>}
            {!loading && filteredEnded.length === 0 && (
              <div className="ls-empty">No ended live stories yet — ended stories will appear here permanently until deleted</div>
            )}
            {filteredEnded.map(story => (
              <div className="ls-story-card ls-story-card--ended" key={story.id}>
                <div className="ls-story-main">
                  <div className="ls-story-tags">
                    <span className="ls-tag ls-tag--ended">ENDED</span>
                    <span className="ls-story-category">{story.articleCategory}</span>
                  </div>
                  <h3 className="ls-story-title">{story.title}</h3>
                  <div className="ls-story-meta">
                    <span className="ls-meta-item"><IconCalendar /> Ended: {story.published}</span>
                    <span className="ls-meta-item"><IconMsg /> {story.liveUpdates?.length ?? 0} updates</span>
                    <span className="ls-meta-item"><IconEye /> {story.views} views</span>
                  </div>
                </div>
                <div className="ls-story-actions" onClick={e => e.stopPropagation()}>
                  <div className="ls-more-wrap">
                    <button className="ls-btn-more" onClick={() => toggleMenu(story.id)}>···</button>
                    {openMenuId === story.id && (
                      <div className="ls-dropdown">
                        <button className="ls-dropdown-item" onClick={() => { navigate(`/admin/create?edit=${story.id}&type=live`); setOpenMenuId(null); }}>
                          <IconEye size={14} /> View Story
                        </button>
                        <button className="ls-dropdown-item ls-dropdown-item--danger" onClick={() => { setDeleteModal(story.id); setOpenMenuId(null); }}>
                          <IconTrash /> Delete Permanently
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
 
        {/* ADD UPDATE PANEL */}
        {addUpdateId && (
          <AddUpdatePanel
            storyId={addUpdateId}
            onPost={handleAddUpdate}
            onClose={() => setAddUpdateId(null)}
          />
        )}
 
        {/* DELETE MODAL */}
        {deleteModal !== null && (
          <div className="ls-modal-overlay" onClick={() => setDeleteModal(null)}>
            <div className="ls-modal" onClick={e => e.stopPropagation()}>
              <div className="ls-modal-icon">
                <IconTrash size={22} />
              </div>
              <h4>Delete Story?</h4>
              <p>This action cannot be undone. The story and all its updates will be permanently removed.</p>
              <div className="ls-modal-actions">
                <button className="ls-modal-cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
                <button className="ls-modal-confirm" onClick={handleDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
 
export default LiveStoriesPage;