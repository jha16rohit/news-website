import React, { useState } from "react";
import "./BreakingNews.css";
import {
  Zap,
  RefreshCw,
  Plus,
  Clock,
  Eye,
  TrendingUp,
  Search,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Radio,
  Bell,
  Edit,
  Pause,
  ArrowUp,
  ArrowDown,
  Trash2
} from "lucide-react";


/* ================= TYPES ================= */
interface NewsItem {
  id: number;
  headline: string;
  author: string;
  timeAgo: string;
  priority: "critical" | "high" | "medium";
  status: "live" | "scheduled" | "expired" | "paused";
  category: string;
  views: number;
  expires: string;
  distribution: string[];
}

/* ================= DATA ================= */
const breakingNewsData: NewsItem[] = [
  {
    id: 1,
    headline: "Parliament Passes Historic Budget Bill with Overwhelming Majority",
    author: "Rakesh Kumar",
    timeAgo: "2 mins ago",
    priority: "critical",
    status: "live",
    category: "Politics",
    views: 45890,
    expires: "4 hours",
    distribution: ["web", "mobile"],
  },
  {
    id: 2,
    headline: "Major Earthquake Strikes Eastern Region, Rescue Operations Underway",
    author: "Priya Singh",
    timeAgo: "15 mins ago",
    priority: "critical",
    status: "live",
    category: "National",
    views: 128450,
    expires: "6 hours",
    distribution: ["web", "mobile"],
  },
  {
    id: 3,
    headline: "Stock Market Hits Record High Amid Global Economic Recovery",
    author: "Amit Sharma",
    timeAgo: "45 mins ago",
    priority: "high",
    status: "live",
    category: "Business",
    views: 34567,
    expires: "2 hours",
    distribution: ["web"],
  },
  {
    id: 4,
    headline: "Prime Minister to Address Nation Tonight on New Policy Reforms",
    author: "Neha Verma",
    timeAgo: "1 hour ago",
    priority: "high",
    status: "scheduled",
    category: "Politics",
    views: 0,
    expires: "8 hours",
    distribution: ["web", "mobile"],
  },
  {
    id: 5,
    headline: "India Wins Test Series Against Australia",
    author: "Vikram Patel",
    timeAgo: "6 hours ago",
    priority: "medium",
    status: "expired",
    category: "Sports",
    views: 89234,
    expires: "Expired",
    distribution: [],
  },
  {
    id: 6,
    headline: "Cyclone Alert Issued for Coastal Areas",
    author: "Sunita Rao",
    timeAgo: "1 hour ago",
    priority: "critical",
    status: "paused",
    category: "Weather",
    views: 23456,
    expires: "Paused",
    distribution: ["web"],
  },
  {
    id: 7,
    headline: "Tech Giants Announce Major Investment in Indian Startups",
    author: "Arun Mehta",
    timeAgo: "3 hours ago",
    priority: "high",
    status: "live",
    category: "Technology",
    views: 56789,
    expires: "5 hours",
    distribution: ["web", "mobile"],
  },
  {
    id: 8,
    headline: "New Education Policy Implementation Begins Nationwide",
    author: "Kavita Desai",
    timeAgo: "4 hours ago",
    priority: "medium",
    status: "live",
    category: "Education",
    views: 34521,
    expires: "6 hours",
    distribution: ["web"],
  },
  {
    id: 9,
    headline: "Monsoon Forecast Predicts Above Average Rainfall This Season",
    author: "Rajesh Kumar",
    timeAgo: "5 hours ago",
    priority: "high",
    status: "scheduled",
    category: "Weather",
    views: 0,
    expires: "12 hours",
    distribution: ["web", "mobile"],
  },
  {
    id: 10,
    headline: "Supreme Court Delivers Landmark Judgment on Privacy Rights",
    author: "Anjali Nair",
    timeAgo: "7 hours ago",
    priority: "critical",
    status: "live",
    category: "Legal",
    views: 67890,
    expires: "3 hours",
    distribution: ["web", "mobile"],
  },
];

