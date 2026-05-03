import { useState, useEffect, useRef } from "react";
import {
  Image,
  HardDrive,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  Download,
  Trash2,
  Check,
  X,
  SlidersHorizontal,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { fetchMediaLibrary, deleteMediaImage } from "../../../api/news";
import "./MediaLibrary.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewType = "grid" | "list";
type SortType = "Newest" | "Oldest" | "Name A–Z" | "Name Z–A";

interface MediaItem {
  newsId:    string;
  url:       string;
  headline:  string;
  caption:   string | null;
  credit:    string | null;
  createdAt: string;
  status:    string;
  views:     number;
  type:      "featured" | "content";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS: SortType[] = ["Newest", "Oldest", "Name A–Z", "Name Z–A"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
}

function getFilename(url: string): string {
  try { return decodeURIComponent(url.split("/").pop() || url); }
  catch { return url; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MediaLibrary(): React.ReactElement {
  const [view,     setView]     = useState<ViewType>("grid");
  const [search,   setSearch]   = useState<string>("");
  const [sort,     setSort]     = useState<SortType>("Newest");
  const [sortOpen, setSortOpen] = useState<boolean>(false);

  const [items,   setItems]   = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error,   setError]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null); // newsId being deleted

  const sortRef = useRef<HTMLDivElement | null>(null);

  // ── Fetch from API ──────────────────────────────────────────────────────────
  const loadMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      // fetchMediaLibrary uses apiClient which returns already-parsed JSON
      const data = await fetchMediaLibrary({ limit: 100 });
      // Handle both: parsed object directly, or a Response object
      const parsed = data && typeof data.json === "function" ? await data.json() : data;
      setItems(parsed?.items || []);
    } catch (e: any) {
      console.error("loadMedia error:", e);
      setError("Failed to load media library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMedia(); }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = async (newsId: string) => {
    if (!window.confirm("Remove this image from the article?")) return;
    setDeleting(newsId);
    try {
      const res  = await deleteMediaImage(newsId);
      // deleteMediaImage uses apiClient which may return parsed JSON directly
      const data = res && typeof res.json === "function" ? await res.json() : res;
      if (data.success) {
        setItems(prev => prev.filter(item => item.newsId !== newsId));
      } else {
        alert(data.message || "Failed to delete image.");
      }
    } catch {
      alert("Failed to delete image.");
    } finally {
      setDeleting(null);
    }
  };

  // ── Download handler ────────────────────────────────────────────────────────
  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.target   = "_blank";
    a.rel      = "noopener noreferrer";
    a.click();
  };

  // ── Derived / filtered list ─────────────────────────────────────────────────
  const filtered: MediaItem[] = items
    .filter(m =>
      m.headline.toLowerCase().includes(search.toLowerCase()) ||
      getFilename(m.url).toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sort) {
        case "Name A–Z": return a.headline.localeCompare(b.headline);
        case "Name Z–A": return b.headline.localeCompare(a.headline);
        case "Oldest":   return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:         return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalImages   = items.length;
  const inPublished   = items.filter(i => i.status === "PUBLISHED").length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="ml-root">

      {/* ── TOPBAR ── */}
      <div className="ml-topbar">
        <div className="ml-topbar-left">
          <div className="ml-page-title">Media Library</div>
          <div className="ml-page-sub">Images from published articles</div>
        </div>

        <div className="ml-topbar-center">
          <div className="ml-search-wrap">
            <Search size={15} />
            <input
              placeholder="Search by headline or filename…"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
            {search && (
              <X size={14} style={{ cursor: "pointer", color: "#C0C0C0" }} onClick={() => setSearch("")} />
            )}
          </div>
        </div>

        <div className="ml-topbar-right">
          <button className="ml-refresh-btn" onClick={loadMedia} title="Refresh">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="ml-body">

        {/* Stats */}
        <div className="ml-stats">
          <div className="ml-stat-card">
            <div className="ml-stat-icon red"><Image size={20} /></div>
            <div>
              <div className="ml-stat-num">{totalImages}</div>
              <div className="ml-stat-label">Total Images</div>
            </div>
          </div>
          <div className="ml-stat-card">
            <div className="ml-stat-icon gray"><HardDrive size={20} /></div>
            <div>
              <div className="ml-stat-num">{filtered.length}</div>
              <div className="ml-stat-label">Shown</div>
            </div>
          </div>
          <div className="ml-stat-card">
            <div className="ml-stat-icon green"><Check size={20} /></div>
            <div>
              <div className="ml-stat-num">{inPublished}</div>
              <div className="ml-stat-label">In Published Articles</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ml-toolbar">
          <span className="ml-toolbar-title">
            {filtered.length} image{filtered.length !== 1 ? "s" : ""}
          </span>

          {/* Sort dropdown */}
          <div className="ml-sort-wrap" ref={sortRef}>
            <button className="ml-sort-btn" onClick={() => setSortOpen(v => !v)}>
              <SlidersHorizontal size={13} /> {sort} <ChevronDown size={13} />
            </button>
            {sortOpen && (
              <div className="ml-sort-menu">
                {SORT_OPTIONS.map(s => (
                  <div
                    key={s}
                    className={`ml-sort-item${sort === s ? " active" : ""}`}
                    onClick={() => { setSort(s); setSortOpen(false); }}
                  >
                    {sort === s && <Check size={13} />}
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="ml-view-toggle">
            <button className={`ml-view-btn${view === "grid" ? " active" : ""}`} onClick={() => setView("grid")}>
              <LayoutGrid size={14} />
            </button>
            <button className={`ml-view-btn${view === "list" ? " active" : ""}`} onClick={() => setView("list")}>
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="ml-empty">
            <Loader2 size={36} className="ml-spinner" />
            <p>Loading images…</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="ml-empty ml-empty--error">
            <AlertCircle size={36} />
            <p>{error}</p>
            <button className="ml-retry-btn" onClick={loadMedia}>Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="ml-empty">
            <Image size={48} />
            <p>{search ? "No images match your search" : "No images found. Upload images when creating articles."}</p>
          </div>
        )}

        {/* Grid view */}
        {!loading && !error && view === "grid" && filtered.length > 0 && (
          <div className="ml-grid">
            {filtered.map((item, idx) => {
              const filename = getFilename(item.url);
              const isDeleting = deleting === item.newsId;
              return (
                <div key={`${item.newsId}-${idx}`} className={`ml-card${isDeleting ? " ml-card--deleting" : ""}`}>
                  <div className="ml-card-img-wrap">
                    <img
                      src={item.url}
                      alt={item.headline}
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/400x225?text=No+Image"; }}
                    />
                    <div className="ml-card-badge">{item.type === "featured" ? "Featured" : "Content"}</div>
                    <div className="ml-card-overlay">
                      <button
                        className="ml-card-action"
                        title="Download"
                        onClick={() => handleDownload(item.url, filename)}
                      >
                        <Download size={15} />
                      </button>
                      <button
                        className="ml-card-action danger"
                        title="Delete"
                        disabled={isDeleting}
                        onClick={() => handleDelete(item.newsId)}
                      >
                        {isDeleting ? <Loader2 size={15} className="ml-spinner" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="ml-card-info">
                    <h4 title={item.headline}>{item.headline}</h4>
                    <div className="ml-card-meta">
                      <span className="ml-card-size" title={filename}>{filename.slice(0, 24)}{filename.length > 24 ? "…" : ""}</span>
                      <span className="ml-card-used">{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List view */}
        {!loading && !error && view === "list" && filtered.length > 0 && (
          <div className="ml-list">
            <div className="ml-list-header">
              <span></span>
              <span>Headline</span>
              <span>Type</span>
              <span>Status</span>
              <span>Uploaded</span>
              <span>Actions</span>
            </div>
            {filtered.map((item, idx) => {
              const filename   = getFilename(item.url);
              const isDeleting = deleting === item.newsId;
              return (
                <div key={`${item.newsId}-${idx}`} className={`ml-list-row${isDeleting ? " ml-list-row--deleting" : ""}`}>
                  <img
                    className="ml-list-thumb"
                    src={item.url}
                    alt={item.headline}
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/60x40?text=X"; }}
                  />
                  <div className="ml-list-name" title={item.headline}>{item.headline}</div>
                  <div className="ml-list-size">{item.type === "featured" ? "Featured" : "Content"}</div>
                  <div className="ml-list-dim">{item.status}</div>
                  <div className="ml-list-time">{timeAgo(item.createdAt)}</div>
                  <div className="ml-list-actions">
                    <span title="Download">
                      <Download
                        size={16}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleDownload(item.url, filename)}
                      />
                    </span>
                    {isDeleting
                      ? <Loader2 size={16} className="ml-spinner" />
                      : (
                        <span title="Delete">
                          <Trash2
                            size={16}
                            className="del"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleDelete(item.newsId)}
                          />
                        </span>
                      )
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}