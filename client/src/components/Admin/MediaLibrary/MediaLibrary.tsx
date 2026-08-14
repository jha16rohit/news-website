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
  Upload,
} from "lucide-react";
import {
  fetchMediaLibrary,
  deleteMediaImage,
  uploadMediaImage,
} from "../../../api/news";
import "./MediaLibrary.css";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewType = "grid" | "list";
type SortType = "Newest" | "Oldest" | "Name A–Z" | "Name Z–A";

interface MediaItem {
  newsId: string;
  url: string | null;
  headline: string;
  caption: string | null;
  credit: string | null;
  createdAt: string;
  status: string;
  views: number;
  type: "featured" | "content";
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

function getFilename(url: string | null): string {
  if (!url) return "No Image";

  try {
    return decodeURIComponent(url.split("/").pop() || url);
  } catch {
    return url;
  }
}
// ─── Component ────────────────────────────────────────────────────────────────

export default function MediaLibrary(): React.ReactElement {
  const [view,     setView]     = useState<ViewType>("grid");
  const [search,   setSearch]   = useState<string>("");
  const [sort,     setSort]     = useState<SortType>("Newest");
  const [filterType, setFilterType] = useState<
  "all" | "uploaded" | "empty"
>("all");
  const [sortOpen, setSortOpen] = useState<boolean>(false);

  const [items,   setItems]   = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error,   setError]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null); // newsId being deleted
  const [uploading, setUploading] = useState<string | null>(null); // newsId being uploaded
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
const [deleteNewsId, setDeleteNewsId] = useState<string | null>(null);

  const sortRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