const statusOptions = [
  "All Status",
  "Live",
  "Scheduled",
  "Expired",
  "Paused",
];

const priorityOptions = [
  "All Priority",
  "Critical",
  "High",
  "Medium",
];





const BreakingNews: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);


  const itemsPerPage = 7;

  // Filter news based on search and filters
  const filteredNews = breakingNewsData.filter((news) => {
    const matchesSearch = news.headline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || news.status === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === "All Priority" || news.priority === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, endIndex);

  // Get live news count
  const liveCount = breakingNewsData.filter((n) => n.status === "live").length;
  const scheduledCount = breakingNewsData.filter((n) => n.status === "scheduled").length;
  const totalViews = breakingNewsData.reduce((sum, n) => sum + n.views, 0);
  const avgEngagement = "+24%";

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bn-priority-critical";
      case "high":
        return "bn-priority-high";
      case "medium":
        return "bn-priority-medium";
      default:
        return "";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "live":
        return "bn-status-live";
      case "scheduled":
        return "bn-status-scheduled";
      case "expired":
        return "bn-status-expired";
      case "paused":
        return "bn-status-paused";
      default:
        return "";
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="bn-container">
      {/* HEADER */}
      <div className="bn-header">
        <div className="bn-header-left">
          <div className="bn-header-icon">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="bn-title">Breaking News</h1>
            <p className="bn-subtitle">Manage live breaking news and urgent updates</p>
          </div>
        </div>
        <div className="bn-header-actions">
          <button className="bn-btn-refresh">
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className="bn-btn-new">
            <Plus size={18} />
            New Breaking News
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="bn-stats-grid">
        <div className="bn-stat-card">
          <div className="bn-stat-header">
            <span className="bn-stat-label">Live Now</span>
            <Radio size={30} className="abc"/>
          </div>
          <div className="bn-stat-number">{liveCount}</div>
        </div>

        <div className="bn-stat-card">
          <div className="bn-stat-header">
            <span className="bn-stat-label">Scheduled</span>
            <div className="bn-stat-icon bn-icon-blue">
              <Clock size={20} />
            </div>
          </div>
          <div className="bn-stat-number">{scheduledCount}</div>
        </div>

        <div className="bn-stat-card">
          <div className="bn-stat-header">
            <span className="bn-stat-label">Total Views</span>
            <div className="bn-stat-icon bn-icon-purple">
              <Eye size={20} />
            </div>
          </div>
          <div className="bn-stat-number">{(totalViews / 1000).toFixed(1)}K</div>
        </div>

        <div className="bn-stat-card">
          <div className="bn-stat-header">
            <span className="bn-stat-label">Avg. Engagement</span>
            <div className="bn-stat-icon bn-icon-green">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="bn-stat-number bn-stat-positive">{avgEngagement}</div>
        </div>
      </div>

      {/* CURRENTLY LIVE SECTION */}
      <div className="bn-live-section">
        <div className="bn-live-header">
          <div className="bn-live-indicator"></div>
          <h2>Currently Live</h2>
        </div>

        <div className="bn-live-list">
          {breakingNewsData
            .filter((news) => news.status === "live")
            .slice(0, 3)
            .map((news) => (
              <div key={news.id} className="bn-live-item">
                <span className={`bn-live-badge ${getPriorityClass(news.priority)}`}>
                  {news.priority.toUpperCase()}
                </span>
                <span className="bn-live-title">{news.headline}</span>
                <div className="bn-live-meta">
                  <span className="bn-live-views">
                    <Eye size={14} />
                    {formatNumber(news.views)}
                  </span>
                  <span className="bn-live-time">
                    <Clock size={14} />
                    {news.timeAgo}
                  </span>
                  <button className="bn-live-link">
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bn-controls">
        <div className="bn-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search breaking news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="bn-filters">
          <div className="bn-filter-dropdown-custom">
  <div
    className="bn-filter-selected"
    onClick={() => setIsStatusOpen(!isStatusOpen)}
  >
    {statusFilter}
    <ChevronDown size={16} />
  </div>

  {isStatusOpen && (
    <div className="bn-filter-menu">
      {statusOptions.map((option) => (
        <div
          key={option}
          className={`bn-filter-item ${
            statusFilter === option ? "active" : ""
          }`}
          onClick={() => {
            setStatusFilter(option);
            setIsStatusOpen(false);
          }}
        >
          {option}
        </div>
      ))}
    </div>
  )}
</div>

         <div className="bn-filter-dropdown-custom">
  <div
    className="bn-filter-selected"
    onClick={() => setIsPriorityOpen(!isPriorityOpen)}
  >
    {priorityFilter}
    <ChevronDown size={16} />
  </div>

  {isPriorityOpen && (
    <div className="bn-filter-menu">
      {priorityOptions.map((option) => (
        <div
          key={option}
          className={`bn-filter-item ${
            priorityFilter === option ? "active" : ""
          }`}
          onClick={() => {
            setPriorityFilter(option);
            setIsPriorityOpen(false);
          }}
        >
          {option}
        </div>
      ))}
    </div>
  )}
</div>

        </div>
      </div>

      {/* NEWS TABLE */}
      <div className="bn-table-container">
        <table className="bn-table">
          <thead>
            <tr>
              <th className="bn-th-checkbox">
                <input type="checkbox" />
              </th>
              <th className="bn-th-headline">Headline</th>
              <th className="bn-th-priority">Priority</th>
              <th className="bn-th-status">Status</th>
              <th className="bn-th-category">Category</th>
              <th className="bn-th-views">Views</th>
              <th className="bn-th-expires">Expires</th>
              <th className="bn-th-distribution">Distribution</th>
              <th className="bn-th-actions">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentNews.map((news) => (
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
                    <div className="bn-headline-meta">
                      By {news.author} • {news.timeAgo}
                    </div>
                  </div>
                </td>
                <td className="bn-td-priority">
                  <span className={`bn-badge ${getPriorityClass(news.priority)}`}>
                    {news.priority}
                  </span>
                </td>
                <td className="bn-td-status">
                  <span className={`bn-badge ${getStatusClass(news.status)}`}>
                    {news.status === "live" && <div className="bn-status-dot"></div>}
                    {news.status === "scheduled" && <Clock size={12} />}
                    {news.status === "paused" && "⏸"}
                    {news.status}
                  </span>
                </td>
                <td className="bn-td-category">{news.category}</td>
                <td className="bn-td-views">{formatNumber(news.views)}</td>
                <td className="bn-td-expires">{news.expires}</td>
                <td className="bn-td-distribution">
                  <div className="bn-distribution-icons">
  {news.distribution.includes("web") && (
    <span className="bn-dist-icon bn-dist-web">
      <Radio size={16} />
    </span>
  )}

  {news.distribution.includes("mobile") && (
    <span className="bn-dist-icon bn-dist-mobile">
      <Bell size={16} />
    </span>
  )}
</div>

                </td>
                <td className="bn-td-actions">
  <div className="bn-action-wrapper">
    <button
      className="bn-action-btn"
      onClick={() =>
        setOpenMenuId(openMenuId === news.id ? null : news.id)
      }
    >
      <MoreHorizontal size={18} />
    </button>

    {openMenuId === news.id && (
      <div className="bn-action-menu">
        <button>
          <Eye size={16} />
          Preview
        </button>

        <button>
          <Edit size={16} />
          Edit
        </button>

        <button>
          <Pause size={16} />
          Pause
        </button>

        <button>
          <ArrowUp size={16} />
          Increase Priority
        </button>

        <button>
          <ArrowDown size={16} />
          Decrease Priority
        </button>

        <div className="bn-menu-divider" />

        <button className="bn-delete">
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    )}
  </div>
</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="bn-pagination">
        <div className="bn-pagination-info">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredNews.length)} of{" "}
          {filteredNews.length} news items
        </div>
        <div className="bn-pagination-controls">
          <button
            className="bn-pagination-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
            Previous
          </button>
          <div className="bn-pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakingNews;