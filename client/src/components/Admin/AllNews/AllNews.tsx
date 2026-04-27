import React, { useState, useRef, useEffect } from "react";
import "./AllNews.css";
import { useNavigate } from "react-router-dom";
import {
  Search, Flame, Video, Radio, X,
  Edit, ExternalLink, Trash2, Zap, MoreVertical, Pin, GripVertical,
} from "lucide-react";
import {
  fetchAllNews, deleteNews as apiDeleteNews, updateNews as apiUpdateNews,
} from "../../../api/news";
import type { ArticleTypeEnum } from "../../../api/news";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NewsItem {
  id:              string;   // backend UUID
  localId:         number;   // for drag-reorder
  title:           string;
  subtitle:        string;
  category:        string;   // "Breaking News", "Standard Article" etc.
  articleCategory: string;
  authorFirst:     string;
  authorLast:      string;
  status:          "Published" | "Draft" | "Scheduled";
  statusType:      string;
  published:       string;
  views:           string;
  tag?:            string;
  tagType?:        string;
  leftBorder?:     string;
  isPinned:        boolean;
  priority:        string;
  priorityType:    string;
  liveUpdates?:    any[];
  liveStartedAt?:  string;
  scheduledFor?:   string | null;
  publishedAt?:    string | null;
}

const articleTypes = [
  { key: "all",      label: "All"              },
  { key: "standard", label: "Standard Article" },
  { key: "breaking", label: "Breaking News",   icon: <Flame size={13} /> },
  { key: "live",     label: "Live Updates",    icon: <Radio size={13} /> },
  { key: "video",    label: "Video Story",     icon: <Video size={13} /> },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const typeLabel: Record<string, string> = {
  STANDARD: "Standard Article",
  BREAKING: "Breaking News",
  LIVE:     "Live Updates",
  VIDEO:    "Video Story",
};
const tagTypeMap: Record<string, string> = {
  BREAKING: "breaking",
  LIVE:     "live",
  VIDEO:    "video",
};

function mapNewsItem(n: any, idx: number): NewsItem {
  const isBreaking = n.articleType === "BREAKING";
  const isLive     = n.articleType === "LIVE";
  const isEnded    = n.status !== "PUBLISHED" && isLive;

  let publishedLabel = "-";
  if (n.status === "PUBLISHED" && n.publishedAt) {
    const d    = new Date(n.publishedAt);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000)         publishedLabel = "Just now";
    else if (diff < 3_600_000) publishedLabel = `${Math.floor(diff / 60_000)}m ago`;
    else if (diff < 86_400_000) publishedLabel = `${Math.floor(diff / 3_600_000)}h ago`;
    else                        publishedLabel = d.toLocaleDateString("en-IN", { dateStyle: "medium" });
    if (isLive && !isEnded)    publishedLabel = "Live";
  } else if (n.status === "SCHEDULED" && n.scheduledAt) {
    const d = new Date(n.scheduledAt);
    publishedLabel = d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  }

  return {
    id:              n.id,
    localId:         idx + 1,
    title:           n.headline,
    subtitle:        n.shortTitle || n.headline.slice(0, 50),
    category:        typeLabel[n.articleType] || "Standard Article",
    articleCategory: n.category || "",
    authorFirst:     n.author?.name || "Admin",
    authorLast:      "",
    status:          n.status === "PUBLISHED" ? "Published" : n.status === "DRAFT" ? "Draft" : "Scheduled",
    statusType:      n.status === "PUBLISHED"
                       ? (isLive && !isEnded ? "live-published" : "published")
                       : n.status === "DRAFT" ? "draft" : "scheduled",
    published:       publishedLabel,
    views:           String(n.views ?? 0),
    publishedAt:     n.publishedAt || null,
    scheduledFor:    n.scheduledAt || null,
    tag:             isBreaking ? "Breaking" : (isLive && !isEnded) ? "Live" : undefined,
    tagType:         tagTypeMap[n.articleType] || undefined,
    leftBorder:      isBreaking ? "breaking-left" : isLive ? "live-left" : undefined,
    isPinned:        false,
    priority:        isBreaking ? "High" : "Normal",
    priorityType:    isBreaking ? "high"  : "normal",
    liveUpdates:     n.liveUpdates || undefined,
    liveStartedAt:   isLive ? n.publishedAt : undefined,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
const AllNews: React.FC = () => {
  const navigate = useNavigate();

  const [articles, setArticles]           = useState<NewsItem[]>([]);
  const [activeType, setActiveType]       = useState("all");
  const [search, setSearch]               = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [openDropdown, setOpenDropdown]   = useState<string | null>(null);
  const [deleteModal, setDeleteModal]     = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Drag state
  const dragIndex     = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const loadData = async (type?: string, q?: string) => {
    const apiTypeMap: Record<string, ArticleTypeEnum | undefined> = {
      standard: "STANDARD",
      breaking: "BREAKING",
      live:     "LIVE",
      video:    "VIDEO",
      all:      undefined,
    };
    try {
      const data = await fetchAllNews({
        articleType: apiTypeMap[type || "all"],
        search:      q || undefined,
        limit:       100,
      });
      if (!data?.news) return;
      setArticles(data.news.map(mapNewsItem));
    } catch (err) {
      console.error("fetchAllNews failed:", err);
    }
  };

  // Initial load
  useEffect(() => { loadData(); }, []);

  // Re-fetch when filter/search changes (debounce search)
  useEffect(() => {
    const timer = setTimeout(() => loadData(activeType, search), search ? 300 : 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Selection ────────────────────────────────────────────────────────────
  const allIds        = articles.map(a => a.id);
  const isAllSelected  = allIds.length > 0 && allIds.every(id => selectedItems.has(id));
  const isSomeSelected = allIds.some(id => selectedItems.has(id));

  const toggleAll = () => {
    if (isAllSelected) setSelectedItems(p => { const s = new Set(p); allIds.forEach(id => s.delete(id)); return s; });
    else               setSelectedItems(p => { const s = new Set(p); allIds.forEach(id => s.add(id));    return s; });
  };
  const toggleItem = (id: string) =>
    setSelectedItems(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // ── Drag ─────────────────────────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, index: number, id: string) => {
    dragIndex.current = index;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnter = (index: number, id: string) => {
    dragOverIndex.current = index;
    setDragOverId(id);
  };
  const onDragEnd = () => {
    if (
      dragIndex.current !== null &&
      dragOverIndex.current !== null &&
      dragIndex.current !== dragOverIndex.current
    ) {
      const reordered = [...articles];
      const [moved] = reordered.splice(dragIndex.current, 1);
      reordered.splice(dragOverIndex.current, 0, moved);
      setArticles(reordered);
    }
    dragIndex.current     = null;
    dragOverIndex.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  // ── Menu actions ──────────────────────────────────────────────────────────
  const handleMenuAction = async (action: string, id: string) => {
    const item = articles.find(a => a.id === id);
    setOpenDropdown(null);

    switch (action) {
      case "edit":
        // ── FIX: correct route is /admin/create (not /admin/news/create) ──
        navigate(`/admin/news/create?edit=${id}&type=${
          item?.tagType === "breaking" ? "breaking"
          : item?.tagType === "live"   ? "live"
          : item?.category === "Video Story" ? "video"
          : "standard"
        }`);
        break;

      case "view-live":
        if (item?.tagType === "breaking") navigate("/admin/breaking");
        else if (item?.tagType === "live") navigate("/admin/live");
        break;

      case "pin":
        setArticles(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
        break;

      case "mark-breaking": {
        const isBreaking = item?.tagType === "breaking";
        try {
          await apiUpdateNews(id, { articleType: isBreaking ? "STANDARD" : "BREAKING", status: "PUBLISHED" } as any);
        } catch (err) { console.error(err); }
        setArticles(prev => prev.map(a => {
          if (a.id !== id) return a;
          if (isBreaking) {
            return { ...a, category: "Standard Article", tag: undefined, tagType: undefined, leftBorder: undefined, priority: "Normal", priorityType: "normal" };
          }
          return { ...a, category: "Breaking News", tag: "Breaking", tagType: "breaking", leftBorder: "breaking-left", priority: "High", priorityType: "high" };
        }));
        break;
      }

      case "convert-live": {
        const isLive = item?.tagType === "live";
        try {
          await apiUpdateNews(id, { articleType: isLive ? "STANDARD" : "LIVE", status: "PUBLISHED" } as any);
        } catch (err) { console.error(err); }
        setArticles(prev => prev.map(a => {
          if (a.id !== id) return a;
          if (isLive) {
            return { ...a, category: "Standard Article", tag: undefined, tagType: undefined, leftBorder: undefined, statusType: "published", published: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-IN") : "—" };
          }
          return { ...a, category: "Live Updates", tag: "Live", tagType: "live", leftBorder: "live-left", status: "Published", statusType: "live-published", published: "Live", liveStartedAt: new Date().toISOString() };
        }));
        break;
      }

      case "delete":
        setDeleteModal(id);
        break;
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try { await apiDeleteNews(deleteModal); } catch (err) { console.error("Delete failed:", err); }
    setArticles(prev => prev.filter(a => a.id !== deleteModal));
    setDeleteModal(null);
  };

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const handleBulkPublish = async () => {
    for (const id of selectedItems) {
      try { await apiUpdateNews(id, { status: "PUBLISHED" } as any); } catch (err) { console.error(err); }
    }
    setArticles(prev => prev.map(a =>
      selectedItems.has(a.id) ? { ...a, status: "Published", statusType: "published", published: "Just now" } : a
    ));
    setSelectedItems(new Set());
  };

  const handleBulkDraft = async () => {
    for (const id of selectedItems) {
      try { await apiUpdateNews(id, { status: "DRAFT" } as any); } catch (err) { console.error(err); }
    }
    setArticles(prev => prev.map(a =>
      selectedItems.has(a.id) ? { ...a, status: "Draft", statusType: "draft", published: "-", views: "-" } : a
    ));
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    for (const id of selectedItems) {
      try { await apiDeleteNews(id); } catch (err) { console.error(err); }
    }
    setArticles(prev => prev.filter(a => !selectedItems.has(a.id)));
    setSelectedItems(new Set());
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="all-news-container">

      {/* HEADER */}
      <div className="all-news-header">
        <div>
          <h1>All News</h1>
          <p>Manage all articles, stories, and content across your newsroom</p>
        </div>
      </div>

      {/* TABS */}
      <div className="article-type-tabs">
        {articleTypes.map(item => (
          <button
            key={item.key}
            className={`type-tab type-tab--${item.key} ${activeType === item.key ? "active" : ""}`}
            onClick={() => setActiveType(item.key)}
          >
            {item.icon && item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="filters-card">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}><X size={14} /></button>
          )}
        </div>
      </div>

      {/* SELECTION BANNER */}
      {selectedItems.size > 0 && (
        <div className="selection-banner">
          <div className="selection-info">
            <span className="selection-count">{selectedItems.size} selected</span>
            <button className="clear-selection-btn" onClick={() => setSelectedItems(new Set())}>
              <X size={14} /> Clear
            </button>
          </div>
          <div className="selection-actions">
            <button className="action-btn publish-btn" onClick={handleBulkPublish}>Publish Selected</button>
            <button className="action-btn draft-btn"   onClick={handleBulkDraft}>Move to Draft</button>
            <button className="action-btn delete-btn"  onClick={handleBulkDelete}>Delete Selected</button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="news-table-wrapper">
        <table className="news-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={el => { if (el) el.indeterminate = isSomeSelected && !isAllSelected; }}
                  onChange={toggleAll}
                />
              </th>
              <th>Article</th>
              <th>Article Type</th>
              <th>Category</th>
              <th>Author</th>
              <th>Status</th>
              <th>Published</th>
              <th>Views</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {articles.map((news, index) => {
              const isDragging = draggingId === news.id;
              const isDragOver = dragOverId === news.id && draggingId !== news.id;
              return (
                <tr
                  key={news.id}
                  className={`news-row ${news.leftBorder || ""} ${isDragging ? "row-dragging" : ""} ${isDragOver ? "row-drag-over" : ""}`}
                  draggable
                  onDragStart={e => onDragStart(e, index, news.id)}
                  onDragEnter={() => onDragEnter(index, news.id)}
                  onDragOver={e => e.preventDefault()}
                  onDragEnd={onDragEnd}
                >
                  {/* DRAG HANDLE */}
                  <td className="drag-handle-cell">
                    <GripVertical size={15} className="drag-handle" />
                  </td>

                  {/* CHECKBOX */}
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(news.id)}
                      onChange={() => toggleItem(news.id)}
                    />
                  </td>

                  {/* ARTICLE */}
                  <td>
                    <div className="article-cell">
                      <div className="article-tags">
                        {news.tag && <span className={`tag ${news.tagType}`}>{news.tag}</span>}
                        {news.isPinned && <Pin size={13} className="inline-icon pin-icon" />}
                      </div>
                      <div className="article-title">{news.title}</div>
                      <div className="article-subtitle">{news.subtitle}</div>
                    </div>
                  </td>

                  {/* ARTICLE TYPE */}
                  <td>
                    <span className={`type-pill type-pill--${news.tagType ?? "standard"}`}>
                      {news.category}
                    </span>
                  </td>

                  {/* CATEGORY */}
                  <td className="muted">
                    {news.articleCategory
                      ? <span className="category-breadcrumb">{news.articleCategory}</span>
                      : <span className="category-empty">—</span>}
                  </td>

                  {/* AUTHOR */}
                  <td>
                    <div className="author-cell">
                      <div className="avatar">
                        {news.authorFirst?.[0] ?? "?"}{news.authorLast?.[0] ?? ""}
                      </div>
                      <div>
                        <div className="author-name">{news.authorFirst}</div>
                        <div className="author-last">{news.authorLast}</div>
                      </div>
                    </div>
                  </td>

                  {/* STATUS */}
                  <td>
                    <span className={`status-pill ${news.statusType}`}>{news.status}</span>
                  </td>

                  {/* PUBLISHED */}
                  <td className="muted">{news.published}</td>

                  {/* VIEWS */}
                  <td className="views">{news.views}</td>

                  {/* ACTIONS */}
                  <td className="actions">
                    <div
                      className="action-dropdown-wrapper"
                      ref={openDropdown === news.id ? dropdownRef : null}
                    >
                      <button
                        className="action-menu-btn"
                        onClick={e => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === news.id ? null : news.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openDropdown === news.id && (
                        <div className="action-dropdown">
                          <button className="dropdown-item" onClick={() => handleMenuAction("edit", news.id)}>
                            <Edit size={15} /> Edit
                          </button>
                          <button className="dropdown-item" onClick={() => handleMenuAction("view-live", news.id)}>
                            <ExternalLink size={15} /> View Live
                          </button>
                          <div className="dropdown-divider" />
                          <button className="dropdown-item" onClick={() => handleMenuAction("pin", news.id)}>
                            <Pin size={15} className={news.isPinned ? "icon-blue" : ""} />
                            {news.isPinned ? "Unpin from Homepage" : "Pin to Homepage"}
                          </button>
                          <button
                            className={`dropdown-item${news.tagType === "breaking" ? " breaking-active" : ""}`}
                            onClick={() => handleMenuAction("mark-breaking", news.id)}
                          >
                            <Zap size={15} className={news.tagType === "breaking" ? "icon-red" : ""} />
                            {news.tagType === "breaking" ? "Remove Breaking" : "Mark as Breaking"}
                          </button>
                          <button
                            className={`dropdown-item${news.tagType === "live" ? " breaking-active" : ""}`}
                            onClick={() => handleMenuAction("convert-live", news.id)}
                            style={news.tagType === "live" ? { color: "#16a34a" } : {}}
                          >
                            <Radio size={15} />
                            {news.tagType === "live"
                              ? news.statusType === "ended" ? "Ended" : "End Live"
                              : "Convert to Live"}
                          </button>
                          <div className="dropdown-divider" />
                          <button className="dropdown-item danger" onClick={() => handleMenuAction("delete", news.id)}>
                            <Trash2 size={15} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {articles.length === 0 && (
              <tr>
                <td colSpan={10} className="empty-row">No articles found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

export default AllNews;