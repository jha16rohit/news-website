import React, { useState, useEffect, useCallback } from "react";
import "./BreakingNews.css";
import { useNavigate } from "react-router-dom";
import {
   Clock, Eye, TrendingUp, Search, ChevronDown,
  ExternalLink, MoreHorizontal, ChevronDown as LoadMoreIcon,
  Radio, Edit, Trash2, XCircle,
} from "lucide-react";
import {
  // Breaking News must see every status (DRAFT/SCHEDULED/PUBLISHED/etc.),
  // not just PUBLISHED — otherwise a scheduled breaking article never shows
  // up here at all, even though the "Scheduled" stat/filter expects it to.
  // Use the same admin-only endpoint AllNews.tsx and Livestories.tsx use,
  // so all three pages agree on what breaking articles exist and their state.
  fetchBreakingNewsHistory,
  deleteNews as apiDeleteNews,
  removeBreakingStatus,
} from "../../../api/news";
// import { useNewsEvent, useNewsSubscription } from "../../../context/newscontext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BreakingItem {
  id:       string;
  localId:  number;
  headline: string;
  author:   string;
  timeAgo:  string;
  status:   "live" | "scheduled" | "expired" | "removed";
  isPastBreaking?: boolean;
  canChangeStatus?: boolean;
  canManage?: boolean;
  category: string;
  views:    number;
}

const statusOptions = ["All Status", "Live", "Scheduled", "Expired", "Removed"];