const handleDelete = async () => {
  if (!deleteNewsId) return;

  setDeleting(deleteNewsId);

  try {
    const res = await deleteMediaImage(deleteNewsId);
    const data =
      res && typeof res.json === "function" ? await res.json() : res;

    if (data.success) {
      setItems(prev =>
        prev.map(item =>
          item.newsId === deleteNewsId && item.type === "featured"
            ? {
                ...item,
                url: null,
                caption: null,
                credit: null,
              }
            : item
        )
      );

      toast.success("Image deleted successfully.");
    } else {
      toast.error(data.message || "Failed to delete image.");
    }
  } catch {
    toast.error("Failed to delete image.");
  } finally {
    setDeleting(null);
    setConfirmOpen(false);
    setDeleteNewsId(null);
  }
}

  // ── Download handler ────────────────────────────────────────────────────────
  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.target   = "_blank";
    a.rel      = "noopener noreferrer";
    a.click();
  };

  // ── Upload handlers ─────────────────────────────────────────────────────────
  const openFilePicker = (newsId: string) => {
    setSelectedNewsId(newsId);
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedNewsId) return;

    try {
      setUploading(selectedNewsId);
      await uploadMediaImage(selectedNewsId, file);
      await loadMedia();
      toast.success("Image uploaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image.");
    } finally {
      setUploading(null);
      setSelectedNewsId(null);
      e.target.value = "";
    }
  };

  // ── Derived / filtered list ─────────────────────────────────────────────────
 const filtered = items
  .filter(item => {
    if (filterType === "uploaded") return !!item.url;
    if (filterType === "empty") return !item.url;
    return true;
  })
  .filter(item =>
    item.headline.toLowerCase().includes(search.toLowerCase()) ||
    getFilename(item.url).toLowerCase().includes(search.toLowerCase())
  )
  .sort((a, b) => {
    switch (sort) {
      case "Name A–Z":
        return a.headline.localeCompare(b.headline);
      case "Name Z–A":
        return b.headline.localeCompare(a.headline);
      case "Oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // ── Stats ───────────────────────────────────────────────────────────────────
 const totalSlots = items.length;

const uploadedImages = items.filter(item => item.url).length;

const emptySlots = items.filter(item => !item.url).length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="ml-root">

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleUpload}
      />

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

       
      </div>

      {/* ── BODY ── */}
      <div className="ml-body">

        {/* Stats */}
        <div className="ml-stats">
          <div
  className={`ml-stat-card ${filterType==="all" ? "active" : ""}`}
  onClick={() => setFilterType("all")}
>
            <div className="ml-stat-icon red"><Image size={20} /></div>
            <div>
              <div className="ml-stat-num">{totalSlots}</div>
              <div className="ml-stat-label">Total Slots</div>
            </div>
          </div>
          <div
  className={`ml-stat-card ${filterType==="uploaded" ? "active" : ""}`}
  onClick={() => setFilterType("uploaded")}
>
            <div className="ml-stat-icon gray"><HardDrive size={20} /></div>
            <div>
              <div className="ml-stat-num">{uploadedImages}</div>
              <div className="ml-stat-label">Images Uploaded</div>
            </div>
          </div>
          <div
  className={`ml-stat-card ${filterType==="empty" ? "active" : ""}`}
  onClick={() => setFilterType("empty")}
>
            <div className="ml-stat-icon green"><Check size={20} /></div>
            <div>
              <div className="ml-stat-num">{emptySlots}</div>
              <div className="ml-stat-label">Empty Slots</div>
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
              const filename = getFilename(item.url || "");
              const isDeleting = deleting === item.newsId;
              const isUploading = uploading === item.newsId;
              return (
                <div key={`${item.newsId}-${idx}`} className={`ml-card${isDeleting ? " ml-card--deleting" : ""}`}>
                  <div className="ml-card-img-wrap">
                    <img
                      src={item.url || "https://placehold.co/400x225?text=No+Image"}
                      alt={item.headline}
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/400x225?text=No+Image"; }}
                    />
                    <div className="ml-card-badge">{item.type === "featured" ? "Featured" : "Content"}</div>
                    <div
  className={`ml-card-overlay ${
    isUploading ? "ml-card-overlay--visible" : ""
  }`}
>
                      {item.url ? (
                        <>
                          <button
                            className="ml-card-action"
                            title="Download"
                            onClick={() => handleDownload(item.url as string, filename)}
                          >
                            <Download size={15} />
                          </button>
                          <button
                            className="ml-card-action danger"
                            title="Delete"
                            disabled={isDeleting}
                            onClick={() => {
    setDeleteNewsId(item.newsId);
    setConfirmOpen(true);
}}
                          >
                            {isDeleting ? <Loader2 size={15} className="ml-spinner" /> : <Trash2 size={15} />}
                          </button>
                        </>
                      ) : (
                        <button
                          className="ml-card-action upload"
                          title="Upload"
                          disabled={isUploading}
                          onClick={() => openFilePicker(item.newsId)}
                        >
                          {isUploading ? <Loader2 size={15} className="ml-spinner" /> : <Upload size={15} />}
                        </button>
                      )}
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
              const filename   = getFilename(item.url || "");
              const isDeleting = deleting === item.newsId;
              const isUploading = uploading === item.newsId;
              return (
                <div key={`${item.newsId}-${idx}`} className={`ml-list-row${isDeleting ? " ml-list-row--deleting" : ""}`}>
                  <img
                    className="ml-list-thumb"
                    src={item.url || "https://placehold.co/60x40?text=X"}
                    alt={item.headline}
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/60x40?text=X"; }}
                  />
                  <div className="ml-list-name" title={item.headline}>{item.headline}</div>
                  <div className="ml-list-size">{item.type === "featured" ? "Featured" : "Content"}</div>
                  <div className="ml-list-dim">{item.status}</div>
                  <div className="ml-list-time">{timeAgo(item.createdAt)}</div>
                  <div className="ml-list-actions">
                    {item.url ? (
                      <>
                        <span title="Download">
                          <Download
                            size={16}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleDownload(item.url as string, filename)}
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
                                onClick={() => {
  setDeleteNewsId(item.newsId);
  setConfirmOpen(true);
}}
                              />
                            </span>
                          )
                        }
                      </>
                    ) : (
                      isUploading
                        ? <Loader2 size={16} className="ml-spinner" />
                        : (
                          <span title="Upload">
                            <Upload
                              size={16}
                              style={{ cursor: "pointer" }}
                              onClick={() => openFilePicker(item.newsId)}
                            />
                          </span>
                        )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {confirmOpen && (
  <div className="ml-modal-backdrop">
    <div className="ml-modal">

      <Trash2 size={42} className="danger-icon" />

      <h3>Delete Image?</h3>

      <p>
        This image will be permanently removed from this article.
      </p>

      <div className="ml-modal-actions">

        <button
          className="cancel-btn"
          onClick={() => {
            setConfirmOpen(false);
            setDeleteNewsId(null);
          }}
        >
          Cancel
        </button>

        <button
  className="delete-btn"
  disabled={deleting === deleteNewsId}
  onClick={handleDelete}
>
  {deleting === deleteNewsId ? (
    <>
      <Loader2 className="ml-spinner" size={16} />
      Deleting...
    </>
  ) : (
    "Delete"
  )}
</button>

      </div>
    </div>
  </div>
)}
      
    </div>
  );
}