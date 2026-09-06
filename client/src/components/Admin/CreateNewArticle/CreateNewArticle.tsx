import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CreateNewArticle.css";
import { createNews, updateNews, updateNewsWithMedia, fetchNewsById } from "../../../api/news";
import { getCategories } from "../../../api/category.api";
import { createNewsWithMedia } from "../../../api/news";
import {
  getAllTags,
  createTag,
  getTrendingTags,
  type Tag as TagType,
} from "../../../api/tags.api";
import { getMe } from "../../../api/auth";
import { getTopicProfiles } from "../../../api/user/topicProfile";

import {
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  Quote, AlignLeft, AlignCenter, AlignRight, Link,
  Upload, Globe, Clock, Rocket, Zap, Radio,
  FileText, Tag, MapPin, User, Trash2, Search, X, CalendarClock,
  Plus, TrendingUp,
} from "lucide-react";
import Preloader from "../Preloader/Preloder";

interface Category {
  id: string | number;
  name: string;
  parentId?: string | number | null;
  enabled?: boolean;
}

type ArticleType = "Standard Article" | "Breaking News" | "Live Updates";

const ARTICLE_TYPES: { label: ArticleType; icon: React.ReactNode }[] = [
  { label: "Standard Article", icon: <FileText size={15} /> },
  { label: "Breaking News",    icon: <Zap size={15} />      },
  { label: "Live Updates",     icon: <Radio size={15} />    },
];

function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Devanagari (Hindi) → Latin transliteration ────────────────────────────
// The old slug generator simply stripped out any character that wasn't
// a-z/0-9, which meant a Hindi headline had *nothing* left to build a slug
// from and fell back to a random string like "article-r8mpa-8574" — a slug
// with no relationship to the article at all.
//
// This is a lightweight phonetic transliteration (not a linguistically
// perfect one), but it's enough to turn "भारत और उज्बेकिस्तान" into something
// like "bharat-aur-ujbekistan", which is readable and actually describes
// the article.
const DEVANAGARI_VOWELS: Record<string, string> = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo",
  "ऋ": "ri", "ॠ": "ri", "ऌ": "lu", "ॡ": "lu",
  "ऍ": "e", "ऎ": "e", "ए": "e", "ऐ": "ai",
  "ऑ": "o", "ऒ": "o", "ओ": "o", "औ": "au",
  "ॲ": "a",
};

const DEVANAGARI_MATRAS: Record<string, string> = {
  "\u093E": "a", "\u093F": "i", "\u0940": "ee", "\u0941": "u", "\u0942": "oo",
  "\u0943": "ri", "\u0944": "ri", "\u0945": "e", "\u0946": "e", "\u0947": "e",
  "\u0948": "ai", "\u0949": "o", "\u094A": "o", "\u094B": "o", "\u094C": "au",
  "\u0962": "l", "\u0963": "l",
};

const DEVANAGARI_CONSONANTS: Record<string, string> = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "v",
  "श": "sh", "ष": "sh", "स": "s", "ह": "h", "ळ": "l",
  // nukta forms (Urdu/Persian sounds written with Devanagari)
  "क़": "q", "ख़": "kh", "ग़": "gh", "ज़": "z", "ड़": "r", "ढ़": "rh", "फ़": "f", "य़": "y",
};

const DEVANAGARI_DIGITS: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

function devanagariToRoman(input: string): string {
  const chars = Array.from(input);
  let out = "";

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];

    if (DEVANAGARI_VOWELS[c]) { out += DEVANAGARI_VOWELS[c]; continue; }
    if (DEVANAGARI_DIGITS[c]) { out += DEVANAGARI_DIGITS[c]; continue; }

    if (c === "\u0902" || c === "\u0901") { out += "n"; continue; } // anusvara / chandrabindu
    if (c === "\u0903") { out += "h"; continue; }                    // visarga
    if (c === "\u093D") { continue; }                                // avagraha
    if (c === "\u0950") { out += "om"; continue; }                   // ॐ
    if (c === "\u094D") { continue; }                                // stray virama

    if (DEVANAGARI_CONSONANTS[c]) {
      out += DEVANAGARI_CONSONANTS[c];
      if (next === "\u094D") { i++; }                                 // halant: no inherent vowel
      else if (next === "\u093C") { i++; out += "a"; }                // nukta mark, keep inherent vowel
      else if (next && DEVANAGARI_MATRAS[next]) { out += DEVANAGARI_MATRAS[next]; i++; }
      else { out += "a"; }                                            // inherent "a"
      continue;
    }

    if (c === "।" || c === "॥") continue; // danda / double danda
    if (/[a-zA-Z0-9\s-]/.test(c)) { out += c; continue; }
    // anything else (other scripts, punctuation, emoji) is dropped silently
  }

  return out;
}

function generateSlug(text: string): string {
  const source = text.trim();
  if (!source) return "";

  // Transliterate Devanagari (Hindi) so the slug stays meaningful instead of
  // collapsing to nothing once non-Latin characters are stripped.
  const romanised = /[\u0900-\u097F]/.test(source) ? devanagariToRoman(source) : source;

  const slug = romanised
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug) return slug.slice(0, 80);

  // Only reached for genuinely empty/emoji-only input — extremely rare since
  // the headline is a required field.
  return "article-" + Math.random().toString(36).slice(2, 7) + "-" + Date.now().toString().slice(-4);
}

// ─── Draft autosave (survives refresh) ─────────────────────────────────────
const DRAFT_STORAGE_PREFIX = "cna_draft_v1_";
const DRAFT_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // stop offering to restore after 3 days

interface DraftSnapshot {
  savedAt: number;
  selectedType: ArticleType;
  headline: string;
  shortTitle: string;
  summary: string;
  content: string;
  tags: string[];
  categoryId: string;
  language: string;
  articleLocation: string;
  breakingToggles: { newsTicker: boolean; pushNotification: boolean; homepageAlert: boolean };
  liveUpdates: { id: number; time: string; text: string }[];
  imageCaption: string;
  photoCredit: string;
  mediaPreview: string | null;
  metaTitle: string;
  metaDesc: string;
  urlSlug: string;
  slugManuallyEdited: boolean;
  focusKeywords: string;
}

function loadDraft(key: string): DraftSnapshot | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (Date.now() - (parsed.savedAt ?? 0) > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(key);
      return null;
    }
    // Nothing meaningful to restore
    if (!parsed.headline?.trim() && !parsed.shortTitle?.trim() && !parsed.content?.trim()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(key: string, data: Omit<DraftSnapshot, "savedAt">) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // localStorage unavailable/full — autosave is best-effort, fail silently
  }
}

function clearDraft(key: string) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

const TYPE_PARAM_MAP: Record<string, ArticleType> = {
  breaking: "Breaking News",
  live:     "Live Updates",
  standard: "Standard Article",
};

const API_TYPE_TO_UI: Record<string, ArticleType> = {
  STANDARD: "Standard Article",
  BREAKING: "Breaking News",
  LIVE:     "Live Updates",
};

interface TopicProfile {
  id: string; name: string; slug: string; caption: string;
  description: string; imageUrl?: string;
}

async function fetchTopicProfiles(): Promise<TopicProfile[]> {
  try {
    // Reuse the app's apiClient so this hits the correct API base URL and
    // carries the same auth headers as every other admin request — the old
    // code used a hardcoded "http://localhost:5001" fetch with no auth
    // header, which 401'd against the protected endpoint and silently
    // returned an empty list.
    const data = await getTopicProfiles();
    const list: any[] = Array.isArray(data) ? data : [];

    return list.map((p) => ({
      id: p.id ?? p._id,
      name: p.name,
      slug: p.slug,
      caption: p.caption,
      description: p.description,
      imageUrl: p.imageUrl,
    }));
  } catch {
    return [];
  }
}

