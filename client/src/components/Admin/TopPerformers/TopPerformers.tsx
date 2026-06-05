import { useState, useEffect, useCallback } from "react";
import "./TopPerformers.css";
import { TrendingUp, Eye, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { fetchTopArticles } from "../../../api/analytics";

// ── Types ──────────────────────────────────────────────────────────────────
interface TopArticle {
  rank:     number;
  title:    string;
  views:    string;   // formatted: "234K"
  time:     string;   // avg read time: "4 min"
  growth:   string;   // "+45%"
  newsId:   string;
}

interface RawTopArticle {
  newsId:        string;
  title:         string;
  views:         number;
  avgReadTime:   number;   // seconds
  growthPercent: number;   // e.g. 45
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function formatReadTime(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} min`;
}

function formatGrowth(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${Math.round(pct)}%`;
}

function normalize(raw: RawTopArticle, index: number): TopArticle {
  return {
    rank:   index + 1,
    newsId: raw.newsId,
    title:  raw.title,
    views:  formatViews(raw.views),
    time:   formatReadTime(raw.avgReadTime ?? 0),
    growth: formatGrowth(raw.growthPercent ?? 0),
  };
}

// ── Skeleton ───────────────────────────────────────────────────────────────
const SkeletonItem = () => (
  <div className="tp-item tp-item--skeleton">
    <div className="tp-left">
      <div className="tp-rank tp-rank--skeleton" />
      <div className="tp-content">
        <div className="tp-skeleton-line tp-skeleton-title" />
        <div className="tp-skeleton-line tp-skeleton-meta" />
      </div>
    </div>
  </div>
);

// ── Range options ──────────────────────────────────────────────────────────
const RANGES = [
  { label: "Today",   value: 1  },
  { label: "7 days",  value: 7  },
  { label: "30 days", value: 30 },
];

// ── Component ──────────────────────────────────────────────────────────────
const TopPerformers = () => {
  const [articles, setArticles] = useState<TopArticle[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [range,    setRange]    = useState(1);

  const load = useCallback(async (r: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTopArticles(r, 5);
      // Support { articles: [...] } or a bare array
      const raw: RawTopArticle[] = Array.isArray(data) ? data : (data.articles ?? []);
      setArticles(raw.map(normalize));
    } catch {
      setError("Could not load top performers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  return (
    <div className="top-performers">
      {/* HEADER */}
      <div className="tp-header">
        <div className="tp-title">
          <TrendingUp size={20} />
          <h3>Top Performers</h3>
        </div>
        <p>Highest performing articles</p>
      </div>

      {/* RANGE TABS */}
      <div className="tp-range-tabs">
        {RANGES.map((r) => (
          <button
            key={r.value}
            className={`tp-range-btn${range === r.value ? " tp-range-btn--active" : ""}`}
            onClick={() => setRange(r.value)}
            disabled={loading}
          >
            {r.label}
          </button>
        ))}

        <button
          className="tp-refresh-btn"
          onClick={() => load(range)}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "tp-spinning" : ""} />
        </button>
      </div>

      {/* CONTENT */}
      {error ? (
        <div className="tp-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => load(range)}>Retry</button>
        </div>
      ) : (
        <div className="tp-list">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
            : articles.length === 0
            ? <p className="tp-empty">No data available for this period.</p>
            : articles.map((item) => (
                <div key={item.newsId} className="tp-item">
                  <div className="tp-left">
                    <div className={`tp-rank${item.rank <= 3 ? ` tp-rank--top${item.rank}` : ""}`}>
                      {item.rank}
                    </div>

                    <div className="tp-content">
                      <h4>{item.title}</h4>

                      <div className="tp-meta">
                        <span><Eye size={14} /> {item.views}</span>
                        <span><Clock size={14} /> {item.time}</span>
                        <span className={`tp-growth${parseFloat(item.growth) < 0 ? " tp-growth--negative" : ""}`}>
                          {parseFloat(item.growth) >= 0 ? "↑" : "↓"} {item.growth}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
};

export default TopPerformers;