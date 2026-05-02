import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CreateNewArticle.css";
import { createNews, updateNews, fetchNewsById } from "../../../api/news";
import { getCategories } from "../../../api/category.api";

// Category type (mirrored from DB schema)
interface Category {
  id: string | number;
  name: string;
  parentId?: string | number | null;
  enabled?: boolean;
}
import {
  getAllTags,
  createTag,
  getTrendingTags,
  type Tag as TagType,
} from "../../../api/tags.api";
import {
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  Quote, AlignLeft, AlignCenter, AlignRight, Link,
  Upload, Globe, Clock, Rocket, Zap, Radio,
  FileText, Tag, MapPin, User, Trash2, Search, Video, X, CalendarClock,
  Plus, TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ArticleType = "Standard Article" | "Breaking News" | "Live Updates" | "Video Story";

const ARTICLE_TYPES: { label: ArticleType; icon: React.ReactNode }[] = [
  { label: "Standard Article", icon: <FileText size={15} /> },
  { label: "Breaking News",    icon: <Zap size={15} />      },
  { label: "Live Updates",     icon: <Radio size={15} />    },
  { label: "Video Story",      icon: <Video size={15} />    },
];

// ─── Tag helpers ──────────────────────────────────────────────────────────────
/** Title-case normalize: "budget 2025" → "Budget 2025" */
function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Type param → UI label ────────────────────────────────────────────────────
const TYPE_PARAM_MAP: Record<string, ArticleType> = {
  breaking: "Breaking News",
  live:     "Live Updates",
  video:    "Video Story",
  standard: "Standard Article",
};

// ─── API articleType → UI label ───────────────────────────────────────────────
const API_TYPE_TO_UI: Record<string, ArticleType> = {
  STANDARD: "Standard Article",
  BREAKING: "Breaking News",
  LIVE:     "Live Updates",
  VIDEO:    "Video Story",
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function secondsToDisplay(secs: number | null | undefined): string {
  if (!secs) return "00:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Topic Profile ────────────────────────────────────────────────────────────
interface TopicProfile {
  id: string; name: string; slug: string; caption: string;
  description: string; imageUrl?: string;
}

/** Fetch topic profiles from the DB via API instead of localStorage */
async function fetchTopicProfiles(): Promise<TopicProfile[]> {
  try {
    const res = await fetch("http://localhost:5001/api/topic-profiles", { credentials: "include" });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
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

// ─── Rich format ──────────────────────────────────────────────────────────────
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

// ─── RichEditor ───────────────────────────────────────────────────────────────
interface RichEditorProps {
  editorRef:    React.RefObject<HTMLDivElement | null>;
  onInput:      (html: string) => void;
  wordCount:    number;
  readTime:     number;
  initialHtml?: string;
}
const RichEditor: React.FC<RichEditorProps> = ({ editorRef, onInput, wordCount, readTime, initialHtml }) => {
  const injected = useRef(false);
  useEffect(() => {
    if (initialHtml && editorRef.current && !injected.current) {
      editorRef.current.innerHTML = initialHtml;
      injected.current = true;
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

// ─── CustomSelect ─────────────────────────────────────────────────────────────
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

// ─── LocationSearch ───────────────────────────────────────────────────────────
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

const Toggle: React.FC<{ on: boolean; onClick: () => void; label: string; dark?: boolean }> = ({ on, onClick, label, dark }) => (
  <button
    className={`cna-toggle${dark ? " cna-toggle--dark" : ""}${on ? " cna-toggle--on" : ""}`}
    onClick={onClick} aria-label={label}>
    <span className="cna-toggle-knob" />
  </button>
);

// ─── Schedule Modal ───────────────────────────────────────────────────────────
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

type SeoTab = "settings" | "google";

// ─── Main Component ───────────────────────────────────────────────────────────
const CreateNewArticle: React.FC = () => {
  const routerLocation = useLocation();
  const navigate       = useNavigate();

  const params    = new URLSearchParams(routerLocation.search);
  const editId    = params.get("edit");
  const isEdit    = Boolean(editId);
  const typeParam = params.get("type") ?? "";

  // ── DB categories (replaces STATIC_CATEGORIES entirely) ────────────────────
  const [dbCategories,     setDbCategories]     = useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  useEffect(() => {
    getCategories()
      .then((data: Category[]) => {
        setDbCategories(Array.isArray(data) ? data : []);
        setCategoriesLoaded(true);
      })
      .catch(() => setCategoriesLoaded(true));
  }, []);

  // Build option list: show parent name, indent children as "Parent / Child"
 const categoryOptions = dbCategories
  .filter(c => c.enabled !== false)
  .map(c => ({
    value: String(c.id), // ✅ FIX HERE
    label: c.parentId
      ? `${dbCategories.find(p => p.id === c.parentId)?.name ?? "…"} / ${c.name}`
      : c.name,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));
  // ── Article state ──────────────────────────────────────────────────────────
  const [loadingArticle, setLoadingArticle]   = useState(isEdit);
  const [selectedType,   setSelectedType]     = useState<ArticleType>(TYPE_PARAM_MAP[typeParam] ?? "Standard Article");
  const [headline,       setHeadline]         = useState("");
  const [shortTitle,     setShortTitle]       = useState("");
  const [content,        setContent]          = useState("");
  const [initialHtml,    setInitialHtml]      = useState("");
  const [tags,           setTags]             = useState<string[]>([]);
  const [tagInput,       setTagInput]         = useState("");
  // categoryId is the UUID of the selected Category (sent to backend)
  const [categoryId,     setCategoryId]       = useState("");
  const [language,       setLanguage]         = useState("english");
  const [articleLocation, setArticleLocation] = useState("");
  const [breakingToggles, setBreakingToggles] = useState({
    newsTicker: true, pushNotification: true, homepageAlert: true,
  });
  const [liveInput,      setLiveInput]        = useState("");
  const [liveUpdates,    setLiveUpdates]      = useState<{ id: number; time: string; text: string }[]>([]);
  const [videoUrl,       setVideoUrl]         = useState("");
  const [videoDuration,  setVideoDuration]    = useState("00:00");
  const [videoQuality,   setVideoQuality]     = useState("1080p");
  const [dragOver,       setDragOver]         = useState(false);
  const [,               setMediaFile]        = useState<File | null>(null);
  const [mediaPreview,   setMediaPreview]     = useState<string | null>(null);
  const [imageCaption,   setImageCaption]     = useState("");
  const [photoCredit,    setPhotoCredit]      = useState("");
  const [seoTab,         setSeoTab]           = useState<SeoTab>("settings");
  const [metaTitle,      setMetaTitle]        = useState("");
  const [metaDesc,       setMetaDesc]         = useState("");
  const [urlSlug,        setUrlSlug]          = useState("");
  const [focusKeywords,  setFocusKeywords]    = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTopicModal,    setShowTopicModal]    = useState(false);
  const [savedRange,        setSavedRange]        = useState<Range | null>(null);
  const [submitError,       setSubmitError]       = useState<string | null>(null);
  const [isSubmitting,      setIsSubmitting]      = useState(false);

  const editorRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);


  // ── DB tags for autocomplete + suggestions ─────────────────────────────────
  const [dbTags,             setDbTags]             = useState<TagType[]>([]);
  const [trendingDbTags,     setTrendingDbTags]     = useState<TagType[]>([]);
 const [tagDropdown,        setTagDropdown]        = useState<string[]>([]);
  const [tagDropdownOpen,    setTagDropdownOpen]    = useState(false);

  // Load DB tags once
  useEffect(() => {
    Promise.all([getAllTags(), getTrendingTags()])
      .then(([all, trending]) => {
        setDbTags(Array.isArray(all) ? all : []);
        setTrendingDbTags(Array.isArray(trending) ? trending : []);
      })
      .catch(() => {});
  }, []);



  // ── Load article for edit mode ─────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !editId) return;
    setLoadingArticle(true);
    fetchNewsById(editId)
      .then((data: any) => {
        setSelectedType(API_TYPE_TO_UI[data.articleType] ?? "Standard Article");
        setHeadline(data.headline ?? "");
        setShortTitle(data.shortTitle ?? "");
       editorRef.current?.innerHTML ?? content
        setInitialHtml(data.content ?? "");
setTags(
  Array.isArray(data.tags)
    ? data.tags.filter((t: unknown): t is string => typeof t === "string")
    : []
);        setLanguage((data.language ?? "english").toLowerCase());
        setArticleLocation(data.location ?? "");

        // Set categoryId from the FK — data.categoryId is the UUID
if (data.categoryId) setCategoryId(String(data.categoryId));
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
        if (data.articleType === "VIDEO") {
          setVideoUrl(data.videoUrl ?? "");
          setVideoDuration(secondsToDisplay(data.videoDuration));
          setVideoQuality(data.videoQuality ?? "1080p");
        }
setMediaPreview(typeof data.featuredImage === "string" ? data.featuredImage : null);        setImageCaption(data.imageCaption ?? "");
        setPhotoCredit(data.photoCredit ?? "");
        setMetaTitle(data.metaTitle ?? "");
        setMetaDesc(data.metaDescription ?? "");
        setFocusKeywords(data.focusKeywords ?? "");
        if (data.slug) setUrlSlug(data.slug);
      })
      .catch(err => {
        console.error("Failed to load article:", err);
        setSubmitError("Failed to load article. Please try again.");
      })
      .finally(() => setLoadingArticle(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // ── Computed ───────────────────────────────────────────────────────────────
const safeContent = typeof content === "string" ? content : "";
const plainText = editorRef.current?.innerText ?? safeContent.replace(/<[^>]+>/g, " ");  const wordCount = plainText.trim() === "" ? 0 : plainText.trim().split(/\s+/).length;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  const languageOptions = [
    { label: "English", value: "english" }, { label: "Hindi",   value: "hindi"   },
    { label: "Bengali", value: "bengali" }, { label: "Tamil",   value: "tamil"   },
  ];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const addLiveUpdateLocal = () => {
    if (!liveInput.trim()) return;
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setLiveUpdates(p => [...p, { id: Date.now(), time, text: liveInput.trim() }]);
    setLiveInput("");
  };

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

  const toApiArticleType = (): "STANDARD" | "BREAKING" | "LIVE" | "VIDEO" => ({
    "Standard Article": "STANDARD",
    "Breaking News":    "BREAKING",
    "Live Updates":     "LIVE",
    "Video Story":      "VIDEO",
  }[selectedType] as any);

  const buildPayload = (status: "PUBLISHED" | "DRAFT" | "SCHEDULED", publishAt?: string) => {
    const apiType = toApiArticleType();
    return {
      headline:   headline.trim(),
      shortTitle: shortTitle.trim() || undefined,
content: editorRef.current?.innerHTML ?? (content || ""),
      categoryId,   // ← UUID sent to backend; controller uses resolveCategoryId
      language,
      location:    articleLocation || undefined,
      tags,
      articleType: apiType,
      breakingNewsTicker:    apiType === "BREAKING" ? breakingToggles.newsTicker       : undefined,
      breakingPushNotif:     apiType === "BREAKING" ? breakingToggles.pushNotification : undefined,
      breakingHomepageAlert: apiType === "BREAKING" ? breakingToggles.homepageAlert    : undefined,
      liveUpdates: apiType === "LIVE"  ? liveUpdates  : undefined,
      videoUrl:      apiType === "VIDEO" ? videoUrl      || undefined : undefined,
      videoDuration: apiType === "VIDEO" ? videoDuration || undefined : undefined,
      videoQuality:  apiType === "VIDEO" ? videoQuality  || undefined : undefined,
      featuredImage: mediaPreview   || undefined,
      imageCaption:  imageCaption   || undefined,
      photoCredit:   photoCredit    || undefined,
      metaTitle:       metaTitle      || undefined,
      metaDescription: metaDesc       || undefined,
      focusKeywords:   focusKeywords  || undefined,
      canonicalUrl:    urlSlug ? `https://yournewssite.com/news/${urlSlug}` : undefined,
      keywords: focusKeywords ? focusKeywords.split(",").map(k => k.trim()).filter(Boolean) : [],
      status,
      publishAt,
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
      if (isEdit && editId) await updateNews(editId, buildPayload("PUBLISHED"));
      else                  await createNews(buildPayload("PUBLISHED"));
      navigate(getRedirectPath());
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to publish. Please try again.");
    } finally { setIsSubmitting(false); }
  };

  const handleSaveDraft = async () => {
    setSubmitError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (isEdit && editId) await updateNews(editId, buildPayload("DRAFT"));
      else                  await createNews(buildPayload("DRAFT"));
      navigate("/admin/news");
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to save draft. Please try again.");
    } finally { setIsSubmitting(false); }
  };

  const handleScheduleConfirm = async (isoDatetime: string) => {
    setSubmitError(null);
    if (!validate()) { setShowScheduleModal(false); return; }
    setIsSubmitting(true);
    try {
      if (isEdit && editId) await updateNews(editId, buildPayload("SCHEDULED", isoDatetime));
      else                  await createNews(buildPayload("SCHEDULED", isoDatetime));
      setShowScheduleModal(false);
      navigate("/admin/schedule");
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to schedule. Please try again.");
      setShowScheduleModal(false);
    } finally { setIsSubmitting(false); }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loadingArticle) {
    return (
      <div className="cna-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>Loading article…</p>
        </div>
      </div>
    );
  }

  const googlePreviewUrl   = `https://yournewssite.com/news/${urlSlug || "article-slug"}`;
  const googlePreviewTitle = metaTitle || headline || "Your article title will appear here";
  const googlePreviewDesc  = metaDesc  || "Your meta description will appear here.";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="cna-root">
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
          <button className="cna-btn cna-btn-outline" disabled={isSubmitting}
            onClick={() => setShowScheduleModal(true)}>
            <Clock size={15} /> {isEdit ? "Reschedule" : "Schedule"}
          </button>
          <button className="cna-btn cna-btn-secondary" disabled={isSubmitting}
            onClick={handleSaveDraft}>
            <FileText size={15} /> {isSubmitting ? "Saving…" : "Save Draft"}
          </button>
          <button className="cna-btn cna-btn-primary" disabled={isSubmitting}
            onClick={handlePublish}>
            <Rocket size={15} /> {isSubmitting ? "Saving…" : isEdit ? "Update & Publish" : "Publish Now"}
          </button>
        </div>
      </header>

      {isEdit && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          ✏️ <span>Editing an existing article — changes will be saved to the database on publish or save draft.</span>
        </div>
      )}

      {submitError && (
        <div style={{ background: "#fff1f1", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>⚠ {submitError}</span>
          <button onClick={() => setSubmitError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 18 }}>×</button>
        </div>
      )}

      {showScheduleModal && <ScheduleModal onClose={() => setShowScheduleModal(false)} onConfirm={handleScheduleConfirm} />}
      {showTopicModal    && <TopicLinkModal savedRange={savedRange} editorRef={editorRef} onClose={() => setShowTopicModal(false)} />}

      <div className="cna-body">
        <main className="cna-main">

          {/* Article Type */}
          <section className="cna-section">
            <label className="cna-section-label">Article Type</label>
            <div className="cna-type-grid">
              {ARTICLE_TYPES.map(({ label, icon }) => (
                <button key={label}
                  className={`cna-type-btn${selectedType === label ? " cna-type-btn--active" : ""}`}
                  onClick={() => setSelectedType(label)}>
                  <span className="cna-type-icon">{icon}</span>{label}
                </button>
              ))}
            </div>
          </section>

          {/* Breaking options */}
          {selectedType === "Breaking News" && (
            <section className="cna-section cna-type-panel cna-type-panel--breaking">
              <div className="cna-type-panel-header">
                <div className="cna-type-panel-icon cna-type-panel-icon--breaking"><Zap size={18} /></div>
                <div>
                  <h3 className="cna-type-panel-title cna-type-panel-title--breaking">Breaking News Mode</h3>
                  <p className="cna-type-panel-desc">This article will be published immediately and shown in the breaking news ticker.</p>
                </div>
              </div>
              <div className="cna-type-panel-toggles">
                {(["newsTicker","pushNotification","homepageAlert"] as const).map(key => (
                  <label key={key} className="cna-inline-toggle">
                    <Toggle on={breakingToggles[key]}
                      onClick={() => setBreakingToggles(p => ({ ...p, [key]: !p[key] }))}
                      label={key} dark />
                    <span className="cna-inline-toggle-label">
                      {key === "newsTicker" ? "News Ticker" : key === "pushNotification" ? "Push Notification" : "Homepage Alert"}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Live options */}
          {selectedType === "Live Updates" && (
            <section className="cna-section cna-type-panel cna-type-panel--live">
              <div className="cna-type-panel-header">
                <span className="cna-live-dot" />
                <h3 className="cna-type-panel-title cna-type-panel-title--breaking">Live Updates Feed</h3>
              </div>
              <div className="cna-live-input-row">
                <input className="cna-input" placeholder="Add a new update..." value={liveInput}
                  onChange={e => setLiveInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addLiveUpdateLocal()} />
                <button className="cna-btn cna-btn-live" onClick={addLiveUpdateLocal}>+ Add Update</button>
              </div>
              <div className="cna-live-feed">
                {liveUpdates.map(u => (
                  <div key={u.id} className="cna-live-item">
                    <span className="cna-live-time">{u.time}</span>
                    <span className="cna-live-text">{u.text}</span>
                    <button className="cna-live-delete"
                      onClick={() => setLiveUpdates(p => p.filter(x => x.id !== u.id))}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Video options */}
          {selectedType === "Video Story" && (
            <section className="cna-section cna-type-panel cna-type-panel--video">
              <div className="cna-type-panel-header">
                <Video size={18} />
                <h3 className="cna-type-panel-title" style={{ marginLeft: 8 }}>Video Content</h3>
              </div>
              <div className="cna-dropzone cna-video-dropzone" onClick={() => videoFileRef.current?.click()}>
                <div className="cna-dropzone-inner">
                  <div className="cna-dropzone-icon-wrap"><Video size={22} strokeWidth={1.5} /></div>
                  <p className="cna-dropzone-title">Upload Video</p>
                  <p className="cna-dropzone-sub">MP4, WebM up to 500MB</p>
                  <button className="cna-btn cna-btn-secondary cna-dropzone-btn"
                    onClick={e => { e.stopPropagation(); videoFileRef.current?.click(); }}>
                    Choose File
                  </button>
                </div>
                <input ref={videoFileRef} type="file" accept="video/mp4,video/webm" style={{ display: "none" }} />
              </div>
              <p className="cna-video-or">or</p>
              <div className="cna-field-group">
                <label className="cna-field-label">Video URL (YouTube, Vimeo)</label>
                <input className="cna-input" placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
              </div>
              <div className="cna-seo-row">
                <div className="cna-field-group">
                  <label className="cna-field-label">Duration</label>
                  <input className="cna-input" placeholder="00:00"
                    value={videoDuration} onChange={e => setVideoDuration(e.target.value)} />
                </div>
                <div className="cna-field-group">
                  <label className="cna-field-label">Video Quality</label>
                  <CustomSelect value={videoQuality} onChange={setVideoQuality} options={[
                    { label: "4K Ultra HD", value: "4k"    },
                    { label: "1080p Full HD", value: "1080p" },
                    { label: "720p HD",     value: "720p"  },
                    { label: "480p SD",     value: "480p"  },
                  ]} />
                </div>
              </div>
            </section>
          )}

          {/* Headline */}
          <section className="cna-section">
            <label className="cna-field-label">Main Headline <span className="cna-required">*</span></label>
            <input className="cna-input cna-headline-input"
              placeholder="Enter your compelling headline here..."
              value={headline} maxLength={120}
              onChange={e => setHeadline(e.target.value)} />
            <p className="cna-hint">{headline.length}/120 characters • Recommended: 60–80 characters</p>
          </section>

          {/* Short title */}
          <section className="cna-section">
            <label className="cna-field-label">Short Title (Mobile)</label>
            <input className="cna-input" placeholder="Shorter version for mobile devices..."
              value={shortTitle} maxLength={50}
              onChange={e => setShortTitle(e.target.value)} />
            <p className="cna-hint">{shortTitle.length}/50 characters</p>
          </section>

          {/* Rich editor */}
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

          {/* Featured Media */}
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

          {/* SEO */}
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
                    value={metaTitle} maxLength={60}
                    onChange={e => setMetaTitle(e.target.value)} />
                  <p className="cna-hint">{metaTitle.length}/60 characters</p>
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
                    <label className="cna-field-label">URL Slug</label>
                    <div className="cna-slug-input-wrap">
                      <span className="cna-slug-prefix">/news/</span>
                      <input className="cna-input cna-slug-input" placeholder="article-url-slug"
                        value={urlSlug}
                        onChange={e => setUrlSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} />
                    </div>
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

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="cna-sidebar">

          {/* Author (static display) */}
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

          {/* Classification */}
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

          {/* Tags */}
          <div className="cna-card">
            <div className="cna-card-header">
              <Tag size={15} className="cna-card-icon-svg" />
              <h2 className="cna-card-title">Tags</h2>
            </div>
</div>
            {/* Applied tags */}
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

            {/* Input with DB autocomplete */}
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
                        .filter(t =>
                          t.name.toLowerCase().includes(q) &&
                          !tags.includes(t.name)
                        )
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
                        createTag(norm).catch(() => {});
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
                    createTag(norm).catch(() => {});
                  }
                  setTagInput("");
                  setTagDropdownOpen(false);
                }}><Tag size={14} /></button>
              </div>

              {/* Autocomplete dropdown */}
              {tagDropdownOpen && tagDropdown.length > 0 && (
                <ul className="cna-tag-dropdown">
                  {tagDropdown.map(name => (
                    <li key={name}
                      className="cna-tag-dropdown-item"
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

            {/* Trending from your DB */}
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

      
          {/* Publishing */}
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
          </div>

        </aside>
      </div>
    </div>
  );
};

export default CreateNewArticle;