function saveSelection(): Range | null {
  const sel = window.getSelection();
  return sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
}
function restoreSelection(range: Range | null) {
  if (!range) return;
  const sel = window.getSelection();
  sel?.removeAllRanges(); sel?.addRange(range);
}

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
    fetchTopicProfiles().then(data => { setProfiles(data); setFiltered(data); });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    setFiltered(q
      ? profiles.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.caption.toLowerCase().includes(q)
        )
      : profiles
    );
  }, [query, profiles]);

  const applyLink = (href: string, label: string) => {
    const el = editorRef.current; if (!el) return;
    el.focus(); restoreSelection(savedRange);
    const sel = window.getSelection(); if (!sel || !sel.rangeCount) return;
    if (sel.toString().trim()) {
      document.execCommand("createLink", false, href);
      const node = sel.getRangeAt(0).commonAncestorContainer;
      const anchor = (node as Element).closest?.("a") ?? (node.parentElement as Element)?.closest("a");
      if (anchor) {
        (anchor as HTMLAnchorElement).target    = "_blank";
        (anchor as HTMLAnchorElement).className = "cna-topic-link";
      }
    } else {
      document.execCommand("insertHTML", false,
        `<a href="${href}" class="cna-topic-link" target="_blank" rel="noopener noreferrer">${label}</a>`
      );
    }
    onClose();
  };

  return (
    <div className="cna-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cna-modal cna-modal--topic" role="dialog" aria-modal="true">
        <div className="cna-modal-header">
          <div className="cna-modal-title-wrap">
            <div className="cna-modal-icon cna-modal-icon--topic"><Link size={20} /></div>
            <div>
              <h2 className="cna-modal-title">Insert Topic Link</h2>
              <p className="cna-modal-subtitle">Link selected text to a topic profile page</p>
            </div>
          </div>
          <button className="cna-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="cna-topic-tabs">
          <button className={`cna-topic-tab${tab === "search" ? " cna-topic-tab--active" : ""}`} onClick={() => setTab("search")}>
            <Search size={13} /> Search Profiles
          </button>
          <button className={`cna-topic-tab${tab === "manual" ? " cna-topic-tab--active" : ""}`} onClick={() => setTab("manual")}>
            <Link size={13} /> Manual Slug
          </button>
        </div>
        <div className="cna-modal-body cna-modal-body--topic">
          {tab === "search" && (
            <>
              <div className="cna-topic-search-wrap">
                <Search size={14} className="cna-topic-search-icon" />
                <input ref={inputRef} className="cna-input cna-topic-search-input"
                  placeholder="Search by name, slug, or caption…" value={query}
                  onChange={e => setQuery(e.target.value)} />
                {query && <button className="cna-topic-clear" onClick={() => setQuery("")}><X size={13} /></button>}
              </div>
              {profiles.length === 0 ? (
                <div className="cna-topic-empty"><User size={32} /><p>No topic profiles found.</p></div>
              ) : filtered.length === 0 ? (
                <div className="cna-topic-empty"><Search size={28} /><p>No profiles match "{query}"</p></div>
              ) : (
                <ul className="cna-topic-list">
                  {filtered.map(p => (
                    <li key={p.id} className="cna-topic-item" onClick={() => applyLink(`/topic/${p.slug}`, p.name)}>
                      <div className="cna-topic-avatar">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} />
                          : <span>{p.name.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div className="cna-topic-info">
                        <span className="cna-topic-name">{p.name}</span>
                        {p.caption && <span className="cna-topic-caption">{p.caption}</span>}
                        <span className="cna-topic-slug">/topic/{p.slug}</span>
                      </div>
                      <div className="cna-topic-arrow">→</div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {tab === "manual" && (
            <div className="cna-topic-manual">
              <p className="cna-topic-manual-hint">
                Enter a topic slug directly. Formatted as <code>/topic/your-slug</code>.
              </p>
              <div className="cna-slug-input-wrap">
                <span className="cna-slug-prefix">/topic/</span>
                <input className="cna-input cna-slug-input" placeholder="your-topic-slug"
                  value={manualSlug}
                  onChange={e => setManualSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  onKeyDown={e => e.key === "Enter" && applyLink(`/topic/${manualSlug}`, manualSlug)}
                  autoFocus />
              </div>
              <button className="cna-btn cna-btn-primary"
                style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
                onClick={() => applyLink(`/topic/${manualSlug}`, manualSlug)}
                disabled={!manualSlug.trim()}>
                <Link size={14} /> Apply Link
              </button>
            </div>
          )}
        </div>
        <div className="cna-modal-footer">
          <button className="cna-btn cna-btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

function applyRichFormat(action: string, editorRef: React.RefObject<HTMLDivElement | null>) {
  const el = editorRef.current; if (!el) return;
  el.focus();
  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);
  switch (action) {
    case "bold":        exec("bold");                    break;
    case "italic":      exec("italic");                  break;
    case "underline":   exec("underline");               break;
    case "h1":          exec("formatBlock", "h1");       break;
    case "h2":          exec("formatBlock", "h2");       break;
    case "bullet":      exec("insertUnorderedList");     break;
    case "ordered":     exec("insertOrderedList");       break;
    case "quote":       exec("formatBlock", "blockquote"); break;
    case "alignLeft":   exec("justifyLeft");             break;
    case "alignCenter": exec("justifyCenter");           break;
    case "alignRight":  exec("justifyRight");            break;
  }
}

const TOOLBAR_ITEMS = [
  { action: "h1",          icon: <Heading1 size={16} />,    title: "Heading 1"     },
  { action: "h2",          icon: <Heading2 size={16} />,    title: "Heading 2"     },
  { action: "bold",        icon: <Bold size={16} />,        title: "Bold"          },
  { action: "italic",      icon: <Italic size={16} />,      title: "Italic"        },
  { action: "underline",   icon: <Underline size={16} />,   title: "Underline"     },
  { action: "bullet",      icon: <List size={16} />,        title: "Bullet List"   },
  { action: "ordered",     icon: <ListOrdered size={16} />, title: "Numbered List" },
  { action: "quote",       icon: <Quote size={16} />,       title: "Blockquote"    },
  { action: "alignLeft",   icon: <AlignLeft size={16} />,   title: "Align Left"    },
  { action: "alignCenter", icon: <AlignCenter size={16} />, title: "Align Center"  },
  { action: "alignRight",  icon: <AlignRight size={16} />,  title: "Align Right"   },
  { action: "link",        icon: <Link size={16} />,        title: "Topic Link"    },
];

interface RichEditorProps {
  editorRef:    React.RefObject<HTMLDivElement | null>;
  onInput:      (html: string) => void;
  wordCount:    number;
  readTime:     number;
  initialHtml?: string;
}
const RichEditor: React.FC<RichEditorProps> = ({ editorRef, onInput, wordCount, readTime, initialHtml }) => {
  // Listen for variations in asynchronous content loading
  useEffect(() => {
    if (editorRef.current && initialHtml !== undefined && editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [initialHtml, editorRef]);

  const handleInput   = useCallback(() => onInput(editorRef.current?.innerHTML ?? ""), [editorRef, onInput]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    const sel   = window.getSelection(); if (!sel || !sel.rangeCount) return;
    const block = sel.getRangeAt(0).startContainer.parentElement?.closest("h1,h2,h3,blockquote");
    if (block) {
      e.preventDefault();
      document.execCommand("insertParagraph", false);
      document.execCommand("formatBlock", false, "div");
    }
  }, []);

  return (
    <>
      <div ref={editorRef} className="cna-editor cna-editor--rich" contentEditable
        suppressContentEditableWarning onInput={handleInput} onKeyDown={handleKeyDown}
        data-placeholder="Start writing your article content here…"
        aria-label="Article body" aria-multiline="true" role="textbox" spellCheck />
      <div className="cna-editor-footer">
        <span>Words: {wordCount}</span>
        <span>Est. read time: {readTime} min</span>
      </div>
    </>
  );
};

interface CustomSelectProps {
  value:       string;
  onChange:    (v: string) => void;
  options:     { label: string; value: string }[];
  placeholder?: string;
}
const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = "Select..." }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const label = options.find(o => o.value === value)?.label ?? "";
  return (
    <div className="cna-custom-select" ref={ref}>
      <button type="button"
        className={`cna-select-trigger${open ? " cna-select-trigger--open" : ""}`}
        onClick={() => setOpen(p => !p)}>
        <span className="cna-select-trigger-left">
          <span className={label ? "cna-select-value" : "cna-select-placeholder"}>
            {label || placeholder}
          </span>
        </span>
        <svg className={`cna-select-chevron${open ? " cna-select-chevron--open" : ""}`}
          width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="cna-select-dropdown" role="listbox">
          {options.map(opt => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}
              className={`cna-select-option${opt.value === value ? " cna-select-option--selected" : ""}`}
              onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false); }}>
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const LocationSearch: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [query,   setQuery]   = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref   = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { setQuery(value); }, [value]);

  const doFetch = async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const names = data.map((i: { display_name: string }) => i.display_name);
      setResults(names); setOpen(names.length > 0);
    } catch { setResults([]); } finally { setLoading(false); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setQuery(v); onChange(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => doFetch(v), 350);
  };

  return (
    <div className="cna-location-search" ref={ref}>
      <div className="cna-location-input-wrap">
        <Search size={14} className="cna-location-icon" />
        <input className="cna-input cna-location-input"
          placeholder="Search city, state or place…" value={query}
          onChange={handleInput} onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off" />
        {loading && <span className="cna-location-spinner" />}
      </div>
      {open && results.length > 0 && (
        <ul className="cna-location-dropdown">
          {results.map((name, i) => (
            <li key={i} className="cna-location-option"
              onMouseDown={() => { setQuery(name); onChange(name); setOpen(false); }}>
              <MapPin size={12} className="cna-location-pin" /><span>{name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface ScheduleModalProps { onClose: () => void; onConfirm: (datetime: string) => void; }
const MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_OF_WEEK = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }

const ScheduleModal: React.FC<ScheduleModalProps> = ({ onClose, onConfirm }) => {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [selDay,    setSelDay]    = useState<number | null>(null);
  const [hour,   setHour]   = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm,   setAmpm]   = useState<"AM" | "PM">("PM");
  const [error,  setError]  = useState("");

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth);
  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() + i);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelDay(null);
  };
  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day); d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };

  const h = parseInt(hour) || 12; const m = parseInt(minute) || 0;
  const h24 = ampm === "AM" ? (h % 12) : (h % 12) + 12;
  const hourAngle   = (h24 % 12) * 30 + (m / 60) * 30;
  const minuteAngle = m * 6;
  const handCoords = (angle: number, length: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: 50 + length * Math.cos(rad), y: 50 + length * Math.sin(rad) };
  };
  const hourEnd   = handCoords(hourAngle, 26);
  const minuteEnd = handCoords(minuteAngle, 34);
  const secondEnd = handCoords(55, 38);

  const handleConfirm = () => {
    if (!selDay) { setError("Please select a date."); return; }
    const hNum = parseInt(hour); const mNum = parseInt(minute);
    if (isNaN(hNum) || hNum < 1 || hNum > 12) { setError("Enter a valid hour (1–12)."); return; }
    if (isNaN(mNum) || mNum < 0 || mNum > 59) { setError("Enter a valid minute (0–59)."); return; }
    const h24local  = ampm === "AM" ? (hNum % 12) : (hNum % 12) + 12;
    const selected  = new Date(viewYear, viewMonth, selDay, h24local, mNum, 0);
    if (selected <= new Date()) { setError("Scheduled time must be in the future."); return; }
    onConfirm(selected.toISOString());
  };

  const previewLabel = selDay
    ? new Date(viewYear, viewMonth, selDay).toLocaleDateString("en-IN", { dateStyle: "medium" }) +
      ` at ${hour}:${String(minute).padStart(2, "0")} ${ampm}`
    : "";

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="cna-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cna-modal cna-modal--schedule" role="dialog" aria-modal="true">
        <div className="cna-modal-header">
          <div className="cna-modal-title-wrap">
            <div className="cna-modal-icon"><CalendarClock size={20} /></div>
            <div>
              <h2 className="cna-modal-title">Schedule Article</h2>
              <p className="cna-modal-subtitle">Choose when this article will go live</p>
            </div>
          </div>
          <button className="cna-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="cna-modal-body cna-modal-body--schedule">
          <div className="cna-schedule-cols">
            <div className="cna-cal">
              <div className="cna-cal-nav">
                <button className="cna-cal-nav-btn" onClick={prevMonth}>&#8249;</button>
                <div className="cna-cal-nav-selects">
                  <select className="cna-cal-select" value={viewMonth}
                    onChange={e => { setViewMonth(+e.target.value); setSelDay(null); }}>
                    {MONTHS.map((mn, i) => <option key={mn} value={i}>{mn}</option>)}
                  </select>
                  <select className="cna-cal-select" value={viewYear}
                    onChange={e => { setViewYear(+e.target.value); setSelDay(null); }}>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <button className="cna-cal-nav-btn" onClick={nextMonth}>&#8250;</button>
              </div>
              <div className="cna-cal-grid cna-cal-grid--header">
                {DAYS_OF_WEEK.map(d => (
                  <span key={d} className={`cna-cal-dow${d === "SUN" || d === "SAT" ? " cna-cal-dow--weekend" : ""}`}>
                    {d}
                  </span>
                ))}
              </div>
              <div className="cna-cal-grid">
                {cells.map((day, idx) => {
                  if (!day) return <span key={idx} className="cna-cal-cell cna-cal-cell--empty" />;
                  const past    = isPast(day);
                  const isToday = day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
                  const isSel   = day === selDay;
                  const col     = (firstDay + day - 1) % 7;
                  return (
                    <button key={idx} disabled={past}
                      className={["cna-cal-cell",
                        past    ? "cna-cal-cell--past"    : "",
                        isToday ? "cna-cal-cell--today"   : "",
                        isSel   ? "cna-cal-cell--sel"     : "",
                        (col === 0 || col === 6) && !isSel ? "cna-cal-cell--weekend" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => { setSelDay(day); setError(""); }}>
                      {String(day).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
              <button className="cna-cal-confirm-btn" onClick={handleConfirm}>
                <CalendarClock size={15} /> Schedule Article
              </button>
            </div>
            <div className="cna-clock-col">
              <div className="cna-clock-wrap">
                <svg className="cna-clock-svg" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="47" fill="white" stroke="#1a1a18" strokeWidth="2.2" />
                  {Array.from({ length: 60 }, (_, i) => {
                    const ang = (i * 6 - 90) * (Math.PI / 180);
                    const isHr = i % 5 === 0; const inner = isHr ? 38 : 42;
                    return <line key={i}
                      x1={50 + inner * Math.cos(ang)} y1={50 + inner * Math.sin(ang)}
                      x2={50 + 44.5 * Math.cos(ang)} y2={50 + 44.5 * Math.sin(ang)}
                      stroke="#1a1a18" strokeWidth={isHr ? 1.5 : 0.55} strokeLinecap="round" />;
                  })}
                  {[12,1,2,3,4,5,6,7,8,9,10,11].map((n, i) => {
                    const ang = (i * 30 - 90) * (Math.PI / 180);
                    return <text key={n} x={50 + 32 * Math.cos(ang)} y={50 + 32 * Math.sin(ang)}
                      textAnchor="middle" dominantBaseline="central" fontSize="6.8"
                      fontFamily="Georgia, serif" fill="#1a1a18" fontWeight="600">{n}</text>;
                  })}
                  <text x="50" y="67" textAnchor="middle" fontSize="5.2"
                    fontFamily="Georgia, serif" fill="#e53e3e" fontWeight="700">LocalNews</text>
                  <line x1="50" y1="50" x2={hourEnd.x}   y2={hourEnd.y}   stroke="#1a1a18" strokeWidth="3"   strokeLinecap="round" />
                  <line x1="50" y1="50" x2={minuteEnd.x} y2={minuteEnd.y} stroke="#1a1a18" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="50" y1="50" x2={secondEnd.x} y2={secondEnd.y} stroke="#e53e3e" strokeWidth="0.9" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="2.8" fill="#e53e3e" />
                  <circle cx="50" cy="50" r="1.2" fill="white" />
                </svg>
              </div>
              <div className="cna-time-inputs">
                <div className="cna-time-field">
                  <label className="cna-field-label">Hour</label>
                  <input className="cna-input cna-time-input" type="number" min={1} max={12}
                    value={hour} onChange={e => { setHour(e.target.value); setError(""); }} />
                </div>
                <span className="cna-time-sep">:</span>
                <div className="cna-time-field">
                  <label className="cna-field-label">Minute</label>
                  <input className="cna-input cna-time-input" type="number" min={0} max={59}
                    value={minute} onChange={e => { setMinute(e.target.value); setError(""); }} />
                </div>
                <div className="cna-time-field">
                  <label className="cna-field-label">&nbsp;</label>
                  <div className="cna-ampm-toggle">
                    {(["AM","PM"] as const).map(p => (
                      <button key={p}
                        className={`cna-ampm-btn${ampm === p ? " cna-ampm-btn--active" : ""}`}
                        onClick={() => setAmpm(p)}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
              {error       && <p className="cna-modal-error">{error}</p>}
              {previewLabel && (
                <div className="cna-modal-preview">
                  <span className="cna-modal-preview-icon"><Clock size={14} /></span>
                  <span>Will publish on <strong>{previewLabel}</strong></span>
                </div>
              )}
            </div>
          </div>
          <div className="cna-modal-info">
            <p>The article will not appear on the live site until the scheduled time.</p>
          </div>
        </div>
        <div className="cna-modal-footer">
          <button className="cna-btn cna-btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

interface RestoreDraftModalProps {
  draft:     DraftSnapshot;
  onRestore: () => void;
  onDiscard: () => void;
}
const RestoreDraftModal: React.FC<RestoreDraftModalProps> = ({ draft, onRestore, onDiscard }) => {
  const minutesAgo = Math.max(0, Math.round((Date.now() - draft.savedAt) / 60000));
  const timeLabel =
    minutesAgo < 1 ? "just now"
    : minutesAgo === 1 ? "1 minute ago"
    : minutesAgo < 60 ? `${minutesAgo} minutes ago`
    : `${Math.round(minutesAgo / 60)} hour(s) ago`;
  const preview = draft.headline?.trim() || draft.shortTitle?.trim() || "Untitled draft";

  return (
    <div className="cna-modal-overlay">
      <div className="cna-modal" role="dialog" aria-modal="true" style={{ maxWidth: 460 }}>
        <div className="cna-modal-header">
          <div className="cna-modal-title-wrap">
            <div className="cna-modal-icon"><FileText size={20} /></div>
            <div>
              <h2 className="cna-modal-title">Restore unsaved changes?</h2>
              <p className="cna-modal-subtitle">We found work you hadn't saved from {timeLabel}.</p>
            </div>
          </div>
        </div>
        <div className="cna-modal-body">
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#334155" }}>
            <strong style={{ display: "block", marginBottom: 4 }}>{preview}</strong>
            {draft.summary?.trim() && (
              <span style={{ color: "#64748b" }}>
                {draft.summary.trim().slice(0, 140)}{draft.summary.length > 140 ? "…" : ""}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 10 }}>
            Restoring brings back everything you typed before the page refreshed.
            Discarding removes this saved copy for good.
          </p>
        </div>
        <div className="cna-modal-footer">
          <button className="cna-btn cna-btn-outline" onClick={onDiscard}>Discard</button>
          <button className="cna-btn cna-btn-primary" onClick={onRestore}>Restore draft</button>
        </div>
      </div>
    </div>
  );
};

type SeoTab = "settings" | "google";

const CreateNewArticle: React.FC = () => {
  const routerLocation = useLocation();
  const navigate       = useNavigate();

  const params    = new URLSearchParams(routerLocation.search);
  const rawEditId = params.get("edit");

  const editId =
    rawEditId &&
    rawEditId !== "undefined" &&
    rawEditId !== "null"
      ? rawEditId.trim()
      : "";

  const isEdit = Boolean(editId);
  const typeParam = params.get("type") ?? "";

  const [dbCategories,     setDbCategories]     = useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  useEffect(() => {
    getCategories()
      .then((data: any[]) => {
        const normalized = Array.isArray(data)
          ? data.map((c: any) => ({
              id:       c.id ?? String(c._id),
              name:     c.name,
              parentId: c.parentId ?? null,
              enabled:  c.enabled !== undefined ? c.enabled : (c.active !== undefined ? c.active : true),
            }))
          : [];
        setDbCategories(normalized);
        setCategoriesLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
        setCategoriesLoaded(true);
      });
  }, []);

  const categoryOptions = dbCategories
    .filter(c => c.enabled !== false)
    .map(c => ({
      value: String(c.id),
      label: c.parentId
        ? `${dbCategories.find(p => p.id === c.parentId)?.name ?? "…"} / ${c.name}`
        : c.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const [loadingArticle, setLoadingArticle]   = useState(isEdit);
  const [selectedType,   setSelectedType]     = useState<ArticleType>(TYPE_PARAM_MAP[typeParam] ?? "Standard Article");
  const [headline,       setHeadline]         = useState("");
  const [shortTitle,     setShortTitle]       = useState("");
  const [summary,        setSummary]          = useState("");
  const [content,        setContent]          = useState("");
  const [initialHtml,    setInitialHtml]      = useState("");
  const [tags,           setTags]             = useState<string[]>([]);
  const [tagInput,       setTagInput]         = useState("");
  const [categoryId,     setCategoryId]       = useState("");
  const [language,       setLanguage]         = useState("hindi");
  const [articleLocation, setArticleLocation] = useState("");
  const [breakingToggles, setBreakingToggles] = useState({
    newsTicker: true, pushNotification: true, homepageAlert: true,
  });
  const [liveUpdates,    setLiveUpdates]      = useState<{ id: number; time: string; text: string }[]>([]);
  const [dragOver,       setDragOver]         = useState(false);
  const [mediaFile,      setMediaFile]        = useState<File | null>(null);
  const [mediaPreview,   setMediaPreview]     = useState<string | null>(null);
  const [imageCaption,   setImageCaption]     = useState("");
  const [photoCredit,    setPhotoCredit]      = useState("");
  const [seoTab,         setSeoTab]           = useState<SeoTab>("settings");
  const [metaTitle,      setMetaTitle]        = useState("");
  const [metaDesc,       setMetaDesc]         = useState("");
  const [urlSlug,        setUrlSlug]          = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [focusKeywords,  setFocusKeywords]    = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTopicModal,    setShowTopicModal]    = useState(false);
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [deleteMode,        setDeleteMode]        = useState<"instant" | "interval">("interval");
  const [savedRange,        setSavedRange]        = useState<Range | null>(null);
  const [submitError,       setSubmitError]       = useState<string | null>(null);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
  role: "ADMIN" | "EDITOR";
  permissions: string[];
} | null>(null);

const [userLoading, setUserLoading] = useState(true);

useEffect(() => {
  setUserLoading(true);

  getMe()
    .then((res: any) => {
      setCurrentUser({
        role: res.user?.role,
        permissions: Array.isArray(res.user?.permissions)
          ? res.user.permissions
          : [],
      });
    })
    .catch(() => {
      setCurrentUser(null);
    })
    .finally(() => {
      setUserLoading(false);
    });
}, []);

const isAdmin = currentUser?.role === "ADMIN";
const isEditor = currentUser?.role === "EDITOR";

const canCreateBreaking =
  !userLoading &&
  (isAdmin ||
    (isEditor &&
      currentUser?.permissions?.includes("breaking-news") === true));

const canCreateLive =
  !userLoading &&
  (isAdmin ||
    (isEditor &&
      currentUser?.permissions?.includes("live-news") === true));

const canSchedule =
  !userLoading &&
  (isAdmin ||
    (isEditor &&
      currentUser?.permissions?.includes("scheduled") === true));

  const editorRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const publishButtonRef = useRef<HTMLButtonElement>(null);
  const publishSentinelRef = useRef<HTMLDivElement>(null);


  const [dbTags,          setDbTags]          = useState<TagType[]>([]);
  const [trendingDbTags,  setTrendingDbTags]  = useState<TagType[]>([]);
  const [tagDropdown,     setTagDropdown]     = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [showFloatingPublish, setShowFloatingPublish] = useState(false);

  useEffect(() => {
  const sentinel = publishSentinelRef.current;
  if (!sentinel) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      setShowFloatingPublish(!entry.isIntersecting);
    },
    { threshold: 0 }
  );

  observer.observe(sentinel);

  return () => observer.disconnect();
}, []);

  useEffect(() => {
    Promise.all([getAllTags(), getTrendingTags()])
      .then(([all, trending]) => {
        setDbTags(Array.isArray(all) ? all : []);
        setTrendingDbTags(Array.isArray(trending) ? trending : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slugManuallyEdited) return;
    const source = headline.trim() || shortTitle.trim();
    setUrlSlug(generateSlug(source));
  }, [headline, shortTitle, slugManuallyEdited]);

  useEffect(() => {
    if (!isEdit || !editId) return;
    setLoadingArticle(true);
    fetchNewsById(editId)
      .then((data: any) => {
        setSelectedType(API_TYPE_TO_UI[data.articleType] ?? "Standard Article");
        setHeadline(data.headline ?? "");
        setShortTitle(data.shortTitle ?? "");
        setSummary(data.excerpt ?? "");
        
        // Populate rich text safely bypassing injected state freezes
        setInitialHtml(data.content ?? "");
        setContent(data.content ?? "");
        
        setTags(
          Array.isArray(data.tags)
            ? data.tags.filter((t: unknown): t is string => typeof t === "string")
            : []
        );
        setLanguage((data.language ?? "hindi").toLowerCase());
        setArticleLocation(data.location ?? "");

        // Safely extract relational schema mapping variations
        if (data.categoryId) {
          if (typeof data.categoryId === "object" && data.categoryId._id) {
            setCategoryId(String(data.categoryId._id));
          } else {
            setCategoryId(String(data.categoryId));
          }
        }

        if (data.articleType === "BREAKING") {
          setBreakingToggles({
            newsTicker:       Boolean(data.breakingNewsTicker),
            pushNotification: Boolean(data.breakingPushNotif),
            homepageAlert:    Boolean(data.breakingHomepageAlert),
          });
        }
        if (data.articleType === "LIVE" && Array.isArray(data.liveUpdates)) {
          setLiveUpdates(data.liveUpdates.map((u: any, i: number) => ({
            id:   u.id ?? i + 1,
            time: u.time ?? "",
            text: u.text ?? "",
          })));
        }

        setMediaPreview(typeof data.featuredImage === "string" ? data.featuredImage : null);
        setImageCaption(data.imageCaption ?? "");
        setPhotoCredit(data.photoCredit ?? "");
        setMetaTitle(data.metaTitle ?? "");
        setMetaDesc(data.metaDescription ?? "");
        setFocusKeywords(data.focusKeywords ?? "");

        if (data.slug) {
          setUrlSlug(data.slug);
          setSlugManuallyEdited(true);
        }
      })
      .catch(err => {
        console.error("Failed to load article:", err);
        setSubmitError("Failed to load article. Please try again.");
      })
      .finally(() => setLoadingArticle(false));
  }, [editId, isEdit]);

  useEffect(() => {
  const button = publishButtonRef.current;
  if (!button) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      setShowFloatingPublish(!entry.isIntersecting);
    },
    { threshold: 0 }
  );

  observer.observe(button);

  return () => observer.disconnect();
}, []);

  // ─── Draft autosave / restore-on-refresh ─────────────────────────────────
  // Keyed by the article being edited (or by "new + article type" when
  // creating), so drafts never leak between unrelated articles/tabs.
  const draftKey = `${DRAFT_STORAGE_PREFIX}${isEdit && editId ? `edit-${editId}` : `new-${typeParam || "standard"}`}`;

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingDraft,     setPendingDraft]     = useState<DraftSnapshot | null>(null);
  const hasCheckedDraftRef = useRef(false);

  // Check once (after any existing article has finished loading) whether
  // there's an autosaved draft worth offering to restore.
  useEffect(() => {
    if (loadingArticle) return;
    if (hasCheckedDraftRef.current) return;
    hasCheckedDraftRef.current = true;

    const draft = loadDraft(draftKey);
    if (draft) {
      setPendingDraft(draft);
      setShowRestoreModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingArticle, draftKey]);

  // Debounced autosave: whenever the form changes, silently persist a
  // snapshot to localStorage so a refresh (or an accidental tab close)
  // doesn't lose the admin's work.
  useEffect(() => {
    if (loadingArticle)   return; // don't autosave over data that's still loading
    if (showRestoreModal) return; // don't overwrite the saved draft before the user decides

    const handle = setTimeout(() => {
      if (!headline.trim() && !shortTitle.trim() && !content.trim()) return; // nothing worth saving yet
      saveDraft(draftKey, {
        selectedType, headline, shortTitle, summary, content, tags, categoryId,
        language, articleLocation, breakingToggles, liveUpdates, imageCaption,
        photoCredit,
        mediaPreview: mediaPreview && !mediaPreview.startsWith("blob:") ? mediaPreview : null,
        metaTitle, metaDesc, urlSlug, slugManuallyEdited, focusKeywords,
      });
    }, 800);

    return () => clearTimeout(handle);
  }, [
    loadingArticle, showRestoreModal, draftKey,
    selectedType, headline, shortTitle, summary, content, tags, categoryId,
    language, articleLocation, breakingToggles, liveUpdates, imageCaption,
    photoCredit, mediaPreview, metaTitle, metaDesc, urlSlug, slugManuallyEdited, focusKeywords,
  ]);

  const handleRestoreDraft = () => {
    if (!pendingDraft) return;
    setSelectedType(pendingDraft.selectedType ?? selectedType);
    setHeadline(pendingDraft.headline ?? "");
    setShortTitle(pendingDraft.shortTitle ?? "");
    setSummary(pendingDraft.summary ?? "");
    setContent(pendingDraft.content ?? "");
    setInitialHtml(pendingDraft.content ?? "");
    setTags(Array.isArray(pendingDraft.tags) ? pendingDraft.tags : []);
    setCategoryId(pendingDraft.categoryId ?? "");
    setLanguage(pendingDraft.language ?? "hindi");
    setArticleLocation(pendingDraft.articleLocation ?? "");
    setBreakingToggles(
      pendingDraft.breakingToggles ?? { newsTicker: true, pushNotification: true, homepageAlert: true }
    );
    setLiveUpdates(Array.isArray(pendingDraft.liveUpdates) ? pendingDraft.liveUpdates : []);
    setImageCaption(pendingDraft.imageCaption ?? "");
    setPhotoCredit(pendingDraft.photoCredit ?? "");
    if (pendingDraft.mediaPreview) setMediaPreview(pendingDraft.mediaPreview);
    setMetaTitle(pendingDraft.metaTitle ?? "");
    setMetaDesc(pendingDraft.metaDesc ?? "");
    setUrlSlug(pendingDraft.urlSlug ?? "");
    setSlugManuallyEdited(Boolean(pendingDraft.slugManuallyEdited));
    setFocusKeywords(pendingDraft.focusKeywords ?? "");
    setShowRestoreModal(false);
    setPendingDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft(draftKey);
    setShowRestoreModal(false);
    setPendingDraft(null);
  };

  const safeContent = typeof content === "string" ? content : "";
  const plainText = editorRef.current?.innerText ?? safeContent.replace(/<[^>]+>/g, " ");
  const wordCount = plainText.trim() === "" ? 0 : plainText.trim().split(/\s+/).length;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  const languageOptions = [
    { label: "Hindi",   value: "hindi"   },
    { label: "English", value: "english" },
    { label: "Bengali", value: "bengali" }, 
    { label: "Tamil",   value: "tamil"   },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleToolbarClick = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    if (action === "link") { setSavedRange(saveSelection()); setShowTopicModal(true); return; }
    applyRichFormat(action, editorRef);
  };

  const toApiArticleType = (): "STANDARD" | "BREAKING" | "LIVE" => ({
    "Standard Article": "STANDARD",
    "Breaking News":    "BREAKING",
    "Live Updates":     "LIVE",
  }[selectedType] as "STANDARD" | "BREAKING" | "LIVE");

  const buildPayload = (
    status: "PUBLISHED" | "DRAFT" | "SCHEDULED" | "EXPIRED" | "DELETED",
    publishAt?: string,
    deleteMode?: "instant" | "interval",
    deleteIntervalDays?: number,
  ) => {
    const apiType = toApiArticleType();
    return {
      headline:   headline.trim(),
      // NOTE: send the real value (even "") rather than `undefined` here.
      // `undefined` keys are dropped by JSON.stringify, so on update the
      // backend's `if (field !== undefined)` guard never sees them and the
      // old value survives — this is what made "clear + save" a no-op.
      shortTitle: shortTitle.trim(),
      excerpt:    summary.trim(),
      content:    editorRef.current?.innerHTML ?? content,
      categoryId,
      language:   language || "hindi",
      location:    articleLocation.trim(),
      tags,
      slug:       urlSlug,
      articleType: apiType,
      breakingNewsTicker:    apiType === "BREAKING" ? breakingToggles.newsTicker       : undefined,
      breakingPushNotif:     apiType === "BREAKING" ? breakingToggles.pushNotification : undefined,
      breakingHomepageAlert: apiType === "BREAKING" ? breakingToggles.homepageAlert    : undefined,
      liveUpdates: apiType === "LIVE" ? liveUpdates : undefined,
      featuredImage: mediaFile ? undefined : (mediaPreview && !mediaPreview.startsWith("blob:") ? mediaPreview : undefined),
      imageCaption:  imageCaption.trim(),
      photoCredit:   photoCredit.trim(),
      metaTitle:       metaTitle.trim(),
      metaDescription: metaDesc.trim(),
      focusKeywords:   focusKeywords.trim(),
      canonicalUrl:    urlSlug ? `https://yournewssite.com/news/${urlSlug}` : undefined,
      keywords: focusKeywords ? focusKeywords.split(",").map(k => k.trim()).filter(Boolean) : [],
      status,
      publishAt,
      deleteMode,
      deleteIntervalDays,
    };
  };

  const getRedirectPath = () => {
    if (selectedType === "Breaking News") return "/admin/breaking";
    if (selectedType === "Live Updates")  return "/admin/live";
    return "/admin/news";
  };

  const validate = (): boolean => {
    if (!headline.trim()) { setSubmitError("Headline is required."); return false; }
    if (!categoryId)      { setSubmitError("Please select a category."); return false; }
    return true;
  };

  const handlePublish = async () => {
    setSubmitError(null);
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const payload = buildPayload("PUBLISHED");

      if (isEdit && editId) {
        if (mediaFile) {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (Array.isArray(value)) {
              // If array contains objects, send as a single JSON-encoded field
              if (value.length > 0 && typeof value[0] === "object") {
                formData.append(key, JSON.stringify(value));
              } else {
                // Primitive arrays (strings) — repeated key[]
                value.forEach((v: any) => formData.append(`${key}[]`, String(v)));
              }
            } else if (typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          });
          formData.append("image", mediaFile);
          await updateNewsWithMedia(editId, formData);
        } else {
          await updateNews(editId, payload);
        }
      } else {
        if (mediaFile) {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (Array.isArray(value)) {
              // If array contains objects, send as a single JSON-encoded field
              if (value.length > 0 && typeof value[0] === "object") {
                formData.append(key, JSON.stringify(value));
              } else {
                // Primitive arrays (strings) — repeated key[]
                value.forEach((v: any) => formData.append(`${key}[]`, String(v)));
              }
            } else if (typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          });
          formData.append("image", mediaFile);
          await createNewsWithMedia(formData);
        } else {
          await createNews(payload);
        }
      }
      clearDraft(draftKey);
      navigate(getRedirectPath());
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to publish. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitError(null);
    if (!validate()) return;
    setIsSavingDraft(true);

    try {
      const payload = buildPayload("DRAFT");

      if (isEdit && editId) {
        await updateNews(editId, payload);
      } else {
        if (mediaFile) {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (Array.isArray(value)) {
              // If array contains objects, send as a single JSON-encoded field
              if (value.length > 0 && typeof value[0] === "object") {
                formData.append(key, JSON.stringify(value));
              } else {
                // Primitive arrays (strings) — repeated key[]
                value.forEach((v: any) => formData.append(`${key}[]`, String(v)));
              }
            } else if (typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          });
          formData.append("image", mediaFile);
          await createNewsWithMedia(formData);
        } else {
          await createNews(payload);
        }
      }
      clearDraft(draftKey);
      navigate("/admin/news");
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleScheduleConfirm = async (isoDatetime: string) => {
    setSubmitError(null);
    if (!validate()) { setShowScheduleModal(false); return; }
    setIsSubmitting(true);

    try {
      const payload = buildPayload("SCHEDULED", isoDatetime);

      if (isEdit && editId) {
        await updateNews(editId, payload);
      } else {
        if (mediaFile) {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            if (Array.isArray(value)) {
              // If array contains objects, send as a single JSON-encoded field
              if (value.length > 0 && typeof value[0] === "object") {
                formData.append(key, JSON.stringify(value));
              } else {
                // Primitive arrays (strings) — repeated key[]
                value.forEach((v: any) => formData.append(`${key}[]`, String(v)));
              }
            } else if (typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          });
          formData.append("image", mediaFile);
          await createNewsWithMedia(formData);
        } else {
          await createNews(payload);
        }
      }

      clearDraft(draftKey);
      setShowScheduleModal(false);
      navigate("/admin/schedule");
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to schedule. Please try again.");
      setShowScheduleModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (mode: "instant" | "interval") => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const payload = buildPayload("DELETED", undefined, mode, 14);
      if (isEdit && editId) await updateNews(editId, payload as any);
      else                  await createNews(payload as any);
      clearDraft(draftKey);
      setShowDeleteModal(false);
      navigate("/admin/news");
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to delete. Please try again.");
      setShowDeleteModal(false);
    } finally { setIsSubmitting(false); }
  };

  if (loadingArticle) {
    return (
      <>
      <Preloader />
        
      </>
    );
  }

  const googlePreviewUrl   = `https://yournewssite.com/news/${urlSlug || "article-slug"}`;
  const googlePreviewTitle = metaTitle || headline || "Your article title will appear here";
  const googlePreviewDesc  = metaDesc  || "Your meta description will appear here.";

  return (
    <div className="cna-root">
      <div
  ref={publishSentinelRef}
  className="cna-publish-sentinel"
  aria-hidden="true"
/>
      <header className="cna-header">
        <div className="cna-header-left">
          <div className="cna-title-group">
            <h1 className="cna-title">{isEdit ? "Edit Article" : "Create New Article"}</h1>
            <span className="cna-badge"><span className="cna-badge-dot" />{selectedType}</span>
          </div>
          <p className="cna-subtitle">
            {isEdit
              ? "Update your article content and settings"
              : "Regular news article with full editorial features"}
          </p>
        </div>
        <div className="cna-header-actions">
{canSchedule && (
  <>
    <button
      className="cna-btn cna-btn-outline"
      disabled={isSubmitting}
      onClick={() => setShowScheduleModal(true)}
    >
      <Clock size={15} />
      {isEdit ? "Reschedule" : "Schedule"}
    </button>

    <button
  className="cna-btn cna-btn-secondary"
  disabled={isSavingDraft || isSubmitting}
  onClick={handleSaveDraft}
>
  <FileText size={15} />
  {isSavingDraft ? "Saving…" : "Save Draft"}
</button>
  </>
)}
          <button className="cna-btn cna-btn-primary" disabled={isSubmitting}
            onClick={handlePublish}>
            <Rocket size={15} /> {isSubmitting ? "Saving…" : isEdit ? "Update & Publish" : "Publish Now"}
          </button>
        </div>
      </header>
{showFloatingPublish && (
  <button
    className="cna-floating-publish-btn"
    disabled={isSubmitting}
    onClick={handlePublish}
  >
    <Rocket size={15} />
    {isSubmitting
      ? "Saving…"
      : isEdit
        ? "Update & Publish"
        : "Publish Now"}
  </button>
)}

      {isEdit && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: 10, padding: "20px 16px 20px 16px", marginTop: "16px", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
           <span>Editing an existing article — changes will be saved to the database on publish or save draft.</span>
        </div>
      )}

      {submitError && (
        <div style={{ background: "#fff1f1", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>⚠ {submitError}</span>
          <button onClick={() => setSubmitError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 18 }}>×</button>
        </div>
      )}

      {showRestoreModal && pendingDraft && (
        <RestoreDraftModal draft={pendingDraft} onRestore={handleRestoreDraft} onDiscard={handleDiscardDraft} />
      )}
      {showScheduleModal && <ScheduleModal onClose={() => setShowScheduleModal(false)} onConfirm={handleScheduleConfirm} />}
      {showTopicModal    && <TopicLinkModal savedRange={savedRange} editorRef={editorRef} onClose={() => setShowTopicModal(false)} />}
      {showDeleteModal && (
        <div className="cna-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div className="cna-modal" role="dialog" aria-modal="true" style={{ maxWidth: 420 }}>
            <div className="cna-modal-header">
              <div className="cna-modal-title-wrap">
                <div className="cna-modal-icon" style={{ background: "#fee2e2" }}><Trash2 size={20} color="#dc2626" /></div>
                <div>
                  <h2 className="cna-modal-title">Delete Article</h2>
                  <p className="cna-modal-subtitle">Choose how to delete this article</p>
                </div>
              </div>
              <button className="cna-modal-close" onClick={() => setShowDeleteModal(false)}><X size={18} /></button>
            </div>
            <div className="cna-modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                className={`cna-delete-option${deleteMode === "instant" ? " cna-delete-option--active" : ""}`}
                onClick={() => setDeleteMode("instant")}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", border: deleteMode === "instant" ? "2px solid #dc2626" : "1px solid #e5e7eb", borderRadius: 10, background: deleteMode === "instant" ? "#fff1f1" : "#fafafa", cursor: "pointer", textAlign: "left" }}>
                <Trash2 size={18} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#1a1a18", margin: 0 }}>Instant Delete</p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Permanently removes the article immediately. This cannot be undone.</p>
                </div>
              </button>
              <button
                className={`cna-delete-option${deleteMode === "interval" ? " cna-delete-option--active" : ""}`}
                onClick={() => setDeleteMode("interval")}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", border: deleteMode === "interval" ? "2px solid #f59e0b" : "1px solid #e5e7eb", borderRadius: 10, background: deleteMode === "interval" ? "#fffbeb" : "#fafafa", cursor: "pointer", textAlign: "left" }}>
                <Clock size={18} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "#1a1a18", margin: 0 }}>Delete After 14 Days</p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Article is hidden immediately but stays in database for 14 days before being permanently purged.</p>
                </div>
              </button>
            </div>
            <div className="cna-modal-footer">
              <button className="cna-btn cna-btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button
                className="cna-btn"
                style={{ background: "#dc2626", color: "white" }}
                disabled={isSubmitting}
                onClick={() => handleDelete(deleteMode)}>
                <Trash2 size={14} /> {isSubmitting ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cna-body">
        <main className="cna-main">
          <section className="cna-section">
            <label className="cna-section-label">Article Type</label>
            <div className="cna-type-grid">
 {ARTICLE_TYPES.map(({ label, icon }) => {
  const allowed =
    label === "Standard Article"
      ? true
      : label === "Breaking News"
        ? canCreateBreaking
        : canCreateLive;

  if (!allowed) return null;

  return (
    <button
      key={label}
      type="button"
      className={`cna-type-btn${
        selectedType === label ? " cna-type-btn--active" : ""
      }`}
      onClick={() => {
        setSelectedType(label);
        setSubmitError(null);
      }}
    >
      <span className="cna-type-icon">{icon}</span>
      {label}
    </button>
  );
})}
</div>
          </section>

          <section className="cna-section">
            <label className="cna-field-label">Main Headline <span className="cna-required">*</span></label>
            <input className="cna-input cna-headline-input"
              placeholder="Enter your compelling headline here..."
              value={headline} maxLength={120}
              onChange={e => setHeadline(e.target.value)} />
            <p className="cna-hint">{headline.length}/120 characters • Recommended: 60–80 characters</p>
          </section>

          <section className="cna-section">
            <label className="cna-field-label">Short Title</label>
            <input className="cna-input" placeholder="Shorter version for mobile devices..."
              value={shortTitle} maxLength={50}
              onChange={e => setShortTitle(e.target.value)} />
            <p className="cna-hint">{shortTitle.length}/50 characters</p>
          </section>

          <section className="cna-section">
            <label className="cna-field-label">Excerpt</label>
            <textarea
              className="cna-input"
              placeholder="Write a short summary of the article..."
              value={summary}
              maxLength={250}
              onChange={(e) => setSummary(e.target.value)}
            />
            <p className="cna-hint">
              {summary.length}/250 characters • This will appear below the headline
            </p>
          </section>

          <section className="cna-section cna-editor-section">
            <div className="cna-toolbar">
              {TOOLBAR_ITEMS.map(({ action, icon, title }) => (
                <button key={action}
                  className={`cna-toolbar-btn${action === "link" ? " cna-toolbar-btn--topic" : ""}`}
                  title={title} onMouseDown={e => handleToolbarClick(e, action)}>
                  {icon}
                  {action === "link" && <span className="cna-toolbar-topic-label">Topic</span>}
                </button>
              ))}
            </div>
            <RichEditor editorRef={editorRef} onInput={setContent}
              wordCount={wordCount} readTime={readTime} initialHtml={initialHtml} />
          </section>

          <section className="cna-section">
            <label className="cna-section-label">Featured Media</label>
            <div
              className={`cna-dropzone${dragOver ? " cna-dropzone--over" : ""}${mediaPreview ? " cna-dropzone--has-image" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => !mediaPreview && fileInputRef.current?.click()}>
              {mediaPreview ? (
                <>
                  <img src={mediaPreview} alt="Preview" className="cna-dropzone-preview" />
                  <button className="cna-dropzone-remove"
                    onClick={e => { e.stopPropagation(); setMediaFile(null); setMediaPreview(null); }}>
                    ×
                  </button>
                </>
              ) : (
                <div className="cna-dropzone-inner">
                  <div className="cna-dropzone-icon-wrap"><Upload size={22} strokeWidth={1.5} /></div>
                  <p className="cna-dropzone-title">Drag and drop your featured image</p>
                  <p className="cna-dropzone-sub">or click to browse • PNG, JPG up to 10MB</p>
                  <button className="cna-btn cna-btn-secondary cna-dropzone-btn"
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Choose File
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg"
                style={{ display: "none" }} onChange={handleFileSelect} />
            </div>
            <div className="cna-media-meta">
              <div className="cna-media-meta-field">
                <label className="cna-field-label">Image Caption</label>
                <input className="cna-input" placeholder="Enter image caption..."
                  value={imageCaption} onChange={e => setImageCaption(e.target.value)} />
              </div>
              <div className="cna-media-meta-field">
                <label className="cna-field-label">Photo Credit</label>
                <input className="cna-input" placeholder="Photographer / Source"
                  value={photoCredit} onChange={e => setPhotoCredit(e.target.value)} />
              </div>
            </div>
          </section>

          <section className="cna-section cna-section--last">
            <div className="cna-seo-tabs">
              {(["settings","google"] as SeoTab[]).map(tab => (
                <button key={tab}
                  className={`cna-seo-tab${seoTab === tab ? " cna-seo-tab--active" : ""}`}
                  onClick={() => setSeoTab(tab)}>
                  {tab === "settings" ? "SEO Settings" : "Google Preview"}
                </button>
              ))}
            </div>
            {seoTab === "settings" && (
              <div className="cna-seo-panel">
                <div className="cna-field-group">
                  <label className="cna-field-label">Meta Title</label>
                  <input className="cna-input" placeholder="SEO-optimized title..."
                    value={metaTitle} maxLength={100}
                    onChange={e => setMetaTitle(e.target.value)} />
                  <p className="cna-hint">{metaTitle.length}/100 characters</p>
                </div>
                <div className="cna-field-group">
                  <label className="cna-field-label">Meta Description</label>
                  <textarea className="cna-input cna-seo-textarea"
                    placeholder="Brief description for search results..."
                    value={metaDesc} maxLength={160}
                    onChange={e => setMetaDesc(e.target.value)} />
                  <p className="cna-hint">{metaDesc.length}/160 characters</p>
                </div>
                <div className="cna-seo-row">
                  <div className="cna-field-group cna-seo-slug-group">
                    <label className="cna-field-label cna-slug-label">
                      URL Slug
                      {slugManuallyEdited ? (
                        <span className="cna-slug-badge cna-slug-badge--custom">Custom</span>
                      ) : (
                        <span className="cna-slug-badge cna-slug-badge--auto">Auto</span>
                      )}
                    </label>
                    <div className="cna-slug-input-wrap">
                      <span className="cna-slug-prefix">/news/</span>
                      <input
                        className="cna-input cna-slug-input"
                        placeholder="article-url-slug"
                        value={urlSlug}
                        onChange={e => {
                          const val = e.target.value.toLowerCase().replace(/\s+/g, "-");
                          setUrlSlug(val);
                          setSlugManuallyEdited(val.length > 0);
                        }}
                      />
                    </div>
                    {slugManuallyEdited && (
                      <p className="cna-hint" style={{ marginTop: 4 }}>
                        Auto-generation paused.{" "}
                        <button
                          type="button"
                          className="cna-slug-reset-btn"
                          onClick={() => {
                            setSlugManuallyEdited(false);
                            setUrlSlug(generateSlug(headline.trim() || shortTitle.trim()));
                          }}
                        >
                          Reset to auto
                        </button>
                      </p>
                    )}
                  </div>
                  <div className="cna-field-group cna-seo-kw-group">
                    <label className="cna-field-label">Focus Keywords</label>
                    <input className="cna-input" placeholder="keyword1, keyword2"
                      value={focusKeywords}
                      onChange={e => setFocusKeywords(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
            {seoTab === "google" && (
              <div className="cna-seo-panel">
                <div className="cna-google-preview">
                  <div className="cna-google-url-row">
                    <Globe size={14} className="cna-google-globe" />
                    <span className="cna-google-url">{googlePreviewUrl}</span>
                  </div>
                  <p className="cna-google-title">{googlePreviewTitle}</p>
                  <p className="cna-google-desc">{googlePreviewDesc}</p>
                </div>
              </div>
            )}
          </section>
        </main>

        <aside className="cna-sidebar">
          <div className="cna-card">
            <div className="cna-card-header">
              <User size={15} className="cna-card-icon-svg" />
              <h2 className="cna-card-title">Author</h2>
            </div>
            <div className="cna-select-trigger cna-select-trigger--fixed">
              <span className="cna-select-trigger-left">
                <span className="cna-author-avatar cna-author-avatar--sm">L</span>
                <span className="cna-select-value">LocalNewz</span>
              </span>
            </div>
          </div>

          <div className="cna-card">
            <div className="cna-card-header">
              <MapPin size={15} className="cna-card-icon-svg" />
              <h2 className="cna-card-title">Classification</h2>
            </div>

            <div className="cna-field-group">
              <label className="cna-field-label">
                Category <span className="cna-required">*</span>
              </label>
              {!categoriesLoaded ? (
                <div style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0" }}>
                  Loading categories…
                </div>
              ) : categoryOptions.length === 0 ? (
                <div style={{ fontSize: 13, color: "#ef4444", padding: "8px 0" }}>
                  No active categories found.{" "}
                  <a href="/admin/categories" style={{ color: "#2563eb" }}>Create one</a>
                </div>
              ) : (
                <CustomSelect
                  value={categoryId}
                  onChange={setCategoryId}
                  options={categoryOptions}
                  placeholder="Select category"
                />
              )}
            </div>

            <div className="cna-field-group">
              <label className="cna-field-label">Language</label>
              <CustomSelect value={language} onChange={setLanguage} options={languageOptions} />
            </div>
            <div className="cna-field-group">
              <label className="cna-field-label">Location</label>
              <LocationSearch value={articleLocation} onChange={setArticleLocation} />
            </div>
          </div>

          <div className="cna-card">
            <div className="cna-card-header">
              <Tag size={15} className="cna-card-icon-svg" />
              <h2 className="cna-card-title">Tags</h2>
            </div>

            {tags.length > 0 && (
              <div className="cna-tags">
                {tags.map(tag => (
                  <span key={tag} className="cna-tag">
                    {tag}
                    <button className="cna-tag-remove"
                      onClick={() => setTags(tags.filter(t => t !== tag))}>×</button>
                  </span>
                ))}
              </div>
            )}

            <div className="cna-tag-input-wrap" style={{ position: "relative" }}>
              <div className="cna-tag-input-row">
                <input
                  className="cna-input cna-tag-input"
                  placeholder="Type to search or add tag…"
                  value={tagInput}
                  autoComplete="off"
                  onChange={e => {
                    const val = e.target.value;
                    setTagInput(val);
                    if (val.trim().length > 0) {
                      const q = val.toLowerCase();
                      const matches = dbTags
                        .filter(t => t.name.toLowerCase().includes(q) && !tags.includes(t.name))
                        .map(t => t.name)
                        .slice(0, 6);
                      setTagDropdown(matches);
                      setTagDropdownOpen(matches.length > 0);
                    } else {
                      setTagDropdownOpen(false);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const norm = normalizeTag(tagInput);
                      if (norm && !tags.includes(norm)) {
                        setTags([...tags, norm]);
                        // Only call createTag for genuinely new tags not already in the DB
                        const alreadyExists = dbTags.some(
                          (t) => t.name.toLowerCase() === norm.toLowerCase()
                        );
                        if (!alreadyExists) createTag(norm).catch(() => {});
                      }
                      setTagInput("");
                      setTagDropdownOpen(false);
                    }
                    if (e.key === "Escape") setTagDropdownOpen(false);
                  }}
                  onBlur={() => setTimeout(() => setTagDropdownOpen(false), 150)}
                />
                <button className="cna-tag-search-btn" onClick={() => {
                  const norm = normalizeTag(tagInput);
                  if (norm && !tags.includes(norm)) {
                    setTags([...tags, norm]);
                    // Only call createTag for genuinely new tags not already in the DB
                    const alreadyExists = dbTags.some(
                      (t) => t.name.toLowerCase() === norm.toLowerCase()
                    );
                    if (!alreadyExists) createTag(norm).catch(() => {});
                  }
                  setTagInput("");
                  setTagDropdownOpen(false);
                }}><Tag size={14} /></button>
              </div>

              {tagDropdownOpen && tagDropdown.length > 0 && (
                <ul className="cna-tag-dropdown">
                  {tagDropdown.map(name => (
                    <li key={name} className="cna-tag-dropdown-item"
                      onMouseDown={() => {
                        if (!tags.includes(name)) setTags([...tags, name]);
                        setTagInput("");
                        setTagDropdownOpen(false);
                      }}>
                      <Tag size={12} /> {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {trendingDbTags.length > 0 && (
              <div className="cna-suggested-tags">
                <p className="cna-hint" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={12} /> Trending in your articles:
                </p>
                <div className="cna-suggested-list">
                  {trendingDbTags
                    .filter(t => !tags.includes(t.name))
                    .slice(0, 6)
                    .map(t => (
                      <button key={t.id} className="cna-suggested-tag"
                        onClick={() => {
                          if (!tags.includes(t.name)) setTags([...tags, t.name]);
                        }}>
                        <Plus size={10} /> {t.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="cna-card cna-card--status-info">
            <div className="cna-card-header">
              <Clock size={15} className="cna-card-icon-svg" />
              <h2 className="cna-card-title">Publishing</h2>
            </div>
            <div className="cna-status-info-list">
              <div className="cna-status-info-item">
                <span className="cna-status-dot cna-status-dot--published" />
                <div>
                  <p className="cna-status-info-label">{isEdit ? "Update & Publish" : "Publish Now"}</p>
                  <p className="cna-status-info-desc">Goes live immediately</p>
                </div>
              </div>
              <div className="cna-status-info-item">
                <span className="cna-status-dot cna-status-dot--draft" />
                <div>
                  <p className="cna-status-info-label">Save Draft</p>
                  <p className="cna-status-info-desc">Saved, not visible on site</p>
                </div>
              </div>
              <div className="cna-status-info-item">
                <span className="cna-status-dot cna-status-dot--scheduled" />
                <div>
                  <p className="cna-status-info-label">{isEdit ? "Reschedule" : "Schedule"}</p>
                  <p className="cna-status-info-desc">Publishes at chosen time</p>
                </div>
              </div>
            </div>
            <button
              className="cna-btn"
              style={{ marginTop: 12, width: "100%", justifyContent: "center", background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}
              disabled={isSubmitting}
              onClick={() => setShowDeleteModal(true)}>
              <Trash2 size={14} /> Delete Article
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CreateNewArticle;