import React, { useState, useRef, useEffect } from "react";
import "./AllNews.css";
import {
  Search,
  Plus,
  Flame,
  Star,
  Video,
  Image as ImageIcon,
  Radio,
  X,
  Eye,
  Edit,
  ExternalLink,
  Trash2,
  Zap,
  MoreVertical,
} from "lucide-react";

/* ================= DATA ================= */
const newsList = [
  {
    id: 1,
    title: "Parliament Session: Key Budget Amendments Passed...",
    subtitle: "Budget Amendments Passed",
    category: "Breaking News",
    authorFirst: "Priya",
    authorLast: "Sharma",
    status: "Published",
    statusType: "published",
    priority: "High",
    priorityType: "high",
    published: "15 min ago",
    views: "145K",
    tag: "Breaking",
    tagType: "breaking",
    leftBorder: "breaking-left",
    isTopStory: true,
    isPinned: true,
  },
  {
    id: 2,
    title: "Stock Markets Hit Record High: Sensex Crosses 85,000...",
    subtitle: "Sensex Crosses 85K",
    category: "Standard Article",
    authorFirst: "Rahul",
    authorLast: "Verma",
    status: "Published",
    statusType: "published",
    priority: "High",
    priorityType: "high",
    published: "42 min ago",
    views: "89K",
    isTopStory: false,
    isPinned: false,
  },
  {
    id: 3,
    title: "Exclusive: Inside the Tech Startup That's Revolutionizing...",
    subtitle: "Healthcare Tech Revolution",
    category: "Exclusive Story",
    authorFirst: "Neha",
    authorLast: "Gupta",
    status: "Published",
    statusType: "published",
    priority: "Medium",
    priorityType: "medium",
    published: "1 hr ago",
    views: "56K",
    tag: "Exclusive",
    tagType: "exclusive",
    leftBorder: "exclusive-left",
    isTopStory: false,
    isPinned: false,
  },
  {
    id: 4,
    title: "Opinion: Why India's Digital Infrastructure Needs a Rethink",
    subtitle: "Digital Infrastructure Opinion",
    category: "Opinion / Editorial",
    authorFirst: "Dr. Amit",
    authorLast: "Kumar",
    status: "Draft",
    statusType: "draft",
    priority: "Normal",
    priorityType: "normal",
    published: "-",
    views: "-",
    tag: "Opinion",
    tagType: "opinion",
    isTopStory: false,
    isPinned: false,
  },
  {
    id: 5,
    title: "Weather Alert: IMD Issues Orange Warning for Multiple States",
    subtitle: "Weather Orange Alert",
    category: "Standard Article",
    authorFirst: "Meera",
    authorLast: "Singh",
    status: "Scheduled",
    statusType: "scheduled",
    priority: "Medium",
    priorityType: "medium",
    published: "2:00 PM",
    views: "-",
    isTopStory: false,
    isPinned: false,
  },
  {
    id: 6,
    title: "Sports: India vs Australia Test Match Day 3 – Live Updates",
    subtitle: "Ind vs Aus Live",
    category: "Live Updates",
    authorFirst: "Vikram",
    authorLast: "Patel",
    status: "Published",
    statusType: "published",
    priority: "High",
    priorityType: "high",
    published: "Live",
    views: "234K",
    tag: "Live",
    tagType: "live",
    leftBorder: "live-left",
    isTopStory: false,
    isPinned: false,
  },
  {
    id: 7,
    title: "Entertainment: Bollywood's Biggest Film of the Year Breaks Records",
    subtitle: "Bollywood Box Office Record",
    category: "Standard Article",
    authorFirst: "Karan",
    authorLast: "Mehta",
    status: "Published",
    statusType: "published",
    priority: "Normal",
    priorityType: "normal",
    published: "3 hrs ago",
    views: "78K",
    isTopStory: false,
    isPinned: false,
  },
  {
    id: 8,
    title: "Video Story: Inside India's New High-Speed Rail Project",
    subtitle: "Infrastructure Video Report",
    category: "Video Story",
    authorFirst: "Ankit",
    authorLast: "Jain",
    status: "Published",
    statusType: "published",
    priority: "Medium",
    priorityType: "medium",
    published: "5 hrs ago",
    views: "61K",
    isTopStory: false,
    isPinned: false,
  },
  {
    id: 9,
    title: "Photo Gallery: Stunning Images from Chandrayaan Mission",
    subtitle: "ISRO Space Gallery",
    category: "Photo Gallery",
    authorFirst: "Riya",
    authorLast: "Malhotra",
    status: "Published",
    statusType: "published",
    priority: "Normal",
    priorityType: "normal",
    published: "Yesterday",
    views: "102K",
    isTopStory: false,
    isPinned: false,
  },
  {
    id: 10,
    title: "Breaking: Supreme Court Delivers Landmark Verdict Today",
    subtitle: "Historic Court Decision",
    category: "Breaking News",
    authorFirst: "Suresh",
    authorLast: "Iyer",
    status: "Published",
    statusType: "published",
    priority: "High",
    priorityType: "high",
    published: "5 min ago",
    views: "198K",
    tag: "Breaking",
    tagType: "breaking",
    leftBorder: "breaking-left",
    isTopStory: false,
    isPinned: false,
  },
];

