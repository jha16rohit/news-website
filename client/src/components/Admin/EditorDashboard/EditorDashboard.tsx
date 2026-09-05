import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  CalendarDays,
  TrendingUp,
  Eye,
  Clock3,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import "./EditorDashboard.css";
import { fetchAdminNews, deleteNews } from "../../../api/news";
import { getMe } from "../../../api/auth";
import { fetchEditorTrafficChart } from "../../../api/analytics";
import Preloader from "../Preloader/Preloder";

type Period = "today" | "7days" | "30days";

interface Article {
  id: string;
  title: string;
  category: string;
  status: "Published" | "Draft" | "Scheduled";
  views: number;
  publishedAt: string;
  trendToday: number;
  trend7Days: number;
  trend30Days: number;
  authorId: string;
}

interface TrafficPoint {
  label: string;
  views: number;
  uniqueVisitors: number;
}

const EditorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [trendPeriod, setTrendPeriod] = useState<Period>("today");
  const [viewPeriod, setViewPeriod] = useState<Period>("today");
  const [visibleArticles, setVisibleArticles] = useState(7);

  const [articles, setArticles] = useState<Article[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [trafficData, setTrafficData] = useState<TrafficPoint[]>([]);
  const [trafficLoading, setTrafficLoading] = useState(false);

  const [deleteModal, setDeleteModal] = useState<Article | null>(null);
  const [deleteModeChoice, setDeleteModeChoice] =
    useState<"instant" | "interval">("instant");

  // ── Load Editor articles ───────────────────────────────────────────────────

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const meResponse = await getMe();

        const userId = String(meResponse.user.id);
        

        setCurrentUserId(userId);

        const newsResponse = await fetchAdminNews({
          page: 1,
          limit: 100,
        });

        const newsList = Array.isArray(newsResponse.news)
          ? newsResponse.news
          : [];

        const mappedArticles: Article[] = newsList
          .map((news: any) => {
            const authorId = String(
  typeof news.authorId === "object"
    ? news.authorId?._id ?? news.authorId?.id ?? ""
    : news.authorId ?? ""
);
            let status: Article["status"];

            if (news.status === "PUBLISHED") {
              status = "Published";
            } else if (news.status === "SCHEDULED") {
              status = "Scheduled";
            } else {
              status = "Draft";
            }

            const publishedDate =
              news.publishedAt || news.createdAt || news.scheduledAt;

            return {
              id: String(news.id || news._id),
              title: news.headline || "Untitled Article",
              category:
                news.categoryId?.name ||
                news.category ||
                "Uncategorized",
              status,
              views: Number(news.views || 0),
              publishedAt: publishedDate
                ? new Date(publishedDate).toLocaleString()
                : "-",
              trendToday: Number(news.views || 0),
              trend7Days: Number(news.views || 0),
              trend30Days: Number(news.views || 0),
              authorId,
            };
          })
          .filter(
  (article: Article) =>
    article.authorId.trim().toLowerCase() ===
    userId.trim().toLowerCase()
);

        setArticles(mappedArticles);
      } catch (error) {
        console.error("EDITOR DASHBOARD ERROR:", error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // ── Load real Editor traffic analytics ─────────────────────────────────────

  useEffect(() => {
    const loadTraffic = async () => {
      try {
        setTrafficLoading(true);

        const range =
          viewPeriod === "today"
            ? 1
            : viewPeriod === "7days"
            ? 7
            : 30;

        const response = await fetchEditorTrafficChart(range);

        const chart = Array.isArray(response?.chart)
          ? response.chart
          : [];

        setTrafficData(chart);
      } catch (error) {
        console.error("EDITOR TRAFFIC ERROR:", error);
        setTrafficData([]);
      } finally {
        setTrafficLoading(false);
      }
    };

    loadTraffic();
  }, [viewPeriod]);

  const totalArticles = articles.length;

  const todayPosts = articles.filter((article) => {
    if (!article.publishedAt || article.publishedAt === "-") {
      return false;
    }

    const date = new Date(article.publishedAt);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }).length;

  const trendingArticles = useMemo(() => {
    const key =
      trendPeriod === "today"
        ? "trendToday"
        : trendPeriod === "7days"
        ? "trend7Days"
        : "trend30Days";

    return [...articles]
      .sort((a, b) => b[key] - a[key])
      .slice(0, 5);
  }, [articles, trendPeriod]);

  const totalViews = articles.reduce(
    (total, article) => total + article.views,
    0
  );

  const visibleRecentArticles = articles.slice(0, visibleArticles);

  // ── Real graph values ──────────────────────────────────────────────────────

  const graphValues = useMemo(() => {
    return trafficData.map((point) => Number(point.views || 0));
  }, [trafficData]);

  const graphLabels = useMemo(() => {
    return trafficData.map((point) => point.label);
  }, [trafficData]);

  const graphMax = useMemo(() => {
    if (graphValues.length === 0) return 1;

    const max = Math.max(...graphValues);

    return max > 0 ? max : 1;
  }, [graphValues]);

  const graphMin = useMemo(() => {
    if (graphValues.length === 0) return 0;

    return Math.min(...graphValues);
  }, [graphValues]);

  const createGraphPoints = () => {
    if (graphValues.length === 0) {
      return "";
    }

    if (graphValues.length === 1) {
      return "500,140";
    }

    const width = 1000;
    const height = 280;
    const padding = 24;

    const max = graphMax;
    const min = graphMin;

    return graphValues
      .map((value, index) => {
        const x =
          padding +
          (index / (graphValues.length - 1)) *
            (width - padding * 2);

        const y =
          height -
          padding -
          ((value - min) / Math.max(max - min, 1)) *
            (height - padding * 2);

        return `${x},${y}`;
      })
      .join(" ");
  };

  const formatYAxisValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }

    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }

    return String(Math.round(value));
  };

  const graphYAxis = useMemo(() => {
    const max = graphMax;

    return [
      max,
      max * (5 / 6),
      max * (4 / 6),
      max * (3 / 6),
      max * (2 / 6),
      max * (1 / 6),
      0,
    ];
  }, [graphMax]);

  const handleEdit = (article: Article) => {
    navigate(`/editor/create?edit=${article.id}&type=standard`);
  };

  const handleView = (article: Article) => {
    window.open(
      `/article/${article.id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDelete = (article: Article) => {
    setDeleteModal(article);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    try {
      await deleteNews(deleteModal.id, {
        deleteMode: deleteModeChoice,
        ...(deleteModeChoice === "interval"
          ? { deleteIntervalDays: 14 }
          : {}),
      });

      setArticles((prev) =>
        prev.filter((article) => article.id !== deleteModal.id)
      );

      setDeleteModal(null);
    } catch (error) {
      console.error("DELETE ARTICLE ERROR:", error);
    }
  };

  if (loading) {
    return <Preloader />;
  }

  return (
    <div className="editor-dashboard">
      {/* HEADER */}
      <div className="editor-dashboard-header">
        <div>
          <h1>Editor Dashboard</h1>
          <p>Track your articles, views, and content performance.</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="editor-dashboard-stats">
        <div className="editor-dashboard-stat-card">
          <div className="editor-stat-icon">
            <FileText size={20} />
          </div>

          <div>
            <span>Total Articles</span>
            <strong>{totalArticles}</strong>
          </div>
        </div>

        <div className="editor-dashboard-stat-card">
          <div className="editor-stat-icon today">
            <CalendarDays size={20} />
          </div>

          <div>
            <span>Today's Posts</span>
            <strong>{todayPosts}</strong>
          </div>
        </div>

        <div className="editor-dashboard-stat-card">
          <div className="editor-stat-icon trending">
            <TrendingUp size={20} />
          </div>

          <div>
            <span>Trending Articles</span>
            <strong>{trendingArticles.length}</strong>
          </div>
        </div>

        <div className="editor-dashboard-stat-card">
          <div className="editor-stat-icon views">
            <Eye size={20} />
          </div>

          <div>
            <span>Total Views</span>
            <strong>{totalViews.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* TRENDING ARTICLES */}
      <section className="dashboard-section">
        <div className="a-section-header">
          <div>
            <h2>Trending Articles</h2>
            <p>Your top performing articles</p>
          </div>

          <div className="period-selector">
            {(["today", "7days", "30days"] as Period[]).map((period) => (
              <button
                key={period}
                className={trendPeriod === period ? "active" : ""}
                onClick={() => setTrendPeriod(period)}
              >
                {period === "today"
                  ? "Today"
                  : period === "7days"
                  ? "7 Days"
                  : "30 Days"}
              </button>
            ))}
          </div>
        </div>

        <div className="trending-list">
          {trendingArticles.map((article, index) => {
            const views =
              trendPeriod === "today"
                ? article.trendToday
                : trendPeriod === "7days"
                ? article.trend7Days
                : article.trend30Days;

            return (
              <div className="trending-row" key={article.id}>
                <div className="trending-rank">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="trending-content">
                  <h3>{article.title}</h3>

                  <div className="trending-meta">
                    <span>{article.category}</span>
                    <span>•</span>
                    <span>{article.status}</span>
                  </div>
                </div>

                <div className="trending-views">
                  <Eye size={15} />
                  <strong>{views.toLocaleString()}</strong>
                  <span>views</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* VIEWS GRAPH */}
      <section className="dashboard-section views-section">
        <div className="a-section-header">
          <div>
            <h2>Views</h2>
            <p>Views generated by your articles</p>
          </div>

          <div className="period-selector">
            {(["today", "7days", "30days"] as Period[]).map((period) => (
              <button
                key={period}
                className={viewPeriod === period ? "active" : ""}
                onClick={() => setViewPeriod(period)}
              >
                {period === "today"
                  ? "Today"
                  : period === "7days"
                  ? "7 Days"
                  : "30 Days"}
              </button>
            ))}
          </div>
        </div>

        <div className="views-chart">
          <div className="chart-y-axis">
            {graphYAxis.map((value, index) => (
              <span key={index}>
                {formatYAxisValue(value)}
              </span>
            ))}
          </div>

          <div className="chart-area">
            <div className="chart-grid">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            {trafficLoading ? (
              <div
                style={{
                  height: "280px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                Loading views...
              </div>
            ) : graphValues.length === 0 ? (
              <div
                style={{
                  height: "280px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                No views recorded for this period.
              </div>
            ) : (
              <svg
                className="views-svg"
                viewBox="0 0 1000 280"
                preserveAspectRatio="none"
              >
                <polyline
                  points={createGraphPoints()}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            <div className="chart-x-axis">
              {graphLabels.map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RECENT ARTICLES */}
      <section className="dashboard-section recent-section">
        <div className="a-section-header">
          <div>
            <h2>Recent Articles</h2>
            <p>Your latest created articles</p>
          </div>

          <span className="recent-count">
            {articles.length} Articles
          </span>
        </div>

        <div className="recent-articles-table-wrapper">
          <table className="recent-articles-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Category</th>
                <th>Status</th>
                <th>Views</th>
                <th>Published</th>
                <th className="recent-actions-heading">Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleRecentArticles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <div className="recent-article-title">
                      <strong>{article.title}</strong>
                    </div>
                  </td>

                  <td>
                    <span className="recent-category">
                      {article.category}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`recent-status ${article.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {article.status}
                    </span>
                  </td>

                  <td>
                    <div className="recent-views">
                      <Eye size={14} />
                      {article.views.toLocaleString()}
                    </div>
                  </td>

                  <td>
                    <div className="recent-date">
                      <Clock3 size={14} />
                      {article.publishedAt}
                    </div>
                  </td>

                  <td>
                    <div className="recent-actions">
                      <button
                        className="recent-action-btn"
                        onClick={() => handleView(article)}
                        
                      >
                        <ExternalLink size={16} />
                      </button>

                      {article.authorId === currentUserId && (
                        <>
                          <button
                            className="recent-action-btn"
                            onClick={() => handleEdit(article)}
                            
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            className="recent-action-btn delete"
                            onClick={() => handleDelete(article)}
                            
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleArticles < articles.length && (
          <div className="load-more-wrapper">
            <button
              className="load-more-btn"
              onClick={() =>
                setVisibleArticles((prev) =>
                  Math.min(prev + 7, articles.length)
                )
              }
            >
              Load More
              <ChevronDown size={17} />
            </button>
          </div>
        )}
      </section>

      {/* DELETE MODAL */}
      {deleteModal !== null && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">
              <Trash2 size={22} />
            </div>

            <h4>Delete Article?</h4>

            <p style={{ marginBottom: 12 }}>
              Choose how to delete this article:
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  border:
                    deleteModeChoice === "instant"
                      ? "2px solid #dc2626"
                      : "1px solid #e5e7eb",
                  borderRadius: 8,
                  cursor: "pointer",
                  background:
                    deleteModeChoice === "instant"
                      ? "#fff1f1"
                      : "#fafafa",
                }}
              >
                <input
                  type="radio"
                  name="deleteMode"
                  value="instant"
                  checked={deleteModeChoice === "instant"}
                  onChange={() => setDeleteModeChoice("instant")}
                  style={{ marginTop: 2 }}
                />

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Instant Delete
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Permanently removed right now.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  border:
                    deleteModeChoice === "interval"
                      ? "2px solid #f59e0b"
                      : "1px solid #e5e7eb",
                  borderRadius: 8,
                  cursor: "pointer",
                  background:
                    deleteModeChoice === "interval"
                      ? "#fffbeb"
                      : "#fafafa",
                }}
              >
                <input
                  type="radio"
                  name="deleteMode"
                  value="interval"
                  checked={deleteModeChoice === "interval"}
                  onChange={() => setDeleteModeChoice("interval")}
                  style={{ marginTop: 2 }}
                />

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Delete After 14 Days
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Hidden now, permanently purged in 14 days.
                  </div>
                </div>
              </label>
            </div>

            <div className="modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setDeleteModal(null)}
              >
                Cancel
              </button>

              <button
                className="modal-confirm"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorDashboard;