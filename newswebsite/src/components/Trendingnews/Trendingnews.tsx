import { useState } from "react";
import "./Trendingnews.css";

const timeRanges = ["Last Hour", "Last 6 Hours", "Last 24 Hours", "Last 7 Days"];

const articles = [
  {
    id: 1,
    title: "Major Policy Reform Announced: What It Means for Citizens",
    tag: "Politics",
    trend: "4h 23m on trend",
    views: "245.8K",
    shares: "12.4K",
    comments: 892,
    score: 98,
    growth: 15,
    positive: true,
    img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=160&h=100&fit=crop",
  },
  {
    id: 2,
    title: "Stock Market Hits Record High Amid Economic Optimism",
    tag: "Business",
    trend: "2h 45m on trend",
    views: "189.4K",
    shares: "8.9K",
    comments: 456,
    score: 94,
    growth: 8,
    positive: true,
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=160&h=100&fit=crop",
  },
  {
    id: 3,
    title: "Championship Finals: Dramatic Last-Minute Victory",
    tag: "Sports",
    trend: "6h 12m on trend",
    views: "156.9K",
    shares: "15.7K",
    comments: 1245,
    score: 91,
    growth: 3,
    positive: false,
    img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=160&h=100&fit=crop",
  },
  {
    id: 4,
    title: "Breakthrough in Renewable Energy Could Transform Power Grids",
    tag: "Science",
    trend: "1h 58m on trend",
    views: "134.2K",
    shares: "6.1K",
    comments: 318,
    score: 88,
    growth: 22,
    positive: true,
    img: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=160&h=100&fit=crop",
  },
  {
    id: 5,
    title: "Tech Giant Unveils Next-Generation AI Assistant Platform",
    tag: "Technology",
    trend: "3h 10m on trend",
    views: "118.7K",
    shares: "9.3K",
    comments: 724,
    score: 85,
    growth: 11,
    positive: true,
    img: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=160&h=100&fit=crop",
  },
];

const tagColors: Record<string, string> = {
  Politics: "#f97316",
  Business: "#3b82f6",
  Sports: "#22c55e",
  Science: "#a855f7",
  Technology: "#06b6d4",
};

export default function TrendingNews() {
  const [selected, setSelected] = useState("Last 24 Hours");
  const [open, setOpen] = useState(false);

  return (
    <div className="tn-root">
      {/* Background decoration */}
      <div className="tn-bg-orb tn-bg-orb--1" />
      <div className="tn-bg-orb tn-bg-orb--2" />

      <div className="tn-container">
        {/* Header */}
        <header className="tn-header">
          <div className="tn-header__left">
            
            <div>
              <h1 className="tn-title">Trending News</h1>
              <p className="tn-subtitle">Real-time trending articles based on engagement metrics</p>
            </div>
          </div>

          {/* Single dropdown */}
          <div className="tn-dropdown-wrap">
            <button
              className="tn-dropdown-btn"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {selected}
              <svg
                className={`tn-chevron ${open ? "tn-chevron--open" : ""}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {open && (
              <ul className="tn-dropdown-menu" role="listbox">
                {timeRanges.map((t) => (
                  <li
                    key={t}
                    role="option"
                    aria-selected={selected === t}
                    className={`tn-dropdown-item ${selected === t ? "tn-dropdown-item--active" : ""}`}
                    onClick={() => { setSelected(t); setOpen(false); }}
                  >
                    {selected === t && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        {/* Stat Cards */}
        <div className="tn-stats">
          {[
            { icon: "🔥", value: "24", label: "Trending Now", accent: "#f97316" },
            { icon: "👁", value: "1.2M", label: "Total Views", accent: "#3b82f6" },
            { icon: "↗", value: "67.2K", label: "Total Shares", accent: "#22c55e" },
            { icon: "📈", value: "+18%", label: "Avg. Growth", accent: "#a855f7" },
          ].map((s) => (
            <div className="tn-stat-card" key={s.label} style={{ "--accent": s.accent } as React.CSSProperties}>
              <div className="tn-stat-icon">{s.icon}</div>
              <div>
                <div className="tn-stat-value">{s.value}</div>
                <div className="tn-stat-label">{s.label}</div>
              </div>
              <div className="tn-stat-glow" />
            </div>
          ))}
        </div>

        {/* Articles */}
        <section className="tn-articles">
          <div className="tn-articles__header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <h2 className="tn-articles__title">Top Trending Articles</h2>
          </div>

          <div className="tn-article-list">
            {articles.map((a, i) => (
              <article className="tn-article" key={a.id} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="tn-article__rank">
                  <span>{a.id}</span>
                </div>

                <div className="tn-article__img-wrap">
                  <img src={a.img} alt={a.title} className="tn-article__img" />
                  <div className="tn-article__img-overlay" />
                </div>

                <div className="tn-article__body">
                  <h3 className="tn-article__title">{a.title}</h3>
                  <div className="tn-article__meta">
                    <span
                      className="tn-tag"
                      style={{ "--tag-color": tagColors[a.tag] ?? "#888" } as React.CSSProperties}
                    >
                      {a.tag}
                    </span>
                    <span className="tn-article__time">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {a.trend}
                    </span>
                  </div>
                </div>

                <div className="tn-article__stats">
                  <div className="tn-article__stat">
                    <span className="tn-article__stat-value">{a.views}</span>
                    <span className="tn-article__stat-label">Views</span>
                  </div>
                  <div className="tn-article__stat">
                    <span className="tn-article__stat-value">{a.shares}</span>
                    <span className="tn-article__stat-label">Shares</span>
                  </div>
                  <div className="tn-article__stat">
                    <span className="tn-article__stat-value">{a.comments}</span>
                    <span className="tn-article__stat-label">Comments</span>
                  </div>
                </div>

                <div className="tn-article__right">
                  <div className="tn-score-bar">
                    <div className="tn-score-bar__track">
                      <div
                        className="tn-score-bar__fill"
                        style={{ width: `${a.score}%` }}
                      />
                    </div>
                    <span className="tn-score-bar__num">{a.score}</span>
                  </div>
                  <div className={`tn-growth ${a.positive ? "tn-growth--up" : "tn-growth--down"}`}>
                    {a.positive ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                    {a.growth}%
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}