/* ================= TABS ================= */
const articleTypes = [
  { key: "standard", label: "Standard Article" },
  { key: "breaking", label: "Breaking News" },
  { key: "exclusive", label: "Exclusive Story" },
  { key: "opinion", label: "Opinion / Editorial" },
  { key: "live", label: "Live Updates" },
  { key: "video", label: "Video Story" },
  { key: "photo", label: "Photo Gallery" },
];

const ITEMS_PER_PAGE = 7;
const TOTAL_ARTICLES = 156;

const AllNews: React.FC = () => {
  const [activeType, setActiveType] = useState("standard");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [newsData, setNewsData] = useState(newsList);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, TOTAL_ARTICLES);

  const currentPageItems = newsData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const currentPageIds = currentPageItems.map((item) => item.id);
  const isAllSelected = currentPageIds.every((id) => selectedItems.has(id));
  const isSomeSelected = currentPageIds.some((id) => selectedItems.has(id));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  const handleToggleItem = (id: number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
  };

  const handlePublishSelected = () => {
    console.log("Publishing:", Array.from(selectedItems));
  };

  const handleMoveToDraft = () => {
    console.log("Moving to draft:", Array.from(selectedItems));
  };

  const handleDeleteSelected = () => {
    console.log("Deleting:", Array.from(selectedItems));
  };

  const toggleDropdown = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleMenuAction = (action: string, id: number) => {
    console.log(`Action: ${action}, Item ID: ${id}`);
    
    if (action === "mark-top") {
      setNewsData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, isTopStory: !item.isTopStory } : item
        )
      );
    } else if (action === "pin") {
      setNewsData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, isPinned: !item.isPinned } : item
        )
      );
    }
    
    setOpenDropdown(null);
  };

  // Get current item for dropdown
  const getCurrentItem = (id: number) => {
    return newsData.find(item => item.id === id);
  };

  return (
    <div className="all-news-container">
      {/* HEADER */}
      <div className="all-news-header">
        <div>
          <h1>All News</h1>
          <p>Manage all articles, stories, and content across your newsroom</p>
        </div>
        <button className="add-news-btn">
          <Plus size={18} /> Add News
        </button>
      </div>

      {/* TABS */}
      <div className="article-type-tabs">
        {articleTypes.map((item) => (
          <button
            key={item.key}
            className={`type-tab ${activeType === item.key ? "active" : ""}`}
            onClick={() => setActiveType(item.key)}
          >
            {item.key === "breaking" && <Flame size={14} />}
            {item.key === "exclusive" && <Star size={14} />}
            {item.key === "live" && <Radio size={14} />}
            {item.key === "video" && <Video size={14} />}
            {item.key === "photo" && <ImageIcon size={14} />}
            {item.label}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="filters-card">
        <div className="search-box">
          <Search size={18} />
          <input placeholder="Search articles..." />
        </div>
      </div>

      {/* SELECTION BANNER */}
      {selectedItems.size > 0 && (
        <div className="selection-banner">
          <div className="selection-info">
            <span className="selection-count">
              {selectedItems.size} selected
            </span>
            <button className="clear-selection-btn" onClick={handleClearSelection}>
              <X size={16} /> Clear selection
            </button>
          </div>
          
          <div className="selection-actions">
            <button className="action-btn publish-btn" onClick={handlePublishSelected}>
              Publish Selected
            </button>
            <button className="action-btn draft-btn" onClick={handleMoveToDraft}>
              Move to Draft
            </button>
            <button className="action-btn delete-btn" onClick={handleDeleteSelected}>
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="news-table-wrapper">
        <table className="news-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = isSomeSelected && !isAllSelected;
                    }
                  }}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Article</th>
              <th>Category</th>
              <th>Author</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Published</th>
              <th>Views</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {currentPageItems.map((news) => {
              const currentItem = getCurrentItem(news.id);
              return (
                <tr key={news.id} className={`news-row ${news.leftBorder || ""}`}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(news.id)}
                      onChange={() => handleToggleItem(news.id)}
                    />
                  </td>

                  <td>
                    <div className="article-cell">
                      <div className="article-tags">
                        {news.tag && (
                          <span className={`tag ${news.tagType}`}>{news.tag}</span>
                        )}
                        {news.isTopStory && (
                          <span className="emoji-icon">⭐</span>
                        )}
                        {news.isPinned && (
                          <span className="emoji-icon">📌</span>
                        )}
                      </div>
                      <div className="article-title">{news.title}</div>
                      <div className="article-subtitle">{news.subtitle}</div>
                    </div>
                  </td>

                  <td>{news.category}</td>

                  <td>
                    <div className="author-cell">
                      <div>
                        <div>{news.authorFirst}</div>
                        <div>{news.authorLast}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`status-pill ${news.statusType}`}>
                      {news.status}
                    </span>
                  </td>

                  <td>
                    <span className={`priority-pill ${news.priorityType}`}>
                      {news.priority}
                    </span>
                  </td>

                  <td className="muted">{news.published}</td>
                  <td className="views">{news.views}</td>
                  <td className="actions">
                    <div className="action-dropdown-wrapper" ref={openDropdown === news.id ? dropdownRef : null}>
                      <button
                        className="action-menu-btn"
                        onClick={(e) => toggleDropdown(news.id, e)}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openDropdown === news.id && currentItem && (
                        <div className="action-dropdown">
                          <button
                            className="dropdown-item"
                            onClick={() => handleMenuAction("preview", news.id)}
                          >
                            <Eye size={16} />
                            <span>Preview</span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => handleMenuAction("edit", news.id)}
                          >
                            <Edit size={16} />
                            <span>Edit</span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => handleMenuAction("view-live", news.id)}
                          >
                            <ExternalLink size={16} />
                            <span>View Live</span>
                          </button>
                          <div className="dropdown-divider"></div>
                          <button
                            className="dropdown-item"
                            onClick={() => handleMenuAction("mark-top", news.id)}
                          >
                            <span className="dropdown-emoji">⭐</span>
                            <span>{currentItem.isTopStory ? "Remove from Top Story" : "Mark as Top Story"}</span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => handleMenuAction("pin", news.id)}
                          >
                            <span className="dropdown-emoji">📌</span>
                            <span>{currentItem.isPinned ? "Unpin from Homepage" : "Pin to Homepage"}</span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => handleMenuAction("mark-breaking", news.id)}
                          >
                            <Zap size={16} />
                            <span>Mark as Breaking</span>
                          </button>
                          <div className="dropdown-divider"></div>
                          <button
                            className="dropdown-item danger"
                            onClick={() => handleMenuAction("delete", news.id)}
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="pagination-bar">
          <span className="pagination-info">
            Showing {start}–{end} of {TOTAL_ARTICLES} articles
          </span>

          <div className="pagination-actions">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </button>

            <button
              className="pagination-btn"
              disabled={end >= TOTAL_ARTICLES}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllNews;