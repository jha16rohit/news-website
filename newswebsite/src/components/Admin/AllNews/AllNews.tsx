import React, { useState, useRef, useEffect } from "react";
import "./AllNews.css";
import { useNews } from "../NewsStore/NewsStore";
import {
  Search, Flame, Star, Video, Image as ImageIcon, Radio, X,
  Edit, ExternalLink, Trash2, Zap, MoreVertical, Pin, GripVertical,
} from "lucide-react";

const articleTypes = [
  { key: "all",       label: "All" },
  { key: "standard",  label: "Standard Article" },
  { key: "breaking",  label: "Breaking News",       icon: <Flame size={13} /> },
  { key: "exclusive", label: "Exclusive Story",     icon: <Star size={13} /> },
  { key: "opinion",   label: "Opinion / Editorial" },
  { key: "live",      label: "Live Updates",        icon: <Radio size={13} /> },
  { key: "video",     label: "Video Story",         icon: <Video size={13} /> },
  { key: "photo",     label: "Photo Gallery",       icon: <ImageIcon size={13} /> },
];

const CATEGORY_MAP: Record<string, string> = {
  standard:  "Standard Article",
  breaking:  "Breaking News",
  exclusive: "Exclusive Story",
  opinion:   "Opinion / Editorial",
  live:      "Live Updates",
  video:     "Video Story",
  photo:     "Photo Gallery",
};

const AllNews: React.FC = () => {
  const { articles, setArticles, updateArticle, deleteArticle } = useNews();
  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Drag state
  const dragIndex = useRef<number | null>(null);
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
    const matchType = activeType === "all" || a.category === CATEGORY_MAP[activeType];
    const matchSearch = search === "" ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.authorFirst.toLowerCase().includes(search.toLowerCase()) ||
      a.authorLast.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Selection
  const allIds = filtered.map((a) => a.id);
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedItems.has(id));
  const isSomeSelected = allIds.some((id) => selectedItems.has(id));

  const toggleAll = () => {
    if (isAllSelected) setSelectedItems((p) => { const s = new Set(p); allIds.forEach((id) => s.delete(id)); return s; });
    else setSelectedItems((p) => { const s = new Set(p); allIds.forEach((id) => s.add(id)); return s; });
  };
  const toggleItem = (id: number) => setSelectedItems((p) => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

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
    if (dragIndex.current !== null && dragOverIndex.current !== null && dragIndex.current !== dragOverIndex.current) {
      const reordered = [...articles];
      // Find actual indices in full articles array
      const fromId = filtered[dragIndex.current].id;
      const toId   = filtered[dragOverIndex.current].id;
      const fromIdx = reordered.findIndex((a) => a.id === fromId);
      const toIdx   = reordered.findIndex((a) => a.id === toId);
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      setArticles(reordered);
    }
    dragIndex.current = null;
    dragOverIndex.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleMenuAction = (action: string, id: number) => {
    const item = articles.find((a) => a.id === id);
    if (action === "mark-breaking") {
      const isBreaking = item?.tagType === "breaking";
      updateArticle(id, {
        tag:        isBreaking ? undefined : "Breaking",
        tagType:    isBreaking ? undefined : "breaking",
        leftBorder: isBreaking ? undefined : "breaking-left",
      });
    }
    if (action === "pin")    updateArticle(id, { isPinned: !item?.isPinned });
    if (action === "delete") setDeleteModal(id);
    setOpenDropdown(null);
  };

  const confirmDelete = () => {
    if (deleteModal !== null) { deleteArticle(deleteModal); setDeleteModal(null); }
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
          {search && <button className="search-clear" onClick={() => setSearch("")}><X size={14} /></button>}
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
            <button className="action-btn publish-btn">Publish Selected</button>
            <button className="action-btn draft-btn">Move to Draft</button>
            <button className="action-btn delete-btn">Delete Selected</button>
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
                <input type="checkbox" checked={isAllSelected}
                  ref={(el) => { if (el) el.indeterminate = isSomeSelected && !isAllSelected; }}
                  onChange={toggleAll}
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
            {filtered.map((news, index) => {
              const isDragging  = draggingId === news.id;
              const isDragOver  = dragOverId === news.id && draggingId !== news.id;
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

                  <td>
                    <input type="checkbox" checked={selectedItems.has(news.id)} onChange={() => toggleItem(news.id)} />
                  </td>

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

                  <td className="muted">{news.category}</td>

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

                  <td><span className={`status-pill ${news.statusType}`}>{news.status}</span></td>
                  <td><span className={`priority-pill ${news.priorityType}`}>{news.priority}</span></td>
                  <td className="muted">{news.published}</td>
                  <td className="views">{news.views}</td>

                  <td className="actions">
                    <div className="action-dropdown-wrapper" ref={openDropdown === news.id ? dropdownRef : null}>
                      <button className="action-menu-btn" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === news.id ? null : news.id); }}>
                        <MoreVertical size={16} />
                      </button>
                      {openDropdown === news.id && (
                        <div className="action-dropdown">
                          <button className="dropdown-item" onClick={() => handleMenuAction("edit", news.id)}><Edit size={15} /> Edit</button>
                          <button className="dropdown-item" onClick={() => handleMenuAction("view-live", news.id)}><ExternalLink size={15} /> View Live</button>
                          <div className="dropdown-divider" />
                          <button className="dropdown-item" onClick={() => handleMenuAction("pin", news.id)}>
                            <Pin size={15} className={news.isPinned ? "icon-blue" : ""} />
                            {news.isPinned ? "Unpin from Homepage" : "Pin to Homepage"}
                          </button>
                          <button className={`dropdown-item${news.tagType === "breaking" ? " breaking-active" : ""}`} onClick={() => handleMenuAction("mark-breaking", news.id)}>
                            <Zap size={15} className={news.tagType === "breaking" ? "icon-red" : ""} />
                            {news.tagType === "breaking" ? "Remove Breaking" : "Mark as Breaking"}
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