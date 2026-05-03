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
} from "lucide-react";
import "./MediaLibrary.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewType   = "grid" | "list";
type SortType   = "Newest" | "Oldest" | "Name A–Z" | "Name Z–A" | "Largest" | "Smallest";

interface MediaItem {
  id:        number;
  name:      string;
  size:      string;
  dimension: string;
  used:      number;
  time:      string;
  src:       string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS: SortType[] = [
  "Newest", "Oldest", "Name A–Z", "Name Z–A", "Largest", "Smallest",
];


const SIZE_MAP: Record<string, number> = {
  "2.4 MB": 2.4,
  "1.8 MB": 1.8,
  "3.2 MB": 3.2,
  "4.1 MB": 4.1,
  "1.6 MB": 1.6,
  "2.0 MB": 2.0,
};

const mediaData: MediaItem[] = [
  { id: 1, name: "parliament-session.jpg",  size: "2.4 MB", dimension: "1920×1080", used: 3, time: "2h ago",  src: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800" },
  { id: 2, name: "stock-market-chart.jpg",  size: "1.8 MB", dimension: "1920×1080", used: 5, time: "4h ago",  src: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800" },
  { id: 3, name: "cricket-stadium.jpg",     size: "3.2 MB", dimension: "2560×1440", used: 8, time: "1d ago",  src: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800" },
  { id: 4, name: "city-skyline-night.jpg",  size: "4.1 MB", dimension: "3840×2160", used: 2, time: "2d ago",  src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800" },
  { id: 5, name: "press-conference.jpg",    size: "1.6 MB", dimension: "1920×1080", used: 6, time: "3d ago",  src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800" },
  { id: 6, name: "economy-data.jpg",        size: "2.0 MB", dimension: "1920×1080", used: 4, time: "5d ago",  src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MediaLibrary(): React.ReactElement {
  const [view,     setView]     = useState<ViewType>("grid");
  const [search,   setSearch]   = useState<string>("");
  const [sort,     setSort]     = useState<SortType>("Newest");
  const [sortOpen, setSortOpen] = useState<boolean>(false);

  const sortRef = useRef<HTMLDivElement | null>(null);

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

  // ── Derived data ────────────────────────────────────────────────────────────

  const filtered: MediaItem[] = mediaData
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sort) {
        case "Name A–Z": return a.name.localeCompare(b.name);
        case "Name Z–A": return b.name.localeCompare(a.name);
        case "Largest":  return SIZE_MAP[b.size] - SIZE_MAP[a.size];
        case "Smallest": return SIZE_MAP[a.size] - SIZE_MAP[b.size];
        case "Oldest":   return a.id - b.id;
        default:         return b.id - a.id;
      }
    });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="ml-root">

      {/* ── TOPBAR ── */}
      <div className="ml-topbar">

        {/* Left: title */}
        <div className="ml-topbar-left">
          <div className="ml-page-title">Media Library</div>
          <div className="ml-page-sub">Manage your image assets</div>
        </div>

        {/* Center: search */}
        <div className="ml-topbar-center">
          <div className="ml-search-wrap">
            <Search size={15} />
            <input
              placeholder="Search images…"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
            {search && (
              <X
                size={14}
                style={{ cursor: "pointer", color: "#C0C0C0" }}
                onClick={() => setSearch("")}
              />
            )}
          </div>
        </div>

        {/* Right: storage pill + upload */}
        <div className="ml-topbar-right">

          {/* Storage progress pill */}
          <div className="ml-storage-pill">
            <span>Storage</span>
            <HardDrive size={14} color="#E53935" />
            <span className="ml-storage-pill-label">45.2 GB</span>
            <div className="ml-storage-pill-bar">
              <div className="ml-storage-pill-fill" />
            </div>
            <span className="ml-storage-pill-pct">62%</span>
          </div>

          

        </div>
      </div>

      {/* ── BODY ── */}
      <div className="ml-body">

        {/* Stats */}
        <div className="ml-stats">
          <div className="ml-stat-card">
            <div className="ml-stat-icon red"><Image size={20} /></div>
            <div>
              <div className="ml-stat-num">2,456</div>
              <div className="ml-stat-label">Total Images</div>
            </div>
          </div>
          <div className="ml-stat-card">
            <div className="ml-stat-icon gray"><HardDrive size={20} /></div>
            <div>
              <div className="ml-stat-num">45.2 GB</div>
              <div className="ml-stat-label">Storage Used</div>
            </div>
          </div>
          <div className="ml-stat-card">
            <div className="ml-stat-icon green"><Check size={20} /></div>
            <div>
              <div className="ml-stat-num">312</div>
              <div className="ml-stat-label">In Use</div>
            </div>
          </div>
        </div>

        <div className="ml-toolbar">

  <span className="ml-toolbar-title">
    {filtered.length} image{filtered.length !== 1 ? "s" : ""}
  </span>

  {/* Sort dropdown */}
  <div className="ml-sort-wrap" ref={sortRef}>
    <button className="ml-sort-btn" onClick={() => setSortOpen((v) => !v)}>
      <SlidersHorizontal size={13} /> {sort} <ChevronDown size={13} />
    </button>
    {sortOpen && (
      <div className="ml-sort-menu">
        {SORT_OPTIONS.map((s) => (
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
    <button
      className={`ml-view-btn${view === "grid" ? " active" : ""}`}
      onClick={() => setView("grid")}
    >
      <LayoutGrid size={14} />
    </button>
    <button
      className={`ml-view-btn${view === "list" ? " active" : ""}`}
      onClick={() => setView("list")}
    >
      <List size={14} />
    </button>
  </div>

</div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="ml-empty">
            <Image size={48} />
            <p>No images match your search</p>
          </div>
        )}

        {/* Grid view */}
        {view === "grid" && filtered.length > 0 && (
          <div className="ml-grid">
            {filtered.map((item) => (
              <div key={item.id} className="ml-card">
                <div className="ml-card-img-wrap">
                  <img src={item.src} alt={item.name} loading="lazy" />
                  <div className="ml-card-badge">JPG</div>
                  <div className="ml-card-overlay">
                    <button className="ml-card-action"><Download size={15} /></button>
                    <button className="ml-card-action danger"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="ml-card-info">
                  <h4>{item.name}</h4>
                  <div className="ml-card-meta">
                    <span className="ml-card-size">{item.dimension} · {item.size}</span>
                    <span className="ml-card-used">{item.used}×</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {view === "list" && filtered.length > 0 && (
          <div className="ml-list">
            <div className="ml-list-header">
              <span></span>
              <span>Name</span>
              <span>Size</span>
              <span>Dimension</span>
              <span>Uploaded</span>
              <span>Actions</span>
            </div>
            {filtered.map((item) => (
              <div key={item.id} className="ml-list-row">
                <img className="ml-list-thumb" src={item.src} alt={item.name} loading="lazy" />
                <div className="ml-list-name">{item.name}</div>
                <div className="ml-list-size">{item.size}</div>
                <div className="ml-list-dim">{item.dimension}</div>
                <div className="ml-list-time">{item.time}</div>
                <div className="ml-list-actions">
                  <Download size={16} />
                  <Trash2 size={16} className="del" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}