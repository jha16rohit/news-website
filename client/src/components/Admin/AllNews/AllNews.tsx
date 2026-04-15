import React, { useState, useRef, useEffect } from "react";
import "./AllNews.css";
import { useNews } from "../NewsStore/NewsStore";
import { useNavigate } from "react-router-dom";
import {
  Search, Flame, Video, Radio, X,
  Edit, ExternalLink, Trash2, Zap, MoreVertical, Pin, GripVertical,
} from "lucide-react";

const articleTypes = [
  { key: "all",      label: "All"              },
  { key: "standard", label: "Standard Article" },
  { key: "breaking", label: "Breaking News",   icon: <Flame size={13} /> },
  { key: "live",     label: "Live Updates",    icon: <Radio size={13} /> },
  { key: "video",    label: "Video Story",     icon: <Video size={13} /> },
];

const CATEGORY_MAP: Record<string, string> = {
  standard: "Standard Article",
  breaking: "Breaking News",
  live:     "Live Updates",
  video:    "Video Story",
};

const AllNews: React.FC = () => {
  const {
    articles, setArticles, updateArticle, deleteArticle,
    convertToBreaking, endLive,
  } = useNews();
  const navigate = useNavigate();

  const [activeType, setActiveType]       = useState("all");
  const [search, setSearch]               = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [openDropdown, setOpenDropdown]   = useState<number | null>(null);
  const [deleteModal, setDeleteModal]     = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Drag state
  const dragIndex     = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter
  const filtered = articles.filter((a) => {
    const matchType   = activeType === "all" || a.category === CATEGORY_MAP[activeType];
    const matchSearch = search === "" ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.authorFirst.toLowerCase().includes(search.toLowerCase()) ||
      a.authorLast.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Selection
  const allIds        = filtered.map((a) => a.id);
  const isAllSelected  = allIds.length > 0 && allIds.every((id) => selectedItems.has(id));
  const isSomeSelected = allIds.some((id) => selectedItems.has(id));

  const toggleAll = () => {
    if (isAllSelected) setSelectedItems((p) => { const s = new Set(p); allIds.forEach((id) => s.delete(id)); return s; });
    else               setSelectedItems((p) => { const s = new Set(p); allIds.forEach((id) => s.add(id));    return s; });
  };
  const toggleItem = (id: number) =>
    setSelectedItems((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // Drag handlers
  const onDragStart = (e: React.DragEvent, index: number, id: number) => {
    dragIndex.current = index;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnter = (index: number, id: number) => {
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
      const fromId  = filtered[dragIndex.current].id;
      const toId    = filtered[dragOverIndex.current].id;
      const fromIdx = reordered.findIndex((a) => a.id === fromId);
      const toIdx   = reordered.findIndex((a) => a.id === toId);
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      setArticles(reordered);
    }
    dragIndex.current     = null;
    dragOverIndex.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleMenuAction = (action: string, id: number) => {
    const item = articles.find((a) => a.id === id);
    setOpenDropdown(null);

    switch (action) {
      case "edit":
        navigate(`/admin/create?edit=${id}&type=${
          item?.tagType === "breaking" ? "breaking"
          : item?.tagType === "live"    ? "live"
          : item?.category === "Video Story" ? "video"
          : "standard"
        }`);
        break;

      case "view-live":
        if (item?.tagType === "breaking") navigate("/admin/breaking");
        else if (item?.tagType === "live") navigate("/admin/live");
        break;

      case "pin":
        updateArticle(id, { isPinned: !item?.isPinned });
        break;

      case "mark-breaking": {
        const isBreaking = item?.tagType === "breaking";
        if (isBreaking) {
          updateArticle(id, {
            category:    "Standard Article",
            tag:         undefined,
            tagType:     undefined,
            leftBorder:  undefined,
            priority:    "Normal",
            priorityType: "normal",
            channels:    undefined,
            expiryTime:  undefined,
          });
        } else {
          convertToBreaking(id);
        }
        break;
      }

      case "convert-live": {
        const isLive = item?.tagType === "live";
        if (isLive) {
          // End live — just update status, no navigation
          endLive(id);
        } else {
          // Convert to live — update status only, no navigation
          // Set category to "Live Updates" and mark as live with red Live badge
          updateArticle(id, {
            category:      "Live Updates",
            tag:           "Live",
            tagType:       "live",
            leftBorder:    "live-left",
            status:        "Published",
            statusType:    "live-published",   // custom statusType so CSS shows red
            published:     "Live",
            views:         item?.views ?? "0",
            liveStartedAt: new Date().toISOString(),
            liveUpdates:   item?.liveUpdates ?? [],
            channels:      undefined,
            expiryTime:    undefined,
          });
        }
        break;
      }

      case "delete":
        setDeleteModal(id);
        break;
    }
  };

  const confirmDelete = () => {
    if (deleteModal !== null) { deleteArticle(deleteModal); setDeleteModal(null); }
  };

  const handleBulkPublish = () => {
    selectedItems.forEach(id => updateArticle(id, { status: "Published", statusType: "published", published: "Just now" }));
    setSelectedItems(new Set());
  };
  const handleBulkDraft = () => {
    selectedItems.forEach(id => updateArticle(id, { status: "Draft", statusType: "draft", published: "-", views: "-" }));
    setSelectedItems(new Set());
  };
  const handleBulkDelete = () => {
    selectedItems.forEach(id => deleteArticle(id));
    setSelectedItems(new Set());
  };

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
        {articleTypes.map((item) => (
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
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
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
                  ref={(el) => { if (el) el.indeterminate = isSomeSelected && !isAllSelected; }}
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
            {filtered.map((news, index) => {
              const isDragging = draggingId === news.id;
              const isDragOver = dragOverId === news.id && draggingId !== news.id;
              return (
                <tr
                  key={news.id}
                  className={`news-row ${news.leftBorder || ""} ${isDragging ? "row-dragging" : ""} ${isDragOver ? "row-drag-over" : ""}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, index, news.id)}
                  onDragEnter={() => onDragEnter(index, news.id)}
                  onDragOver={(e) => e.preventDefault()}
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
                        {news.authorFirst[0]}{news.authorLast[0]}
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
                    <div className="action-dropdown-wrapper" ref={openDropdown === news.id ? dropdownRef : null}>
                      <button
                        className="action-menu-btn"
                        onClick={(e) => {
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
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="empty-row">No articles found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DELETE MODAL */}
      {deleteModal !== null && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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