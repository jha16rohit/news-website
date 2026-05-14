import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Livestories.css";
import { useNavigate } from "react-router-dom";
import {
  fetchAllNews,
  deleteNews      as apiDeleteNews,
  updateNews      as apiUpdateNews,
  appendLiveUpdate as apiAppendLiveUpdate,
} from "../../../api/news";
import { useNewsEvent, useNewsSubscription } from "../../../context/newscontext";


// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveUpdate {
  id:            number;
  time:          string;
  text:          string;
  timestamp:     string;
  title?:        string;
  isHighlight?:  boolean;
  isBreaking?:   boolean;
  imageUrl?:     string;
  imageCaption?: string;
  imageCredit?:  string;
  tweetUrl?:     string;
  poll?:         PollData;
  sourceUrl?:    string;
  sourceLabel?:  string;
  tags?:         string[];
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

// ─── Topic Profile ────────────────────────────────────────────────────────────
interface TopicProfile {
  id: string;
  name: string;
  slug: string;
  caption: string;
  description: string;
  imageUrl?: string;
}

async function fetchTopicProfiles(): Promise<TopicProfile[]> {
  try {
    const res = await fetch("http://localhost:5001/api/topic-profiles", { credentials: "include" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function restoreSelection(range: Range | null) {
  if (!range) return;
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
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
      id:           u.id ?? (i + 1),
      time:         u.time || new Date(u.timestamp || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      text:         u.text,
      timestamp:    u.timestamp || new Date().toISOString(),
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
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
    <path d="M7.76 7.76a6 6 0 0 0 0 8.49" />
    <path d="M20.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M3.93 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);
const IconClock = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconMsg = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconEye = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconAdd = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const IconStop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const IconImage = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IconTwitter = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const IconPoll = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconCalendar = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconArchive = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);
const IconActivity = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconSpinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="9" strokeDasharray="28 56" />
  </svg>
);
const IconFileText = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// ─── Topic Link Modal ─────────────────────────────────────────────────────────
interface TopicLinkModalProps {
  savedRange: Range | null;
  editorRef:  React.RefObject<HTMLDivElement | null>;
  onClose:    () => void;
}

const TopicLinkModal: React.FC<TopicLinkModalProps> = ({ savedRange, editorRef, onClose }) => {
  const [query,      setQuery]      = useState("");
  const [profiles,   setProfiles]   = useState<TopicProfile[]>([]);
  const [filtered,   setFiltered]   = useState<TopicProfile[]>([]);
  const [manualSlug, setManualSlug] = useState("");
  const [tab,        setTab]        = useState<"search" | "manual">("search");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTopicProfiles().then(data => {
      setProfiles(data);
      setFiltered(data);
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    setFiltered(
      q
        ? profiles.filter(
            p =>
              p.name.toLowerCase().includes(q) ||
              p.slug.toLowerCase().includes(q) ||
              p.caption.toLowerCase().includes(q)
          )
        : profiles
    );
  }, [query, profiles]);

  const applyLink = (href: string, label: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    restoreSelection(savedRange);
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    if (sel.toString().trim()) {
      document.execCommand("createLink", false, href);
      const node = sel.getRangeAt(0).commonAncestorContainer;
      const anchor =
        (node as Element).closest?.("a") ??
        (node.parentElement as Element)?.closest("a");
      if (anchor) {
        (anchor as HTMLAnchorElement).target    = "_blank";
        (anchor as HTMLAnchorElement).className = "aup-topic-link";
      }
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${href}" class="aup-topic-link" target="_blank" rel="noopener noreferrer">${label}</a>`
      );
    }
    onClose();
  };

  return (
    <div className="aup-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="aup-modal aup-modal--topic" role="dialog" aria-modal="true">
        <div className="aup-modal-header">
          <div className="aup-modal-title-wrap">
            <div className="aup-modal-icon aup-modal-icon--topic">
              <IconLink size={20} />
            </div>
            <div>
              <h2 className="aup-modal-title">Insert Topic Link</h2>
              <p className="aup-modal-subtitle">Link selected text to a topic profile page</p>
            </div>
          </div>
          <button className="aup-modal-close" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <div className="aup-topic-tabs">
          <button
            className={`aup-topic-tab${tab === "search" ? " aup-topic-tab--active" : ""}`}
            onClick={() => setTab("search")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search Profiles
          </button>
          <button
            className={`aup-topic-tab${tab === "manual" ? " aup-topic-tab--active" : ""}`}
            onClick={() => setTab("manual")}
          >
            <IconLink size={13} />
            Manual Slug
          </button>
        </div>

        <div className="aup-modal-body aup-modal-body--topic">
          {tab === "search" && (
            <>
              <div className="aup-topic-search-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="aup-topic-search-icon">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  className="aup-input aup-topic-search-input"
                  placeholder="Search by name, slug, or caption…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button className="aup-topic-clear" onClick={() => setQuery("")}>
                    <IconX size={13} />
                  </button>
                )}
              </div>
              {profiles.length === 0 ? (
                <div className="aup-topic-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <p>No topic profiles found.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="aup-topic-empty">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <p>No profiles match "{query}"</p>
                </div>
              ) : (
                <ul className="aup-topic-list">
                  {filtered.map(p => (
                    <li key={p.id} className="aup-topic-item" onClick={() => applyLink(`/topic/${p.slug}`, p.name)}>
                      <div className="aup-topic-avatar">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} />
                        ) : (
                          <span>{p.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="aup-topic-info">
                        <span className="aup-topic-name">{p.name}</span>
                        {p.caption && <span className="aup-topic-caption">{p.caption}</span>}
                        <span className="aup-topic-slug">/topic/{p.slug}</span>
                      </div>
                      <div className="aup-topic-arrow">→</div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {tab === "manual" && (
            <div className="aup-topic-manual">
              <p className="aup-topic-manual-hint">
                Enter a topic slug directly. Formatted as <code>/topic/your-slug</code>.
              </p>
              <div className="aup-slug-input-wrap">
                <span className="aup-slug-prefix">/topic/</span>
                <input
                  className="aup-input aup-slug-input"
                  placeholder="your-topic-slug"
                  value={manualSlug}
                  onChange={e => setManualSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  onKeyDown={e => e.key === "Enter" && applyLink(`/topic/${manualSlug}`, manualSlug)}
                  autoFocus
                />
              </div>
              <button
                className="aup-btn-post"
                style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                onClick={() => applyLink(`/topic/${manualSlug}`, manualSlug)}
                disabled={!manualSlug.trim()}
              >
                <IconLink size={14} /> Apply Link
              </button>
            </div>
          )}
        </div>

        <div className="aup-modal-footer">
          <button className="aup-btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Add / Edit Update Panel ──────────────────────────────────────────────────
interface AddUpdatePanelProps {
  storyId:       string;
  editingUpdate?: LiveUpdate | null;   // if set → edit mode
  onPost:        (storyId: string, update: Partial<LiveUpdate>) => void;
  onClose:       () => void;
}

const AddUpdatePanel: React.FC<AddUpdatePanelProps> = ({ storyId, editingUpdate, onPost, onClose }) => {
  const isEditing = !!editingUpdate;

  const [title,          setTitle]          = useState(editingUpdate?.title ?? "");
  const [text,           setText]           = useState(editingUpdate?.text ?? "");
  const [_imageFile,     setImageFile]      = useState<File | null>(null);
  const [imagePreview,   setImagePreview]   = useState<string>(editingUpdate?.imageUrl ?? "");
  const [imageCaption,   setImageCaption]   = useState(editingUpdate?.imageCaption ?? "");
  const [imageCredit,    setImageCredit]    = useState(editingUpdate?.imageCredit ?? "");
  const [tweetUrl,       setTweetUrl]       = useState(editingUpdate?.tweetUrl ?? "");
  const [showPoll,       setShowPoll]       = useState(!!(editingUpdate?.poll));
  const [pollQuestion,   setPollQuestion]   = useState(editingUpdate?.poll?.question ?? "");
  const [pollOptions,    setPollOptions]    = useState<string[]>(
    editingUpdate?.poll?.options?.map(o => o.label) ?? ["", ""]
  );
  const [sourceUrl,      setSourceUrl]      = useState(editingUpdate?.sourceUrl ?? "");
  const [sourceLabel,    setSourceLabel]    = useState(editingUpdate?.sourceLabel ?? "");
  const [tagInput,       setTagInput]       = useState("");
  const [tags,           setTags]           = useState<string[]>(editingUpdate?.tags ?? []);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [savedRange,     setSavedRange]     = useState<Range | null>(null);

  const fileRef   = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Populate contenteditable with existing text when editing
  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.innerHTML = editingUpdate?.text ?? "";
    }
  }, [editingUpdate?.text, isEditing]);

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

  const handleToolbarAction = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    const el = editorRef.current;
    if (!el) return;

    if (action === "topic") {
      el.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        setSavedRange(sel.getRangeAt(0).cloneRange());
      }
      setShowTopicModal(true);
      return;
    }

    el.focus();
    switch (action) {
      case "bold":   document.execCommand("bold");   break;
      case "italic": document.execCommand("italic"); break;
      case "bullet": document.execCommand("insertUnorderedList"); break;
      case "quote":  document.execCommand("formatBlock", false, "blockquote"); break;
    }
    setText(el.innerHTML);
  };

  const bodyText  = editorRef.current?.innerText?.trim() ?? text.trim();
  const hasTitle  = title.trim().length > 0;
  const hasBody   = bodyText.length > 0;
  const hasImage  = !!imagePreview;
  const hasTweet  = tweetUrl.trim().length > 0;
  const hasPoll   = showPoll && pollQuestion.trim().length > 0 && pollOptions.filter(Boolean).length >= 2;
  const hasSource = sourceUrl.trim().length > 0;
  const hasTags   = tags.length > 0;
  const canPost   = hasTitle || hasBody || hasImage || hasTweet || hasPoll || hasSource || hasTags;

  const handlePost = () => {
    if (!canPost) return;
    const finalText = editorRef.current?.innerHTML ?? text;
    const update: Partial<LiveUpdate> = {
      ...(isEditing ? { id: editingUpdate!.id, time: editingUpdate!.time, timestamp: editingUpdate!.timestamp } : {}),
      ...(finalText && editorRef.current?.innerText?.trim() ? { text: finalText } : { text: "" }),
      ...(title.trim()        ? { title: title.trim() }               : {}),
      ...(imagePreview        ? { imageUrl: imagePreview }             : {}),
      ...(imageCaption.trim() ? { imageCaption: imageCaption.trim() }  : {}),
      ...(imageCredit.trim()  ? { imageCredit: imageCredit.trim() }    : {}),
      ...(tweetUrl.trim()     ? { tweetUrl: tweetUrl.trim() }          : {}),
      ...(sourceUrl.trim()    ? { sourceUrl: sourceUrl.trim() }        : {}),
      ...(sourceLabel.trim()  ? { sourceLabel: sourceLabel.trim() }    : {}),
      ...(tags.length         ? { tags }                               : {}),
      ...(hasPoll
        ? {
            poll: {
              question: pollQuestion,
              options:  pollOptions.filter(Boolean).map(o => ({ label: o, votes: 0 })),
            },
          }
        : {}),
    };
    onPost(storyId, update);
  };

  const contentSummary: string[] = [
    ...(hasTitle  ? ["Title"]       : []),
    ...(hasBody   ? ["Text"]        : []),
    ...(hasImage  ? ["Image"]       : []),
    ...(hasTweet  ? ["Tweet"]       : []),
    ...(hasPoll   ? ["Poll"]        : []),
    ...(hasSource ? ["Source link"] : []),
    ...(hasTags   ? [`${tags.length} tag${tags.length > 1 ? "s" : ""}`] : []),
  ];

  return (
    <>
      <div className="aup-overlay" onClick={onClose}>
        <div className="aup-panel" onClick={e => e.stopPropagation()}>

          <div className="aup-header">
            <div className="aup-header-left">
              <span className="aup-live-dot" />
              <span className="aup-header-title">
                {isEditing ? "Edit Update" : "Add Live Update"}
              </span>
            </div>
            <button className="aup-close" onClick={onClose}>
              <IconX size={16} />
            </button>
          </div>

          <div className="aup-body">

            <div className="aup-field">
              <label className="aup-label">Update Title</label>
              <input
                className="aup-input"
                placeholder="e.g. BJP crosses 250 seats"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="aup-field">
              <label className="aup-label">Update Content</label>
              <div className="aup-editor-wrap">
                <div className="aup-richbar">
                  <button className="aup-richbtn" title="Bold" onMouseDown={e => handleToolbarAction(e, "bold")}>
                    <strong>B</strong>
                  </button>
                  <button className="aup-richbtn" title="Italic" onMouseDown={e => handleToolbarAction(e, "italic")}>
                    <em>I</em>
                  </button>
                  <button className="aup-richbtn" title="Bullet list" onMouseDown={e => handleToolbarAction(e, "bullet")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
                      <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
                    </svg>
                  </button>
                  <button className="aup-richbtn" title="Quote" onMouseDown={e => handleToolbarAction(e, "quote")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                    </svg>
                  </button>
                  <div className="aup-richbar-divider" />
                  <button className="aup-richbtn aup-richbtn--topic" title="Insert Topic Link" onMouseDown={e => handleToolbarAction(e, "topic")}>
                    <IconLink size={13} />
                    <span className="aup-richbtn-topic-label">Topic</span>
                  </button>
                </div>
                <div
                  ref={editorRef}
                  className="aup-textarea"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Write the update content here..."
                  onInput={e => setText((e.target as HTMLDivElement).innerHTML)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const sel = window.getSelection();
                      if (!sel || !sel.rangeCount) return;
                      const block = sel.getRangeAt(0).startContainer.parentElement?.closest("blockquote");
                      if (block) {
                        e.preventDefault();
                        document.execCommand("insertParagraph", false);
                        document.execCommand("formatBlock", false, "div");
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="aup-field">
              <label className="aup-label"><IconImage size={13} /> Image</label>
              <div className="aup-image-drop" onClick={() => fileRef.current?.click()}>
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

            <div className="aup-field">
              <label className="aup-label"><IconTwitter size={13} /> Tweet URL</label>
              <input className="aup-input" placeholder="https://x.com/user/status/..." value={tweetUrl} onChange={e => setTweetUrl(e.target.value)} />
              {tweetUrl && (
                <div className="aup-tweet-preview">
                  <IconTwitter size={14} />
                  <span className="aup-tweet-preview-url">{tweetUrl}</span>
                  <span className="aup-tweet-badge">Will embed as tweet card</span>
                </div>
              )}
            </div>

            <div className="aup-field">
              <div className="aup-field-toggle-header">
                <label className="aup-label"><IconPoll size={13} /> Poll</label>
                <button className={`aup-field-toggle ${showPoll ? "active" : ""}`} onClick={() => setShowPoll(v => !v)}>
                  {showPoll ? "Remove Poll" : "Add Poll"}
                </button>
              </div>
              {showPoll && (
                <div className="aup-poll-builder">
                  <input className="aup-input" placeholder="Poll question..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
                  <div className="aup-poll-options">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="aup-poll-option-row">
                        <span className="aup-poll-option-label">Option {i + 1}</span>
                        <input
                          className="aup-input"
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={e => { const c = [...pollOptions]; c[i] = e.target.value; setPollOptions(c); }}
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
                    <button className="aup-add-option-btn" onClick={addPollOption}><IconAdd /> Add Option</button>
                  )}
                  {showPoll && !hasPoll && (pollQuestion.trim() || pollOptions.some(Boolean)) && (
                    <div className="aup-poll-hint">Add a question and at least 2 options to include the poll</div>
                  )}
                </div>
              )}
            </div>

            <div className="aup-field">
              <label className="aup-label"><IconLink size={13} /> Source Link</label>
              <div className="aup-source-row">
                <input className="aup-input" placeholder="https://..." value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} style={{ flex: 2 }} />
                <input className="aup-input" placeholder="Label (e.g. PTI Report)" value={sourceLabel} onChange={e => setSourceLabel(e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>

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

          <div className="aup-footer">
            {contentSummary.length > 0 && (
              <div className="aup-content-summary">
                {contentSummary.map(item => (
                  <span key={item} className="aup-content-chip">{item}</span>
                ))}
              </div>
            )}
            <div className="aup-footer-actions">
              <button className="aup-btn-cancel" onClick={onClose}>Cancel</button>
              <button className="aup-btn-post" onClick={handlePost} disabled={!canPost}>
                {isEditing ? <><IconEdit size={14} /> Save Changes</> : <><IconBroadcast /> Post Update</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTopicModal && (
        <TopicLinkModal savedRange={savedRange} editorRef={editorRef} onClose={() => setShowTopicModal(false)} />
      )}
    </>
  );
};

// ─── Story Detail Panel ───────────────────────────────────────────────────────
interface StoryDetailPanelProps {
  story:          LiveStory;
  onClose:        () => void;
  onAddUpdate:    (storyId: string, update: Partial<LiveUpdate>) => void;
  onEditUpdate:   (storyId: string, update: Partial<LiveUpdate>) => void;
  onDeleteUpdate: (storyId: string, updateId: number) => void;
}

const StoryDetailPanel: React.FC<StoryDetailPanelProps> = ({
  story, onClose, onAddUpdate, onEditUpdate, onDeleteUpdate
}) => {
  const [openMenuUpdateId,  setOpenMenuUpdateId]  = useState<number | null>(null);
  const [addUpdateOpen,     setAddUpdateOpen]      = useState(false);
  const [editingUpdate,     setEditingUpdate]      = useState<LiveUpdate | null>(null);
  const [deleteUpdateModal, setDeleteUpdateModal]  = useState<number | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setOpenMenuUpdateId(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalVotes = (poll: PollData) => poll.options.reduce((s, o) => s + o.votes, 0);

  const handleEditUpdate = (update: LiveUpdate) => {
    setEditingUpdate(update);
    setOpenMenuUpdateId(null);
  };

  const handleDeleteUpdateConfirm = () => {
    if (deleteUpdateModal === null) return;
    onDeleteUpdate(story.id, deleteUpdateModal);
    setDeleteUpdateModal(null);
  };

  return (
    <>
      <div className="sdp-overlay" onClick={onClose}>
        <div className="sdp-panel" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="sdp-header">
            <div className="sdp-header-left">
              <div className="sdp-header-tags">
                {story.status === "live"  && <span className="ls-tag ls-tag--live">LIVE</span>}
                {story.status === "ended" && <span className="ls-tag ls-tag--ended">ENDED</span>}
                {story.status === "draft" && <span className="ls-tag ls-tag--draft">DRAFT</span>}
                {story.articleCategory && <span className="ls-story-category">{story.articleCategory}</span>}
              </div>
              <h2 className="sdp-header-title">{story.title}</h2>
              <div className="sdp-header-meta">
                {story.status === "live" && story.liveStartedAt && (
                  <span className="sdp-meta-item">
                    <IconClock size={12} />
                    Started {new Date(story.liveStartedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {story.status === "ended" && (
                  <span className="sdp-meta-item">
                    <IconCalendar size={12} /> Ended: {story.published}
                  </span>
                )}
                <span className="sdp-meta-item">
                  <IconMsg size={12} /> {story.liveUpdates.length} updates
                </span>
                <span className="sdp-meta-item">
                  <IconEye size={12} /> {story.views} views
                </span>
              </div>
            </div>
            <button className="sdp-close" onClick={onClose}><IconX size={16} /></button>
          </div>

          {/* Toolbar */}
          <div className="sdp-toolbar">
            <span className="sdp-toolbar-left">
              {story.liveUpdates.length === 0
                ? "No updates yet"
                : `${story.liveUpdates.length} update${story.liveUpdates.length !== 1 ? "s" : ""} — latest first`}
            </span>
            {story.status === "live" && (
              <div className="sdp-toolbar-right">
                <button className="sdp-btn-add" onClick={() => setAddUpdateOpen(true)}>
                  <IconAdd /> Add Update
                </button>
              </div>
            )}
          </div>

          {/* Timeline body */}
          <div className="sdp-body">
            {story.liveUpdates.length === 0 ? (
              <div className="sdp-empty">
                <IconFileText size={40} />
                <p>No updates have been posted yet.</p>
              </div>
            ) : (
              <div className="sdp-timeline">
                {story.liveUpdates.map(update => (
                  <div className="sdp-update-item" key={update.id}>
                    {/* Timeline dot */}
                    <div className="sdp-update-dot-wrap">
                      <div className={`sdp-update-dot${update.isBreaking ? " sdp-update-dot--live" : update.isHighlight ? " sdp-update-dot--highlight" : ""}`}>
                        {update.isBreaking ? (
                          <span style={{ width: 8, height: 8, background: "#e02020", borderRadius: "50%", display: "block" }} />
                        ) : (
                          <span style={{ width: 6, height: 6, background: "#ccc", borderRadius: "50%", display: "block" }} />
                        )}
                      </div>
                    </div>

                    {/* Card */}
                    <div className="sdp-update-card">
                      {/* Card header: time + badges + actions */}
                      <div className="sdp-update-card-header">
                        <div className="sdp-update-time-wrap">
                          <span className="sdp-update-time">{update.time}</span>
                          <span className="sdp-update-date">
                            {new Date(update.timestamp).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                          </span>
                          <div className="sdp-update-badges">
                            {update.isBreaking  && <span className="sdp-update-badge sdp-update-badge--breaking">BREAKING</span>}
                            {update.isHighlight && <span className="sdp-update-badge sdp-update-badge--highlight">HIGHLIGHT</span>}
                          </div>
                        </div>

                        {/* Actions dropdown */}
                        <div className="sdp-update-actions" onMouseDown={e => e.stopPropagation()}>
                          <button
                            className="sdp-update-menu-btn"
                            onClick={() => setOpenMenuUpdateId(openMenuUpdateId === update.id ? null : update.id)}
                          >
                            ···
                          </button>
                          {openMenuUpdateId === update.id && (
                            <div className="sdp-update-dropdown">
                              <button
                                className="sdp-update-dropdown-item"
                                onClick={() => handleEditUpdate(update)}
                              >
                                <IconEdit size={13} /> Edit Update
                              </button>
                              <button
                                className="sdp-update-dropdown-item sdp-update-dropdown-item--danger"
                                onClick={() => {
                                  setDeleteUpdateModal(update.id);
                                  setOpenMenuUpdateId(null);
                                }}
                              >
                                <IconTrash size={13} /> Delete Update
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="sdp-update-card-body">
                        {update.title && <h4 className="sdp-update-title">{update.title}</h4>}

                        {update.text && update.text.replace(/<[^>]*>/g, "").trim() && (
                          <div
                            className="sdp-update-text"
                            dangerouslySetInnerHTML={{ __html: update.text }}
                          />
                        )}

                        {update.imageUrl && (
                          <div className="sdp-update-image-wrap">
                            <img src={update.imageUrl} alt={update.imageCaption || ""} className="sdp-update-image" />
                            {(update.imageCaption || update.imageCredit) && (
                              <div className="sdp-update-image-caption">
                                <span>{update.imageCaption}</span>
                                {update.imageCredit && (
                                  <span className="sdp-update-image-credit">📷 {update.imageCredit}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {update.tweetUrl && (
                          <div className="sdp-update-tweet">
                            <IconTwitter size={14} />
                            <a href={update.tweetUrl} target="_blank" rel="noopener noreferrer" className="sdp-update-tweet-url">
                              {update.tweetUrl}
                            </a>
                          </div>
                        )}

                        {update.poll && (
                          <div className="sdp-update-poll">
                            <p className="sdp-update-poll-q">{update.poll.question}</p>
                            {update.poll.options.map((opt, i) => {
                              const total = totalVotes(update.poll!);
                              const pct   = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                              return (
                                <div key={i} className="sdp-update-poll-option">
                                  <span style={{ flex: 1 }}>{opt.label}</span>
                                  <div className="sdp-update-poll-bar-wrap">
                                    <div className="sdp-update-poll-bar" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="sdp-update-poll-votes">{pct}%</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {update.sourceUrl && (
                          <div className="sdp-update-source">
                            <IconLink size={11} />
                            Source:{" "}
                            <a href={update.sourceUrl} target="_blank" rel="noopener noreferrer">
                              {update.sourceLabel || update.sourceUrl}
                            </a>
                          </div>
                        )}

                        {update.tags && update.tags.length > 0 && (
                          <div className="sdp-update-tags">
                            {update.tags.map(t => (
                              <span key={t} className="sdp-update-tag">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Update panel (from detail view) */}
      {addUpdateOpen && (
        <AddUpdatePanel
          storyId={story.id}
          onPost={(sid, upd) => { onAddUpdate(sid, upd); setAddUpdateOpen(false); }}
          onClose={() => setAddUpdateOpen(false)}
        />
      )}

      {/* Edit Update panel */}
      {editingUpdate && (
        <AddUpdatePanel
          key={editingUpdate.id}
          storyId={story.id}
          editingUpdate={editingUpdate}
          onPost={(sid, upd) => { onEditUpdate(sid, upd); setEditingUpdate(null); }}
          onClose={() => setEditingUpdate(null)}
        />
      )}

      {/* Delete Update confirmation */}
      {deleteUpdateModal !== null && (
        <div className="ls-modal-overlay" onClick={() => setDeleteUpdateModal(null)}>
          <div className="ls-modal" onClick={e => e.stopPropagation()}>
            <div className="ls-modal-icon"><IconTrash size={22} /></div>
            <h4>Delete Update?</h4>
            <p>This update will be permanently removed from the live story.</p>
            <div className="ls-modal-actions">
              <button className="ls-modal-cancel" onClick={() => setDeleteUpdateModal(null)}>Cancel</button>
              <button className="ls-modal-confirm" onClick={handleDeleteUpdateConfirm}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const LiveStoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useNewsEvent();

  // Re-fetch whenever another page changes a news item
  useNewsSubscription(() => { loadData(); });

  const [stories,          setStories]          = useState<LiveStory[]>([]);
  const [loading,          setLoading]           = useState(true);
  const [openMenuId,       setOpenMenuId]        = useState<string | null>(null);
  const [addUpdateId,      setAddUpdateId]       = useState<string | null>(null);
  const [search,           setSearch]            = useState("");
  const [deleteModal,      setDeleteModal]       = useState<string | null>(null);
  const [endingId,         setEndingId]          = useState<string | null>(null);
  const [detailStory,      setDetailStory]       = useState<LiveStory | null>(null);

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

  // Keep detailStory in sync with stories state
  useEffect(() => {
    if (detailStory) {
      const updated = stories.find(s => s.id === detailStory.id);
      if (updated) setDetailStory(updated);
    }
  }, [stories]);

  const liveArticles  = stories.filter(s => s.status === "live");
  const endedArticles = stories.filter(s => s.status === "ended");
  const draftArticles = stories.filter(s => s.status === "draft");

  const filterStories = (list: LiveStory[]) =>
    search ? list.filter(s => s.title.toLowerCase().includes(search.toLowerCase())) : list;

  const filteredLive  = filterStories(liveArticles);
  const filteredEnded = filterStories(endedArticles);
  const filteredDraft = filterStories(draftArticles);
  const totalUpdates  = stories.reduce((s, a) => s + (a.liveUpdates?.length ?? 0), 0);

  // ── Add update (from main page or from detail panel) ──
  // Uses the dedicated POST /:id/live-update endpoint which accepts the full
  // rich payload (title, imageUrl, poll, tweetUrl, sourceUrl, tags, etc.) and
  // persists it to the DB's liveUpdates JSON array.
  const handleAddUpdate = async (storyId: string, partialUpdate: Partial<LiveUpdate>) => {
    const now = new Date();
    // Optimistic local update so the UI feels instant
    const optimistic: LiveUpdate = {
      id:        nextUpdateId++,
      time:      now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      text:      partialUpdate.text || "",
      timestamp: now.toISOString(),
      ...partialUpdate,
    };
    setStories(prev =>
      prev.map(s =>
        s.id === storyId ? { ...s, liveUpdates: [optimistic, ...s.liveUpdates] } : s
      )
    );
    setAddUpdateId(null);
    try {
      // Build the rich payload — strip undefined / empty fields
      const payload: Record<string, unknown> = {};
      if (partialUpdate.text?.trim())        payload.text         = partialUpdate.text;
      if (partialUpdate.title?.trim())       payload.title        = partialUpdate.title;
      if (partialUpdate.imageUrl?.trim() && !partialUpdate.imageUrl.startsWith("blob:"))
                                             payload.imageUrl     = partialUpdate.imageUrl;
      if (partialUpdate.imageCaption?.trim()) payload.imageCaption = partialUpdate.imageCaption;
      if (partialUpdate.imageCredit?.trim())  payload.imageCredit  = partialUpdate.imageCredit;
      if (partialUpdate.tweetUrl?.trim())    payload.tweetUrl     = partialUpdate.tweetUrl;
      if (partialUpdate.sourceUrl?.trim())   payload.sourceUrl    = partialUpdate.sourceUrl;
      if (partialUpdate.sourceLabel?.trim()) payload.sourceLabel  = partialUpdate.sourceLabel;
      if (partialUpdate.tags?.length)        payload.tags         = partialUpdate.tags;
      if (partialUpdate.poll)                payload.poll         = partialUpdate.poll;
      if (partialUpdate.isHighlight !== undefined) payload.isHighlight = partialUpdate.isHighlight;
      if (partialUpdate.isBreaking  !== undefined) payload.isBreaking  = partialUpdate.isBreaking;

      await apiAppendLiveUpdate(storyId, payload as any);
      dispatch({ type: "CONTENT_UPDATED", id: storyId, changes: { liveUpdates: true } });
      // Reload from server so our local IDs/timestamps match the DB record
      await loadData();
    } catch (err) {
      console.error("Failed to add update:", err);
      // Rollback the optimistic update on failure
      setStories(prev =>
        prev.map(s =>
          s.id === storyId
            ? { ...s, liveUpdates: s.liveUpdates.filter(u => u.id !== optimistic.id) }
            : s
        )
      );
    }
  };

  // ── Edit a specific update ──
  // Fix: read stories BEFORE setStories to avoid stale closure sending old data to DB
  const handleEditUpdate = async (storyId: string, updatedPartial: Partial<LiveUpdate>) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) return;

    // Build the new list once — used for both optimistic UI and the DB call
    const updatedList = story.liveUpdates.map(u =>
      u.id === updatedPartial.id ? { ...u, ...updatedPartial } : u
    );

    setStories(prev =>
      prev.map(s => s.id === storyId ? { ...s, liveUpdates: updatedList } : s)
    );

    try {
      await apiUpdateNews(storyId, { liveUpdates: updatedList } as any);
      dispatch({ type: "CONTENT_UPDATED", id: storyId, changes: { liveUpdates: true } });
      await loadData();
    } catch (err) {
      console.error("Failed to edit update:", err);
      // Rollback to original on failure
      setStories(prev =>
        prev.map(s => s.id === storyId ? { ...s, liveUpdates: story.liveUpdates } : s)
      );
    }
  };

  // ── Delete a specific update ──
  // Fix: read stories BEFORE setStories to avoid stale closure sending old data to DB
  const handleDeleteUpdate = async (storyId: string, updateId: number) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) return;

    // Build the filtered list once — used for both optimistic UI and the DB call
    const updatedList = story.liveUpdates.filter(u => u.id !== updateId);

    setStories(prev =>
      prev.map(s => s.id === storyId ? { ...s, liveUpdates: updatedList } : s)
    );

    try {
      await apiUpdateNews(storyId, { liveUpdates: updatedList } as any);
      dispatch({ type: "CONTENT_UPDATED", id: storyId, changes: { liveUpdates: true } });
      await loadData();
    } catch (err) {
      console.error("Failed to delete update:", err);
      // Rollback to original on failure
      setStories(prev =>
        prev.map(s => s.id === storyId ? { ...s, liveUpdates: story.liveUpdates } : s)
      );
    }
  };

  const handleEndLive = async (storyId: string) => {
    const now = new Date();
    setStories(prev =>
      prev.map(s =>
        s.id === storyId
          ? { ...s, status: "ended", endedAt: now.toISOString(), published: formatDate(now.toISOString()) }
          : s
      )
    );
    setEndingId(storyId);
    try {
      await apiUpdateNews(storyId, { status: "PUBLISHED", statusType: "ended" } as any);
      dispatch({ type: "STATUS_CHANGED", id: storyId, changes: { statusType: "ended" } });
    } catch (err) {
      console.error("Failed to end live:", err);
      setStories(prev =>
        prev.map(s =>
          s.id === storyId ? { ...s, status: "live", endedAt: null, published: "Live" } : s
        )
      );
    } finally {
      setEndingId(null);
    }
  };

  const handleGoLive = async (storyId: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId
          ? { ...s, status: "live", liveStartedAt: new Date().toISOString(), published: "Live" }
          : s
      )
    );
    try {
      await apiUpdateNews(storyId, { status: "PUBLISHED", statusType: "published", articleType: "LIVE" } as any);
      dispatch({ type: "STATUS_CHANGED", id: storyId, changes: { status: "PUBLISHED", statusType: "published" } });
    } catch (err) {
      console.error("Failed to go live:", err);
    }
  };

  const handleDeleteStory = async () => {
    if (!deleteModal) return;
    try {
      await apiDeleteNews(deleteModal);
      setStories(prev => prev.filter(s => s.id !== deleteModal));
      if (detailStory?.id === deleteModal) setDetailStory(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeleteModal(null);
  };

  const toggleMenu = (id: string) => setOpenMenuId(openMenuId === id ? null : id);

  // Open detail panel on row click
  const handleRowClick = (story: LiveStory) => {
    if (story.status === "draft") return; // drafts don't have timeline
    setDetailStory(story);
  };

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
          <input
            className="ls-search"
            type="text"
            placeholder="Search live stories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
            {!loading && filteredLive.length === 0 && (
              <div className="ls-empty">No live stories currently active</div>
            )}
            {filteredLive.map(story => (
              <div
                className="ls-story-card"
                key={story.id}
                onClick={() => handleRowClick(story)}
              >
                <div className="ls-story-main">
                  <div className="ls-story-tags">
                    <span className="ls-tag ls-tag--live">LIVE</span>
                    <span className="ls-story-category">{story.articleCategory}</span>
                  </div>
                  <h3 className="ls-story-title">{story.title}</h3>
                  <div className="ls-story-meta">
                    <span className="ls-meta-item">
                      <IconClock /> Started:{" "}
                      {story.liveStartedAt
                        ? new Date(story.liveStartedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </span>
                    <span className="ls-meta-item"><IconMsg /> {story.liveUpdates?.length ?? 0} updates</span>
                    <span className="ls-meta-item"><IconEye /> {story.views} views</span>
                    <span className="ls-meta-item">
                      Last update: {story.liveUpdates?.length ? timeSince(story.liveUpdates[0].timestamp) : "—"}
                    </span>
                  </div>
                </div>
                <div className="ls-story-actions" onClick={e => e.stopPropagation()}>
                  <button className="ls-btn-add-update" onClick={() => setAddUpdateId(story.id)}>
                    <IconAdd /> Add Update
                  </button>
                  <button
                    className="ls-btn-end-live"
                    onClick={() => handleEndLive(story.id)}
                    disabled={endingId === story.id}
                  >
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
              <div className="ls-empty">
                No ended live stories yet — ended stories will appear here permanently until deleted
              </div>
            )}
            {filteredEnded.map(story => (
              <div
                className="ls-story-card ls-story-card--ended"
                key={story.id}
                onClick={() => handleRowClick(story)}
              >
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

        {/* ADD UPDATE PANEL (from main page buttons) */}
        {addUpdateId && (
          <AddUpdatePanel
            storyId={addUpdateId}
            onPost={handleAddUpdate}
            onClose={() => setAddUpdateId(null)}
          />
        )}

        {/* DELETE STORY MODAL */}
        {deleteModal !== null && (
          <div className="ls-modal-overlay" onClick={() => setDeleteModal(null)}>
            <div className="ls-modal" onClick={e => e.stopPropagation()}>
              <div className="ls-modal-icon"><IconTrash size={22} /></div>
              <h4>Delete Story?</h4>
              <p>This action cannot be undone. The story and all its updates will be permanently removed.</p>
              <div className="ls-modal-actions">
                <button className="ls-modal-cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
                <button className="ls-modal-confirm" onClick={handleDeleteStory}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STORY DETAIL PANEL */}
      {detailStory && (
        <StoryDetailPanel
          story={detailStory}
          onClose={() => setDetailStory(null)}
          onAddUpdate={handleAddUpdate}
          onEditUpdate={handleEditUpdate}
          onDeleteUpdate={handleDeleteUpdate}
        />
      )}
    </>
  );
};

export default LiveStoriesPage;