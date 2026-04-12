import { useState } from "react";
import {
  Tag,
  TrendingUp,
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import "./Tags.css";

interface TagItem {
  id: number;
  name: string;
  slug: string;
  articles: number;
  date: string;
}

const tagsData: TagItem[] = [
  { id: 1, name: "Elections 2024", slug: "/elections-2024", articles: 456, date: "Jan 15, 2024" },
  { id: 2, name: "Budget 2024", slug: "/budget-2024", articles: 234, date: "Feb 1, 2024" },
  { id: 3, name: "IPL 2024", slug: "/ipl-2024", articles: 1234, date: "Mar 1, 2024" },
  { id: 4, name: "Stock Market", slug: "/stock-market", articles: 567, date: "Jan 1, 2024" },
];

const popularTags = [
  "Elections 2024 (456)",
  "Budget (234)",
  "IPL (1234)",
  "Stock Market (567)",
  "AI Technology (345)",
  "Climate Change (189)",
  "Bollywood (789)",
  "Cricket (1567)",
  "COVID-19 (234)",
  "Supreme Court (156)",
  "RBI (123)",
  "Modi Government (678)",
];

export default function Tags() {
  const [search, setSearch] = useState("");

  const filtered = tagsData.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tags-root">
      <div className="tags-container">

        {/* HEADER */}
        <div className="tags-header">
          <div>
            <h1 className="tags-title">Tags</h1>
            <p className="tags-subtitle">
              Manage tags for better content discovery
            </p>
          </div>
          <button className="tags-add-btn">
            <Plus size={16} />
            Add Tag
          </button>
        </div>

        {/* STATS */}
        <div className="tags-stats">

          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-gray">
              <Tag size={20} />
            </div>
            <div>
              <div className="tags-stat-value">248</div>
              <div className="tags-stat-label">Total Tags</div>
            </div>
          </div>

          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-blue">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="tags-stat-value">12</div>
              <div className="tags-stat-label">Trending</div>
            </div>
          </div>

          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-green">
              <FileText size={20} />
            </div>
            <div>
              <div className="tags-stat-value">8,456</div>
              <div className="tags-stat-label">Tagged Articles</div>
            </div>
          </div>

          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-gray">
              <Tag size={20} />
            </div>
            <div>
              <div className="tags-stat-value">34</div>
              <div className="tags-stat-label">New This Week</div>
            </div>
          </div>

        </div>

        {/* CONTENT GRID */}
        <div className="tags-grid">

          {/* LEFT - POPULAR TAGS */}
          <div className="tags-popular">
            <div className="tags-section-header">
              <TrendingUp size={18} />
              <h2>Popular Tags</h2>
            </div>

            <div className="tags-chip-wrap">
              {popularTags.map((t, i) => (
                <span key={i} className="tags-chip">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT - ALL TAGS */}
          <div className="tags-all">

            <div className="tags-section-header between">
              <div className="flex">
                <Tag size={18} />
                <h2>All Tags</h2>
              </div>

              <div className="tags-search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="tags-list">
              {filtered.map((t) => (
                <div key={t.id} className="tags-row">

                  <div className="tags-row-left">
                    <div className="tags-icon-box">
                      <Tag size={16} />
                    </div>
                    <div>
                      <div className="tags-name">{t.name}</div>
                      <div className="tags-slug">{t.slug}</div>
                    </div>
                  </div>

                  <div className="tags-row-right">
                    <div className="tags-count">
                      <div className="count">{t.articles}</div>
                      <div className="label">Articles</div>
                    </div>

                    <div className="tags-date">{t.date}</div>

                    <div className="tags-actions">
                      <button className="icon-btn">
                        <Pencil size={14} />
                      </button>
                      <button className="icon-btn delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
