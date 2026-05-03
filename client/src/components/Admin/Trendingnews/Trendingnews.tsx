import { useState, useEffect } from "react";
import {
  TrendingUp,
  Eye,
  Share2,
  MessageSquare,
  Clock,
  ArrowUp,
  ArrowDown,
  Tag,
  BarChart2,
  ChevronDown,
  Check,
  Flame,
} from "lucide-react";
import "./Trendingnews.css";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface TrendingTag {
  id: string;
  label: string;
  slug: string;
  enabled: boolean;
}

interface Article {
  id: number;
  title: string;
  tags: string[]; // array of tag slugs
  trend: string;
  views: string;
  shares: string;
  comments: number;
  score: number;
  growth: number;
  positive: boolean;
  img: string;
}

// ─────────────────────────────────────────────
// Static fallback data — replace with your NewsStore
// ─────────────────────────────────────────────
const FALLBACK_TAGS: TrendingTag[] = [
  { id: "1", label: "Budget 2026", slug: "budget2026", enabled: true },
  { id: "2", label: "India News", slug: "indianews", enabled: true },
  { id: "3", label: "IPL 2026", slug: "ipl2026", enabled: true },
  { id: "4", label: "Tech Update", slug: "techupdate", enabled: true },
  { id: "5", label: "Stock Market", slug: "stockmarket", enabled: true },
  { id: "6", label: "Web Stories", slug: "webstories", enabled: true },
  { id: "7", label: "Global News", slug: "globalnews", enabled: true },
];

const FALLBACK_ARTICLES: Article[] = [
  {
    id: 1,
    title: "Major Policy Reform Announced: What It Means for Citizens",
    tags: ["budget2026", "indianews"],
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
    tags: ["stockmarket", "budget2026"],
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
    tags: ["ipl2026"],
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
    tags: ["globalnews", "techupdate"],
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
    tags: ["techupdate", "webstories"],
    trend: "3h 10m on trend",
    views: "118.7K",
    shares: "9.3K",
    comments: 724,
    score: 85,
    growth: 11,
    positive: true,
    img: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=160&h=100&fit=crop",
  },
  {
    id: 6,
    title: "India's Economy Grows Faster Than Expected This Quarter",
    tags: ["indianews", "stockmarket"],
    trend: "5h 01m on trend",
    views: "97.3K",
    shares: "4.2K",
    comments: 211,
    score: 82,
    growth: 6,
    positive: true,
    img: "https://images.unsplash.com/photo-1524492412937-b28074a47d70?w=160&h=100&fit=crop",
  },
  {
    id: 7,
    title: "Global Summit Addresses Climate Change Commitments",
    tags: ["globalnews"],
    trend: "7h 30m on trend",
    views: "88.1K",
    shares: "3.7K",
    comments: 145,
    score: 79,
    growth: 4,
    positive: true,
    img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=160&h=100&fit=crop",
  },
];

