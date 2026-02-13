import { useState } from "react";
import {
  Image,
  Video,
  HardDrive,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  Eye,
  Download,
  Trash2,
  Check,
  Copy
} from "lucide-react";
import "./MediaLibrary.css";

type ViewType = "grid" | "list";
type FileType = "All Types" | "Images" | "Videos";

interface MediaItem {
  id: number;
  name: string;
  size: string;
  dimension: string;
  used: number;
  time: string;
  type: "Images" | "Videos";
  src: string;
}

const mediaData: MediaItem[] = [
  {
    id: 1,
    name: "parliament-session.jpg",
    size: "2.4 MB",
    dimension: "1920×1080",
    used: 3,
    time: "2 hours ago",
    type: "Images",
    src: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800"
  },
  {
    id: 2,
    name: "stock-market-chart.jpg",
    size: "1.8 MB",
    dimension: "1920×1080",
    used: 5,
    time: "4 hours ago",
    type: "Images",
    src: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800"
  },
  {
    id: 3,
    name: "cricket-stadium.jpg",
    size: "3.2 MB",
    dimension: "2560×1440",
    used: 8,
    time: "1 day ago",
    type: "Images",
    src: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800"
  }
];

export default function MediaLibrary() {
  const [view, setView] = useState<ViewType>("grid");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<FileType>("All Types");
  const [open, setOpen] = useState(false);

  const filtered = mediaData.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchType = type === "All Types" || m.type === type;
    return matchSearch && matchType;
  });

  return (
    <div className="media-root">
      <div className="media-container">
        {/* Page Header */}
        <div className="media-header">
          <h1 className="media-title">Media Library</h1>
          <p className="media-subtitle">
            Manage your images, videos, and other media files
          </p>
        </div>
        {/* Stats */}
        <div className="media-stats">
          <div className="media-stat">
            <Image size={22} />
            <div>
              <h3>2,456</h3>
              <p>Images</p>
            </div>
          </div>

          <div className="media-stat">
            <Video size={22} />
            <div>
              <h3>128</h3>
              <p>Videos</p>
            </div>
          </div>

          <div className="media-stat">
            <HardDrive size={22} />
            <div>
              <h3>45.2 GB</h3>
              <p>Storage Used</p>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="media-controls">

          <div className="media-search">
            <Search size={16} />
            <input
              placeholder="Search media files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Custom Dropdown */}
          <div className="media-dropdown">
            <button
              className="media-dropdown-btn"
              onClick={() => setOpen(!open)}
            >
              {type}
              <ChevronDown size={16} />
            </button>

            {open && (
              <div className="media-dropdown-menu">
                {["All Types", "Images", "Videos"].map((item) => (
                  <div
                    key={item}
                    className={`media-dropdown-item ${
                      type === item ? "active" : ""
                    }`}
                    onClick={() => {
                      setType(item as FileType);
                      setOpen(false);
                    }}
                  >
                    {type === item && <Check size={14} />}
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="media-view-toggle">
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Grid View */}
        {view === "grid" && (
          <div className="media-grid">
  {filtered.map((item) => (
    <div key={item.id} className="media-card">

      <div className="media-card-img-wrapper">
        <img src={item.src} alt={item.name} />

        <div className="media-card-overlay">
          <div className="media-card-actions">
            <button>
              <Eye size={18} />
            </button>
            <button>
              <Copy size={18} />
            </button>
            <button>
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="media-card-info">
        <h4>{item.name}</h4>
        <p>{item.size}</p>
        <span>Used in {item.used} articles</span>
      </div>

    </div>
  ))}
</div>

        )}

        {/* List View */}
        {view === "list" && (
          <div className="media-list">
            {filtered.map((item) => (
              <div key={item.id} className="media-list-row">
                <img src={item.src} alt={item.name} />

                <div className="media-list-info">
                  <h4>{item.name}</h4>
                  <p>{item.dimension} • {item.size}</p>
                </div>

                <div className="media-list-meta">
                  <span>{item.time}</span>
                  <span className="used-badge">
                    Used in {item.used}
                  </span>

                  <div className="media-actions">
                    <Eye size={16} />
                    <Download size={16} />
                    <Trash2 size={16} className="delete" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