// ─── helpers ──────────────────────────────────────────────────────────────────
function toRelative(isoStr?: string | null): string {
  if (!isoStr) return "—";
  const diff = Date.now() - new Date(isoStr).getTime();
  if (diff < 60_000)     return "Just now";
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(isoStr).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function deriveStatus(
  apiStatus: string,
  expiryTime?: string | null,
): BreakingItem["status"] {
  if (apiStatus === "SCHEDULED") return "scheduled";
  if (expiryTime && new Date(expiryTime) < new Date()) return "expired";
  return "live";
}

// ─── Component ────────────────────────────────────────────────────────────────
const BreakingNews: React.FC = () => {
  const navigate = useNavigate();
  // const { dispatch } = useNewsEvent();

  // Re-fetch whenever another page changes a news item
  // useNewsSubscription(() => { loadData(); });

  const [items, setItems]           = useState<BreakingItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [visibleCount, setVisibleCount] = useState(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [openMenuId, setOpenMenuId]     = useState<string | null>(null);
  const [deleteModal, setDeleteModal]   = useState<string | null>(null);
  const [removeModal, setRemoveModal]   = useState<string | null>(null);

  const itemsPerPage = 7;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchBreakingNewsHistory();

      if (!data?.news) {
        setItems([]);
        return;
      }

      const mapped = data.news.map((n: any, idx: number) => {
        const isPastBreaking = Boolean(n.isPastBreaking);

        return {
          id: n.id,
          localId: idx + 1,
          headline: n.headline,
          author: n.authorId?.name || "Admin",
          timeAgo: isPastBreaking
            ? toRelative(n.breakingRemovedAt)
            : toRelative(n.publishedAt || n.createdAt),
          status: isPastBreaking
            ? "removed"
            : deriveStatus(n.status, n.expiryTime),
          category: n.categoryId?.name || "General",
          views: n.views ?? 0,
          isPastBreaking,
          canChangeStatus: Boolean(n.canChangeStatus),
          canManage: Boolean(n.canManage),
        };
      });

      setItems(mapped);
    } catch (err) {
      console.error("Failed to fetch Breaking News history:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Reset how many items are shown whenever the search/filter changes
  useEffect(() => { setVisibleCount(itemsPerPage); }, [searchQuery, statusFilter]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeItems     = items.filter(n => !n.isPastBreaking);
  const liveCount      = activeItems.filter(n => n.status === "live").length;
  const scheduledCount = activeItems.filter(n => n.status === "scheduled").length;
  const totalViews     = items.reduce((sum, n) => sum + n.views, 0);
  const avgEngagement  = "+24%";

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredNews = items.filter(news => {
    const matchesSearch = news.headline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || news.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const currentNews  = filteredNews.slice(0, visibleCount);
  const hasMore      = visibleCount < filteredNews.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + itemsPerPage, filteredNews.length));
  };

  const formatNumber = (num: number) => num.toLocaleString();

  const getStatusClass = (status: string) => {
    switch (status) {
      case "live":      return "bn-status-live";
      case "scheduled": return "bn-status-scheduled";
      case "expired":   return "bn-status-expired";
      case "removed":   return "bn-status-expired";
      default:          return "";
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleMenuAction = (action: string, id: string) => {
    const item = items.find(n => n.id === id);

    setOpenMenuId(null);

    if (!item || item.isPastBreaking) return;

    switch (action) {
      case "edit":
        // Editors do not get edit access for Breaking News.
        if (!item.canManage) return;
        navigate(`/admin/create?edit=${id}&type=breaking`);
        break;

      case "remove":
        // Only Admin receives canManage for an active Breaking article.
        if (!item.canManage) return;
        setRemoveModal(id);
        break;

      case "delete":
        if (!item.canManage) return;
        setDeleteModal(id);
        break;
    }
  };

  const confirmRemove = async () => {
    if (!removeModal) return;

    try {
      await removeBreakingStatus(removeModal);
      setRemoveModal(null);
      await loadData();
    } catch (err: any) {
      console.error("Remove breaking failed:", err);
      alert(err?.message || "Failed to remove Breaking News status");
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    try {
      await apiDeleteNews(deleteModal);
      setDeleteModal(null);
      await loadData();
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert(err?.message || "Failed to delete article");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="bn-container"
      onClick={() => { setOpenMenuId(null); setIsStatusOpen(false); }}
    >
      {/* HEADER */}
      <div className="bn-header">
        <div className="bn-header-left">
          <div>
            <h1 className="bn-title">Breaking News</h1>
            <p className="bn-subtitle">Manage live breaking news and view past Breaking News</p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="bn-stats">
        <div className="bn-stat-card">
          <div className="bn-stat-info">
            <div className="bn-stat-icon"><Radio size={20} /></div>
            <div className="bn-stat-label">Live Now</div>
          </div>
          <div className="bn-stat-number">{liveCount}</div>
        </div>
        <div className="bn-stat-card">
          <div className="bn-stat-info">
            <div className="bn-stat-icon"><Clock size={20} /></div>
            <div className="bn-stat-label">Scheduled</div>
          </div>
          <div className="bn-stat-number">{scheduledCount}</div>
        </div>
        <div className="bn-stat-card">
          <div className="bn-stat-info">
            <div className="bn-stat-icon"><Eye size={20} /></div>
            <div className="bn-stat-label">Total Views</div>
          </div>
          <div className="bn-stat-number">{formatNumber(totalViews)}</div>
        </div>
        <div className="bn-stat-card">
          <div className="bn-stat-info">
            <div className="bn-stat-icon"><TrendingUp size={20} /></div>
            <div className="bn-stat-label">Avg Engagement</div>
          </div>
          <div className="bn-stat-number bn-stat-positive">{avgEngagement}</div>
        </div>
      </div>

      {/* CURRENTLY LIVE */}
      <div className="bn-live-section">
        <div className="bn-live-header">
          <div className="bn-live-indicator" />
          <h2>Currently Live</h2>
        </div>
        <div className="bn-live-list">
          {items.filter(n => n.status === "live").slice(0, 3).map(news => (
            <div key={news.id} className="bn-live-item">
              <span className="bn-live-title" title={news.headline}>{news.headline}</span>
              <div className="bn-live-meta">
                <span className="bn-live-views"><Eye size={14} />{formatNumber(news.views)}</span>
                <span className="bn-live-time"><Clock size={14} />{news.timeAgo}</span>
                <button
                  className="bn-live-link"
                  onClick={() => {
                    if (news.canManage) {
                      navigate(`/admin/create?edit=${news.id}&type=breaking`);
                    }
                  }}
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}
          {liveCount === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
              {loading ? "Loading…" : "No breaking news currently live"}
            </div>
          )}
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bn-controls" onClick={e => e.stopPropagation()}>
        <div className="bn-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search breaking news..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="bn-filters">
          <div className="bn-filter-dropdown-custom">
            <div className="bn-filter-selected" onClick={() => setIsStatusOpen(!isStatusOpen)}>
              {statusFilter} <ChevronDown size={16} />
            </div>
            {isStatusOpen && (
              <div className="bn-filter-menu">
                {statusOptions.map(opt => (
                  <div
                    key={opt}
                    className={`bn-filter-item ${statusFilter === opt ? "active" : ""}`}
                    onClick={() => { setStatusFilter(opt); setIsStatusOpen(false); }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bn-table-container">
        <table className="bn-table">
          <thead>
            <tr>
              <th className="bn-th-headline">Headline</th>
              <th className="bn-th-status">Status</th>
              <th className="bn-th-category">Category</th>
              <th className="bn-th-views">Views</th>
              <th className="bn-th-actions">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "14px" }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && currentNews.map(news => (
              <tr key={news.id} className="bn-table-row">
                <td className="bn-td-headline">
                  <div className="bn-headline-content">
                    <div className="bn-headline-title">{news.headline}</div>
                    <div className="bn-headline-meta">By {news.author} • {news.timeAgo}</div>
                  </div>
                </td>
                <td className="bn-td-status">
                  <span className={`bn-badge ${getStatusClass(news.status)}`}>
                    {news.status === "live"      && <div className="bn-status-dot" />}
                    {news.status === "scheduled" && <Clock size={12} />}
                    {news.status === "removed" && <XCircle size={12} />}
                    {news.status === "removed" ? "Removed" : news.status}
                  </span>
                </td>
                <td className="bn-td-category">{news.category}</td>
                <td className="bn-td-views">{formatNumber(news.views)}</td>
                <td className="bn-td-actions" onClick={e => e.stopPropagation()}>
                  {!news.isPastBreaking && news.canManage ? (
                    <div className="bn-action-wrapper">
                      <button
                        className="bn-action-btn"
                        onClick={() => setOpenMenuId(openMenuId === news.id ? null : news.id)}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openMenuId === news.id && (
                        <div className="bn-action-menu">
                          <button onClick={() => handleMenuAction("edit", news.id)}>
                            <Edit size={16} /> Edit
                          </button>

                          <button onClick={() => handleMenuAction("remove", news.id)}>
                            <XCircle size={16} /> Remove Breaking
                          </button>

                          <div className="bn-menu-divider" />

                          <button
                            className="bn-delete"
                            onClick={() => handleMenuAction("delete", news.id)}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && currentNews.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "14px" }}>
                  No breaking news found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LOAD MORE */}
      {filteredNews.length > 0 && (
        <div className="bn-load-more-wrap">
          <div className="bn-pagination-info">
            Showing {currentNews.length} of {filteredNews.length} items
          </div>
          {hasMore && (
            <button className="bn-load-more-btn" onClick={handleLoadMore}>
              Load More News <LoadMoreIcon size={16} />
            </button>
          )}
        </div>
      )}

      {/* REMOVE BREAKING MODAL */}
      {removeModal !== null && (
        <div className="modal-overlay" onClick={() => setRemoveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon modal-icon--warning">
              <XCircle size={22} />
            </div>
            <h4>Remove Breaking Status?</h4>
            <p>This article will no longer appear as Breaking News. It will remain published as a standard article.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setRemoveModal(null)}>Cancel</button>
              <button className="modal-confirm modal-confirm--warning" onClick={confirmRemove}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal !== null && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <Trash2 size={22} />
            </div>
            <h4>Delete Article?</h4>
            <p>This action cannot be undone. The article will be permanently removed.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="modal-confirm" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakingNews;