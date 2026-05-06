import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp, Eye, Share2, MessageSquare, Clock,
  ArrowUp, ArrowDown, Tag, BarChart2, ChevronDown,
  Check, Flame, Loader2, AlertCircle,
} from "lucide-react";
import "./Trendingnews.css";
import { getTrendingTags, type Tag as TagType } from "../../../api/tags.api";
import { fetchAllNews, type StatusEnum } from "../../../api/news";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface ArticleTag {
  id: string; name: string; slug: string;
}

interface FilterTag extends ArticleTag {
  articleCount:    number;   // articles using this tag
  isAdminTrending: boolean;  // admin-pinned via Tags panel
}

interface Article {
  id: string; title: string; tags: ArticleTag[];
  trend: string; views: number; shares: string; comments: number;
  score: number; growth: number; positive: boolean;
  img: string | null; publishedAt: string | null;
}

const TIME_RANGES = ["Last Hour", "Last 6 Hours", "Last 24 Hours", "Last 7 Days"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeSince(iso: string | null): string {
  if (!iso) return "—";
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m on trend`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h ${diffMin % 60}m on trend`;
  return `${Math.floor(diffHr / 24)}d on trend`;
}

function calcScore(views: number, maxViews: number): number {
  if (maxViews === 0) return 0;
  return Math.round((views / maxViews) * 100);
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function TrendingNews() {
  const [adminTrendingSlugs, setAdminTrendingSlugs] = useState<Set<string>>(new Set());
  const [articles,           setArticles]           = useState<Article[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState<string | null>(null);
  const [activeTagSlug,      setActiveTagSlug]      = useState<string>("all");
  const [timeRange,          setTimeRange]          = useState("Last 24 Hours");
  const [dropdownOpen,       setDropdownOpen]       = useState(false);

  // ── Load admin-pinned trending tags (just for flame badge) ─────────────────
  const loadTrendingTags = useCallback(async () => {
    try {
      const tags: TagType[] = await getTrendingTags();
      setAdminTrendingSlugs(new Set(tags.map((t) => t.slug)));
    } catch (e) {
      console.error("Failed to load trending tags:", e);
    }
  }, []);

  // ── Load all published news ────────────────────────────────────────────────
  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllNews({ status: "PUBLISHED" as StatusEnum, limit: 100 });

      // Backend returns { news: [...], total, page, pages }
      const raw: any[] = Array.isArray(res)
        ? res
        : (res?.news ?? res?.articles ?? res?.data ?? []);

      if (!Array.isArray(raw)) { setArticles([]); return; }

      const maxViews = Math.max(...raw.map((a: any) => a.views ?? 0), 1);

      const mapped: Article[] = raw.map((a: any, i: number) => ({
        id:    a.id,
        title: a.headline || a.title || "Untitled",
        // Normalize tag shape — backend may return NewsTag[] with nested tag object
        tags: (a.tags ?? []).reduce((acc: ArticleTag[], nt: any) => {
          const id   = nt.tag?.id   ?? nt.id   ?? "";
          const name = nt.tag?.name ?? nt.name ?? "";
          const slug = nt.tag?.slug ?? nt.slug ?? "";
          if (id && name && slug) acc.push({ id, name, slug });
          return acc;
        }, []),
        trend:       timeSince(a.publishedAt ?? a.createdAt),
        views:       a.views ?? 0,
        shares:      "—",
        comments:    0,
        score:       calcScore(a.views ?? 0, maxViews),
        growth:      Math.max(1, Math.round(((50 - i) / 50) * 25)),
        positive:    i < raw.length * 0.75,
        img:         a.featuredImage ?? null,
        publishedAt: a.publishedAt  ?? a.createdAt ?? null,
      }));

      mapped.sort((a, b) => b.views - a.views);
      setArticles(mapped);
    } catch (e: any) {
      console.error("Failed to load news:", e);
      setError("Could not load articles. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrendingTags();
    loadArticles();
  }, [loadTrendingTags, loadArticles]);

  // ── Derive filter tags from ALL articles (not just admin-pinned) ───────────
  // Count usage per tag, then: admin-trending first → sort by article count desc
  const filterTags = useMemo((): FilterTag[] => {
    const map = new Map<string, FilterTag>();

    for (const article of articles) {
      for (const tag of article.tags) {
        if (!tag.slug) continue;
        const existing = map.get(tag.slug);
        if (existing) {
          existing.articleCount += 1;
        } else {
          map.set(tag.slug, {
            ...tag,
            articleCount:    1,
            isAdminTrending: adminTrendingSlugs.has(tag.slug),
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.isAdminTrending && !b.isAdminTrending) return -1;
      if (!a.isAdminTrending && b.isAdminTrending)  return 1;
      return b.articleCount - a.articleCount;
    });
  }, [articles, adminTrendingSlugs]);

  // ── Filtered articles ──────────────────────────────────────────────────────
  const filteredArticles = useMemo(() =>
    activeTagSlug === "all"
      ? articles
      : articles.filter((a) => a.tags.some((t) => t.slug === activeTagSlug)),
    [articles, activeTagSlug]
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalViews = filteredArticles.reduce((acc, a) => acc + a.views, 0);
  const avgGrowth  = filteredArticles.length > 0
    ? Math.round(filteredArticles.reduce((acc, a) => acc + a.growth, 0) / filteredArticles.length)
    : 0;

  const activeTagLabel = activeTagSlug === "all"
    ? null
    : filterTags.find((t) => t.slug === activeTagSlug)?.name ?? activeTagSlug;

  return (
    <div className="tn-root">
      <div className="tn-container">

        {/* ── HEADER ── */}
        <header className="tn-header">
          <div className="tn-header__left">
            <div className="tn-header__icon"><TrendingUp size={22} /></div>
            <div>
              <h1 className="tn-title">Trending News</h1>
              <p className="tn-subtitle">Real-time trending articles based on engagement metrics</p>
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
              <ChevronDown size={14} className={`tn-chevron ${dropdownOpen ? "tn-chevron--open" : ""}`} />
            </button>

            {dropdownOpen && (
              <ul className="tn-dropdown-menu" role="listbox">
                {TIME_RANGES.map((t) => (
                  <li
                    key={t} role="option" aria-selected={timeRange === t}
                    className={`tn-dropdown-item ${timeRange === t ? "tn-dropdown-item--active" : ""}`}
                    onClick={() => { setTimeRange(t); setDropdownOpen(false); }}
                  >
                    {timeRange === t && <Check size={12} />}
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        {/* ── ERROR BANNER ── */}
        {error && (
          <div className="tn-error-banner">
            <AlertCircle size={16} /><span>{error}</span>
            <button onClick={loadArticles}>Retry</button>
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div className="tn-stats">
          {[
            { icon: <Flame size={18} />,    cls: "orange", val: loading ? null : filteredArticles.length, label: "Trending Now"  },
            { icon: <Eye size={18} />,      cls: "blue",   val: loading ? null : formatNum(totalViews),   label: "Total Views"  },
            { icon: <Share2 size={18} />,   cls: "green",  val: "—",                                      label: "Total Shares" },
            { icon: <BarChart2 size={18} />,cls: "purple", val: loading ? null : `+${avgGrowth}%`,        label: "Avg. Growth"  },
          ].map(({ icon, cls, val, label }) => (
            <div className="tn-stat-card" key={label}>
              <div className={`tn-stat-card__icon tn-stat-card__icon--${cls}`}>{icon}</div>
              <div>
                <div className="tn-stat-value">
                  {val === null ? <Loader2 size={16} className="tn-spin" /> : val}
                </div>
                <div className="tn-stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TAG FILTER BAR ── */}
        <div className="tn-tag-filter-wrap">
          <div className="tn-tag-filter-label">
            <Tag size={14} />
            <span>Filter by Tag</span>
            {!loading && filterTags.length > 0 && (
              <span className="tn-tag-filter-count">{filterTags.length} tags</span>
            )}
          </div>

          <div className="tn-tag-filters">
            <button
              className={`tn-tag-btn ${activeTagSlug === "all" ? "tn-tag-btn--active" : ""}`}
              onClick={() => setActiveTagSlug("all")}
            >
              All Topics
            </button>

            {loading ? (
              <span className="tn-tag-loading"><Loader2 size={13} className="tn-spin" /> Loading tags…</span>
            ) : filterTags.length === 0 ? (
              <span className="tn-tag-empty">No tags in published articles</span>
            ) : (
              filterTags.map((tag) => (
                <button
                  key={tag.slug}
                  title={`${tag.articleCount} article${tag.articleCount !== 1 ? "s" : ""}`}
                  className={[
                    "tn-tag-btn",
                    activeTagSlug === tag.slug  ? "tn-tag-btn--active" : "",
                    tag.isAdminTrending         ? "tn-tag-btn--hot"    : "",
                  ].join(" ")}
                  onClick={() => setActiveTagSlug(tag.slug)}
                >
                  {tag.isAdminTrending && <Flame size={11} className="tn-tag-flame" />}
                  #{tag.name}
                  <span className="tn-tag-pill">{tag.articleCount}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── ARTICLES ── */}
        <section className="tn-articles">
          <div className="tn-articles__header">
            <TrendingUp size={18} strokeWidth={2.5} color="#e60000" />
            <h2 className="tn-articles__title">
              {activeTagSlug === "all" ? "Top Trending Articles" : `Trending: #${activeTagLabel}`}
            </h2>
            <span className="tn-articles__count">{filteredArticles.length} articles</span>
          </div>

          {loading ? (
            <div className="tn-loading-state">
              <Loader2 size={32} className="tn-spin" />
              <p>Loading trending articles…</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="tn-empty">
              <TrendingUp size={36} />
              <p>{activeTagSlug === "all" ? "No published articles found." : `No articles found for #${activeTagLabel}.`}</p>
            </div>
          ) : (
            <div className="tn-article-list">
              {filteredArticles.map((a, i) => (
                <article className="tn-article" key={a.id} style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="tn-article__rank"><span>{i + 1}</span></div>

                  <div className="tn-article__img-wrap">
                    {a.img ? (
                      <img src={a.img} alt={a.title} className="tn-article__img" />
                    ) : (
                      <div className="tn-article__img-placeholder"><TrendingUp size={20} /></div>
                    )}
                  </div>

                  <div className="tn-article__body">
                    <h3 className="tn-article__title">{a.title}</h3>
                    <div className="tn-article__meta">
                      <div className="tn-article__tags">
                        {a.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className={`tn-tag ${activeTagSlug === tag.slug ? "tn-tag--active" : ""}`}
                            onClick={() => setActiveTagSlug(tag.slug)}
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                      <span className="tn-article__time"><Clock size={11} />{a.trend}</span>
                    </div>
                  </div>

                  <div className="tn-article__stats">
                    <div className="tn-article__stat">
                      <Eye size={13} />
                      <span className="tn-article__stat-value">{formatNum(a.views)}</span>
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

                  <div className="tn-article__right">
                    <div className="tn-score-bar">
                      <div className="tn-score-bar__track">
                        <div className="tn-score-bar__fill" style={{ width: `${a.score}%` }} />
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