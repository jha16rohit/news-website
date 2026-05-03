import React, { useState, useEffect, useCallback } from "react";
import "./BreakingNews.css";
import { useNavigate } from "react-router-dom";
import {
  Zap, Clock, Eye, TrendingUp, Search, ChevronDown,
  ExternalLink, MoreHorizontal, ChevronLeft, ChevronRight,
  Radio, Edit, Pause, Trash2, Play,
} from "lucide-react";
import { fetchAllNews, deleteNews as apiDeleteNews, updateNews as apiUpdateNews } from "../../../api/news";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BreakingItem {
  id:       string;
  localId:  number;
  headline: string;
  author:   string;
  timeAgo:  string;
  status:   "live" | "scheduled" | "expired" | "paused";
  category: string;
  views:    number;
}

const statusOptions = ["All Status", "Live", "Scheduled", "Expired", "Paused"];

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
  statusType?: string,
): BreakingItem["status"] {
  if (statusType === "paused") return "paused";
  if (apiStatus === "SCHEDULED") return "scheduled";
  if (expiryTime && new Date(expiryTime) < new Date()) return "expired";
  return "live";
}

// ─── Component ────────────────────────────────────────────────────────────────
const BreakingNews: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems]             = useState<BreakingItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter]   = useState("All Status");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isStatusOpen, setIsStatusOpen]   = useState(false);
  const [openMenuId, setOpenMenuId]       = useState<string | null>(null);
  const [deleteModal, setDeleteModal]     = useState<string | null>(null);

  const itemsPerPage = 7;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllNews({ articleType: "BREAKING", limit: 100 });
      if (!data?.news) {
        setItems([]);
        return;
      }

      const mapped = data.news.map((n: any, idx: number) => ({
        id:       n.id,
        localId:  idx + 1,
        headline: n.headline,
        author:   n.author?.name || "Admin",
        timeAgo:  toRelative(n.publishedAt || n.createdAt),
        status:   deriveStatus(n.status, n.expiryTime, n.statusType),
        category: n.category?.name || "General",
        views:    n.views ?? 0,
      }));

      setItems(mapped);
    } catch (err) {
      console.error("Failed to fetch breaking news:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const liveCount      = items.filter(n => n.status === "live").length;
  const scheduledCount = items.filter(n => n.status === "scheduled").length;
  const totalViews     = items.reduce((sum, n) => sum + n.views, 0);
  const avgEngagement  = "+24%";

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredNews = items.filter(news => {
    const matchesSearch = news.headline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || news.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages  = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, startIndex + itemsPerPage);

  const formatNumber = (num: number) => num.toLocaleString();

  const getStatusClass = (status: string) => {
    switch (status) {
      case "live":      return "bn-status-live";
      case "scheduled": return "bn-status-scheduled";
      case "expired":   return "bn-status-expired";
      case "paused":    return "bn-status-paused";
      default:          return "";
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleMenuAction = async (action: string, id: string) => {
    setOpenMenuId(null);
    const item = items.find(i => i.id === id);

    switch (action) {
      case "edit":
        navigate(`/admin/create?edit=${id}&type=breaking`);
        break;

      case "pause": {
        const isPaused = item?.status === "paused";
        await apiUpdateNews(id, { statusType: isPaused ? "published" : "paused" } as any);
        setItems(prev =>
          prev.map(i => i.id === id ? { ...i, status: isPaused ? "live" : "paused" } : i)
        );
        break;
      }

      case "delete":
        setDeleteModal(id);
        break;
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      await apiDeleteNews(deleteModal);
      setItems(prev => prev.filter(i => i.id !== deleteModal));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteModal(null);
    }
  };

  const handleSelectItem = (id: string) =>
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="bn-container"
      onClick={() => { setOpenMenuId(null); setIsStatusOpen(false); }}
    >
      {/* HEADER */}
      <div className="bn-header">
        <div className="bn-header-left">
          <div className="bn-header-icon"><Zap size={20} /></div>
          <div>
            <h1 className="bn-title">Breaking News</h1>
            <p className="bn-subtitle">Manage live breaking news and urgent updates</p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="bn-stats">
        <div className="bn-stat-card">
          <div className="bn-stat-icon"><Radio size={20} /></div>
          <div className="bn-stat-label">Live Now</div>
          <div className="bn-stat-number">{liveCount}</div>
        </div>
        <div className="bn-stat-card">
          <div className="bn-stat-icon"><Clock size={20} /></div>
          <div className="bn-stat-label">Scheduled</div>
          <div className="bn-stat-number">{scheduledCount}</div>
        </div>
        <div className="bn-stat-card">
          <div className="bn-stat-icon"><Eye size={20} /></div>
          <div className="bn-stat-label">Total Views</div>
          <div className="bn-stat-number">{formatNumber(totalViews)}</div>
        </div>
        <div className="bn-stat-card">
          <div className="bn-stat-icon"><TrendingUp size={20} /></div>
          <div className="bn-stat-label">Avg Engagement</div>
          <div className="bn-stat-number bn-stat-positive">{avgEngagement}</div>
        </div>
      </div>

      {/* CURRENTLY LIVE */}
      <div className="bn-live-section">
        <div className="bn-live-header">
          <div className="bn-live-indicator"></div>
          <h2>Currently Live</h2>
        </div>
        <div className="bn-live-list">
          {items.filter(n => n.status === "live").slice(0, 3).map(news => (
            <div key={news.id} className="bn-live-item">
              <span className="bn-live-title">{news.headline}</span>
              <div className="bn-live-meta">
                <span className="bn-live-views"><Eye size={14} />{formatNumber(news.views)}</span>
                <span className="bn-live-time"><Clock size={14} />{news.timeAgo}</span>
                <button
                  className="bn-live-link"
                  onClick={() => navigate(`/admin/create?edit=${news.id}&type=breaking`)}
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
            <div
              className="bn-filter-selected"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
            >
              {statusFilter} <ChevronDown size={16} />
            </div>
            {isStatusOpen && (
              <div className="bn-filter-menu">
                {statusOptions.map(opt => (
                  <div
                    key={opt}
                    className={`bn-filter-item ${statusFilter === opt ? "active" : ""}`}
                    onClick={() => { setStatusFilter(opt); setIsStatusOpen(false); setCurrentPage(1); }}
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
              <th className="bn-th-checkbox"><input type="checkbox" /></th>
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
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "14px" }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && currentNews.map(news => (
              <tr key={news.id} className="bn-table-row">
                <td className="bn-td-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(news.id)}
                    onChange={() => handleSelectItem(news.id)}
                  />
                </td>
                <td className="bn-td-headline">
                  <div className="bn-headline-content">
                    <div className="bn-headline-title">{news.headline}</div>
                    <div className="bn-headline-meta">By {news.author} • {news.timeAgo}</div>
                  </div>
                </td>
                <td className="bn-td-status">
                  <span className={`bn-badge ${getStatusClass(news.status)}`}>
                    {news.status === "live"      && <div className="bn-status-dot"></div>}
                    {news.status === "scheduled" && <Clock size={12} />}
                    {news.status === "paused"    && "⏸"}
                    {news.status}
                  </span>
                </td>
                <td className="bn-td-category">{news.category}</td>
                <td className="bn-td-views">{formatNumber(news.views)}</td>
                <td className="bn-td-actions" onClick={e => e.stopPropagation()}>
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
                        <button onClick={() => handleMenuAction("pause", news.id)}>
                          {news.status === "paused" ? <Play size={16} /> : <Pause size={16} />}
                          {news.status === "paused" ? "Resume" : "Pause"}
                        </button>
                        <div className="bn-menu-divider" />
                        <button className="bn-delete" onClick={() => handleMenuAction("delete", news.id)}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && currentNews.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "14px" }}>
                  No breaking news found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="bn-pagination">
          <div className="bn-pagination-info">
            Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredNews.length)} of {filteredNews.length} items
          </div>
          <div className="bn-pagination-controls">
            <button
              className="bn-pagination-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} /> Previous
            </button>
            <div className="bn-pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`bn-pagination-page ${page === currentPage ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="bn-pagination-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal !== null && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon"><Trash2 size={22} /></div>
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