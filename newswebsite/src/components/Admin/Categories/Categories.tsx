import { useState } from "react";
import "./Categories.css";
import { Folder, FileText, Eye, Pencil, Trash2} from "lucide-react";


interface Category {
  id: number;
  name: string;
  description: string;
  articles: string;
  views: string;
  featured: boolean;
  enabled: boolean;
  color: string;
}

const initialCategories: Category[] = [
  {
    id: 1,
    name: "Politics",
    description: "National and international political news",
    articles: "1,245",
    views: "2.5M",
    featured: true,
    enabled: true,
    color: "#dc2626",
  },
  {
    id: 2,
    name: "Business",
    description: "Markets, economy, and corporate news",
    articles: "987",
    views: "1.9M",
    featured: true,
    enabled: true,
    color: "#2563eb",
  },
  {
    id: 3,
    name: "Sports",
    description: "Cricket, football, and all sports coverage",
    articles: "1,567",
    views: "3.2M",
    featured: true,
    enabled: true,
    color: "#16a34a",
  },
  {
    id: 4,
    name: "Entertainment",
    description: "Bollywood, Hollywood, and celebrity news",
    articles: "2,134",
    views: "4.5M",
    featured: false,
    enabled: true,
    color: "#9333ea",
  },
  {
    id: 5,
    name: "Technology",
    description: "Tech news, gadgets, and innovations",
    articles: "1,024",
    views: "2.1M",
    featured: true,
    enabled: true,
    color: "#0ea5e9",
  },
  {
    id: 6,
    name: "Health",
    description: "Medical news and wellness tips",
    articles: "856",
    views: "1.2M",
    featured: false,
    enabled: true,
    color: "#059669",
  },
];

export default function Categories() {
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggleCategory(id: number) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, enabled: !c.enabled } : c
      )
    );
  }

  return (
    <div className="cat-root">
      <div className="cat-container">

        {/* Header */}
        <div className="cat-header">
          <div>
            <h1 className="cat-title">Categories</h1>
            <p className="cat-subtitle">
              Organize your news content with categories
            </p>
          </div>
          <button className="cat-add-btn">+ Add Category</button>
        </div>

        {/* Stats */}
        {/* Stats */}
<div className="cat-stats">

  <div className="cat-stat-card">
    <div className="cat-stat-icon bg-gray">
      <Folder size={22} />
    </div>
    <div>
      <div className="cat-stat-value">8</div>
      <div className="cat-stat-label">Total Categories</div>
    </div>
  </div>

  <div className="cat-stat-card">
    <div className="cat-stat-icon bg-green">
      <FileText size={22} />
    </div>
    <div>
      <div className="cat-stat-value">8,333</div>
      <div className="cat-stat-label">Total Articles</div>
    </div>
  </div>

  <div className="cat-stat-card">
    <div className="cat-stat-icon bg-light">
      <Eye size={22} />
    </div>
    <div>
      <div className="cat-stat-value">16.8M</div>
      <div className="cat-stat-label">Total Views</div>
    </div>
  </div>

  <div className="cat-stat-card">
    <div className="cat-stat-icon bg-gray">
      <Folder size={22} />
    </div>
    <div>
      <div className="cat-stat-value">5</div>
      <div className="cat-stat-label">Featured</div>
    </div>
  </div>

</div>


        {/* Search */}
        <div className="cat-search">
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories Grid */}
        <div className="cat-grid">
          {filtered.map((c) => (
            <div key={c.id} className="cat-card">

              <div className="cat-drag">⋮⋮</div>

              <div
                className="cat-avatar"
                style={{ background: c.color }}
              >
                {c.name.charAt(0)}
              </div>

              <div className="cat-content">
                <div className="cat-top">
                  <h3>{c.name}</h3>
                  {c.featured && (
                    <span className="cat-featured">Featured</span>
                  )}
                </div>

                <p className="cat-desc">{c.description}</p>

                <div className="cat-meta">
                  <span>{c.articles} articles</span>
                  <span>{c.views} views</span>
                </div>
              </div>

              <div className="cat-actions">
                <button
                  className={`cat-toggle ${c.enabled ? "on" : ""}`}
                  onClick={() => toggleCategory(c.id)}
                >
                  <span />
                </button>

                <div className="cat-icons">
  <button className="cat-icon-btn">
    <Pencil size={16} />
  </button>

  <button className="cat-icon-btn cat-icon-btn--delete">
    <Trash2 size={16} />
  </button>
</div>

              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