const TIME_RANGES = ["Last Hour", "Last 6 Hours", "Last 24 Hours", "Last 7 Days"];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function TrendingNews() {
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>(FALLBACK_TAGS);
  const [activeTagSlug, setActiveTagSlug] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("Last 24 Hours");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Load trending tags from localStorage (set by admin panel)
  useEffect(() => {
    const loadTags = () => {
      try {
        const raw = localStorage.getItem("localNewzTrendingTags");
        if (raw) {
          const parsed: TrendingTag[] = JSON.parse(raw);
          const enabled = parsed.filter((t) => t.enabled);
          if (enabled.length > 0) setTrendingTags(enabled);
        }
      } catch (e) {
        console.error("Failed to load trending tags:", e);
      }
    };

    loadTags();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "localNewzTrendingTags") loadTags();
    };
    const onCustom = () => loadTags();

    window.addEventListener("storage", onStorage);
    window.addEventListener("localNewzTrendingTagsUpdate", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("localNewzTrendingTagsUpdate", onCustom);
    };
  }, []);

  // Filter articles by active tag
  const filteredArticles =
    activeTagSlug === "all"
      ? FALLBACK_ARTICLES
      : FALLBACK_ARTICLES.filter((a) => a.tags.includes(activeTagSlug));

  // Stats derived from filtered list
  const totalViews = filteredArticles.reduce((acc, a) => {
    const num = parseFloat(a.views.replace("K", "")) * 1000;
    return acc + num;
  }, 0);

  const formatViews = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const totalShares = filteredArticles.reduce((acc, a) => {
    const num = parseFloat(a.shares.replace("K", "")) * 1000;
    return acc + num;
  }, 0);

  const avgGrowth =
    filteredArticles.length > 0
      ? Math.round(
          filteredArticles.reduce((acc, a) => acc + a.growth, 0) /
            filteredArticles.length
        )
      : 0;

  return (
    <div className="tn-root">
      <div className="tn-container">

        {/* ── HEADER ── */}
        <header className="tn-header">
          <div className="tn-header__left">
            <div className="tn-header__icon">
              <TrendingUp size={22} />
            </div>
            <div>
              <h1 className="tn-title">Trending News</h1>
              <p className="tn-subtitle">
                Real-time trending articles based on engagement metrics
              </p>
            </div>
          </div>

          <div className="tn-dropdown-wrap">
            <button
              className="tn-dropdown-btn"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              <Clock size={14} />
              {timeRange}
              <ChevronDown
                size={14}
                className={`tn-chevron ${dropdownOpen ? "tn-chevron--open" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <ul className="tn-dropdown-menu" role="listbox">
                {TIME_RANGES.map((t) => (
                  <li
                    key={t}
                    role="option"
                    aria-selected={timeRange === t}
                    className={`tn-dropdown-item ${timeRange === t ? "tn-dropdown-item--active" : ""}`}
                    onClick={() => {
                      setTimeRange(t);
                      setDropdownOpen(false);
                    }}
                  >
                    {timeRange === t && <Check size={12} />}
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        {/* ── STAT CARDS ── */}
        <div className="tn-stats">
          <div className="tn-stat-card">
            <div className="tn-stat-card__icon tn-stat-card__icon--orange">
              <Flame size={18} />
            </div>
            <div>
              <div className="tn-stat-value">{filteredArticles.length}</div>
              <div className="tn-stat-label">Trending Now</div>
            </div>
          </div>
          <div className="tn-stat-card">
            <div className="tn-stat-card__icon tn-stat-card__icon--blue">
              <Eye size={18} />
            </div>
            <div>
              <div className="tn-stat-value">{formatViews(totalViews)}</div>
              <div className="tn-stat-label">Total Views</div>
            </div>
          </div>
          <div className="tn-stat-card">
            <div className="tn-stat-card__icon tn-stat-card__icon--green">
              <Share2 size={18} />
            </div>
            <div>
              <div className="tn-stat-value">{formatViews(totalShares)}</div>
              <div className="tn-stat-label">Total Shares</div>
            </div>
          </div>
          <div className="tn-stat-card">
            <div className="tn-stat-card__icon tn-stat-card__icon--purple">
              <BarChart2 size={18} />
            </div>
            <div>
              <div className="tn-stat-value">+{avgGrowth}%</div>
              <div className="tn-stat-label">Avg. Growth</div>
            </div>
          </div>
        </div>

        {/* ── TRENDING TAG FILTERS ── */}
        <div className="tn-tag-filter-wrap">
          <div className="tn-tag-filter-label">
            <Tag size={14} />
            <span>Filter by Tag</span>
          </div>
          <div className="tn-tag-filters">
            <button
              className={`tn-tag-btn ${activeTagSlug === "all" ? "tn-tag-btn--active" : ""}`}
              onClick={() => setActiveTagSlug("all")}
            >
              All Topics
            </button>
            {trendingTags.map((tag) => (
              <button
                key={tag.id}
                className={`tn-tag-btn ${activeTagSlug === tag.slug ? "tn-tag-btn--active" : ""}`}
                onClick={() => setActiveTagSlug(tag.slug)}
              >
                #{tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ARTICLES ── */}
        <section className="tn-articles">
          <div className="tn-articles__header">
            <TrendingUp size={18} strokeWidth={2.5} color="#e60000" />
            <h2 className="tn-articles__title">
              {activeTagSlug === "all"
                ? "Top Trending Articles"
                : `Trending: #${trendingTags.find((t) => t.slug === activeTagSlug)?.label ?? activeTagSlug}`}
            </h2>
            <span className="tn-articles__count">{filteredArticles.length} articles</span>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="tn-empty">
              <TrendingUp size={36} />
              <p>No articles found for this tag yet.</p>
            </div>
          ) : (
            <div className="tn-article-list">
              {filteredArticles.map((a, i) => (
                <article
                  className="tn-article"
                  key={a.id}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {/* Rank */}
                  <div className="tn-article__rank">
                    <span>{i + 1}</span>
                  </div>

                  {/* Image */}
                  <div className="tn-article__img-wrap">
                    <img src={a.img} alt={a.title} className="tn-article__img" />
                  </div>

                  {/* Body */}
                  <div className="tn-article__body">
                    <h3 className="tn-article__title">{a.title}</h3>
                    <div className="tn-article__meta">
                      <div className="tn-article__tags">
                        {a.tags.slice(0, 2).map((slug) => {
                          const tagObj = trendingTags.find((t) => t.slug === slug);
                          return tagObj ? (
                            <span key={slug} className="tn-tag">
                              #{tagObj.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                      <span className="tn-article__time">
                        <Clock size={11} />
                        {a.trend}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="tn-article__stats">
                    <div className="tn-article__stat">
                      <Eye size={13} />
                      <span className="tn-article__stat-value">{a.views}</span>
                      <span className="tn-article__stat-label">Views</span>
                    </div>
                    <div className="tn-article__stat">
                      <Share2 size={13} />
                      <span className="tn-article__stat-value">{a.shares}</span>
                      <span className="tn-article__stat-label">Shares</span>
                    </div>
                    <div className="tn-article__stat">
                      <MessageSquare size={13} />
                      <span className="tn-article__stat-value">{a.comments}</span>
                      <span className="tn-article__stat-label">Comments</span>
                    </div>
                  </div>

                  {/* Score + Growth */}
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
                      {a.positive ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                      {a.growth}%
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}