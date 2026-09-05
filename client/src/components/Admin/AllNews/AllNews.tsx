import React, { useState, useRef, useEffect } from "react";
import "./AllNews.css";
import { useNavigate } from "react-router-dom";
import {
  Search, Flame,  Radio, X,
  Edit, ExternalLink, Trash2, Zap, MoreVertical, Pin, GripVertical,
} from "lucide-react";
import {
  fetchAdminNews,
  deleteNews as apiDeleteNews,
  updateNews as apiUpdateNews,
  removeBreakingStatus,
  reorderNews,
  toggleHomepagePin,
} from "../../../api/news";
import type { ArticleTypeEnum } from "../../../api/news";
import Preloader from "../Preloader/Preloder";
import { getMe } from "../../../api/auth";


// ─── Types ────────────────────────────────────────────────────────────────────
interface NewsItem {
  id:              string;  
  authorId: string;  // backend UUID
  localId:         number;   // for drag-reorder
  title:           string;
  subtitle:        string;
  category:        string;   // "Breaking News", "Standard Article" etc.
  articleCategory: string;
  authorFirst:     string;
  authorLast:      string;
  status:          "Published" | "Draft" | "Scheduled" | "Expired" | "Deleted";
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
  isEnded?:        boolean;   // true once a LIVE article has been ended (see Livestories.tsx)
}

const articleTypes = [
  { key: "all",      label: "All"              },
  { key: "standard", label: "Standard Article" },
  { key: "breaking", label: "Breaking News",   icon: <Flame size={13} /> },
  { key: "live",     label: "Live Updates",    icon: <Radio size={13} /> },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const typeLabel: Record<string, string> = {
  STANDARD: "Standard Article",
  BREAKING: "Breaking News",
  LIVE:     "Live Updates",

};
const tagTypeMap: Record<string, string> = {
  BREAKING: "breaking",
  LIVE:     "live",
  VIDEO:    "video",
};

function mapNewsItem(n: any, idx: number): NewsItem {
  const isBreaking = n.articleType === "BREAKING";
  const isLive     = n.articleType === "LIVE";
  // Ending a live story sets statusType to "ended" but leaves status as
  // PUBLISHED (see Livestories.tsx handleEndLive), so ended-ness must be
  // read from statusType — checking n.status here never catches it.
  const isEnded    = isLive && n.statusType === "ended";

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
    id:              n._id ?? n.id,
    authorId:
    typeof n.authorId === "object"
      ? String(n.authorId?._id ?? "")
      : String(n.authorId ?? ""),
    localId:         idx + 1,
    title:           n.headline,
    subtitle:        n.shortTitle || n.headline.slice(0, 50),
    category:        typeLabel[n.articleType] || "Standard Article",
articleCategory: n.categoryId?.name || "",
    authorFirst:     n.authorId?.name || "Admin",
    authorLast:      "",
    status:          n.status === "PUBLISHED" ? "Published"
                     : n.status === "DRAFT"      ? "Draft"
                     : n.status === "SCHEDULED"  ? "Scheduled"
                     : n.status === "EXPIRED"    ? "Expired"
                     : n.status === "DELETED"    ? "Deleted"
                     : "Draft",
    statusType:      n.status === "PUBLISHED"
                       ? (isLive && !isEnded ? "live-published" : "published")
                       : n.status === "DRAFT"      ? "draft"
                       : n.status === "SCHEDULED"  ? "scheduled"
                       : n.status === "EXPIRED"    ? "expired"
                       : n.status === "DELETED"    ? "deleted"
                       : "draft",
    published:       publishedLabel,
    views:           String(n.views ?? 0),
    publishedAt:     n.publishedAt || null,
    scheduledFor:    n.scheduledAt || null,
    tag:             isBreaking ? "Breaking" : (isLive && !isEnded) ? "Live" : undefined,
    tagType:         tagTypeMap[n.articleType] || undefined,
    leftBorder:      isBreaking ? "breaking-left" : isLive ? "live-left" : undefined,
    isPinned:         Boolean(n.isPinned),
    priority:        isBreaking ? "High" : "Normal",
    priorityType:    isBreaking ? "high"  : "normal",
    liveUpdates:     n.liveUpdates || undefined,
    liveStartedAt:   isLive ? n.publishedAt : undefined,
    isEnded,
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

  const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [loading, setLoading] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<{
  id: string;
  role: "ADMIN" | "EDITOR";
  permissions: string[];
} | null>(null);



useEffect(() => {
  getMe()
    .then((res: any) => {
      setCurrentUser({
        id: String(res.user?.id ?? ""),
        role: res.user?.role,
        permissions: Array.isArray(res.user?.permissions)
          ? res.user.permissions
          : [],
      });
    })
    .catch(() => {
      setCurrentUser(null);
    });
}, []);

const isAdmin = currentUser?.role === "ADMIN";
const isEditor = currentUser?.role === "EDITOR";

const canMarkBreaking = (news: NewsItem) =>
  isAdmin ||
  (isEditor &&
    news.authorId === currentUser?.id &&
    currentUser?.permissions.includes("breaking-news") === true);

const canConvertLive = (news: NewsItem) =>
  isAdmin ||
  (isEditor &&
    news.authorId === currentUser?.id &&
    currentUser?.permissions.includes("live-news") === true);


const canModifyArticle = (news: NewsItem) => {
  if (isAdmin) return true;

  if (isEditor) {
    return news.authorId === currentUser?.id;
  }

  return false;
};
  

  // Re-fetch whenever another page mutates an article


  // Drag state
  const dragIndex     = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const loadData = async (
  type?: string,
  q?: string,
  pageNumber: number = 1,
  append: boolean = false
) => {
  const apiTypeMap: Record<string, ArticleTypeEnum | undefined> = {
    standard: "STANDARD",
    breaking: "BREAKING",
    live: "LIVE",
    all: undefined,
  };

 try {
  if (append) {
    setLoadingMore(true);
  } else {
    setLoading(true);
  }
    const data = await fetchAdminNews({
      articleType: apiTypeMap[type || "all"],
      search: q || undefined,
      page: pageNumber,
      limit: 15,
    });

    if (!data?.news) {
      if (!append) {
        setArticles([]);
      }

      setHasMore(false);
      return;
    }

    const newArticles = data.news.map((item: any, index: number) =>
      mapNewsItem(
        item,
        append
          ? (pageNumber - 1) * 15 + index
          : index
      )
    );

    if (append) {
      setArticles(prev => [...prev, ...newArticles]);
    } else {
      setArticles(newArticles);
    }

    // If backend gives total/pages, use them.
    if (data.pages !== undefined) {
      setHasMore(pageNumber < data.pages);
    } else if (data.total !== undefined) {
      setHasMore(pageNumber * 15 < data.total);
    } else {
      // Fallback: if fewer than 15 came back, there is nothing more.
      setHasMore(data.news.length === 15);
    }
  } catch (err) {
    console.error("fetchAdminNews failed:", err);
 } finally {
  setLoadingMore(false);
  setLoading(false);
}
};
  
const handleLoadMore = async () => {
  if (loadingMore || !hasMore) return;

  const nextPage = page + 1;

  await loadData(
    activeType,
    search,
    nextPage,
    true
  );

  setPage(nextPage);
};
  

  // Re-fetch when filter/search changes (debounce search)
  useEffect(() => {
  const timer = setTimeout(() => {
    setPage(1);
    setHasMore(true);
    setSelectedItems(new Set());

    loadData(activeType, search, 1, false);
  }, search ? 300 : 0);

  return () => clearTimeout(timer);

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeType, search]);

  
useEffect(() => {
  const POLL_MS = 20_000;

  const refresh = () => {
    loadData(
      activeType,
      search,
      page,
      false
    );
  };

  const interval = setInterval(refresh, POLL_MS);

  const onVisible = () => {
    if (document.visibilityState === "visible") {
      refresh();
    }
  };

  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", refresh);

  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", refresh);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeType, search, page]);

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
const onDragEnd = async () => {
  if (
    dragIndex.current !== null &&
    dragOverIndex.current !== null &&
    dragIndex.current !== dragOverIndex.current
  ) {
    const reordered = [...articles];

    const [moved] = reordered.splice(
      dragIndex.current,
      1
    );

    reordered.splice(
      dragOverIndex.current,
      0,
      moved
    );

    // Update UI immediately
    setArticles(reordered);

    try {
      await reorderNews(
        reordered.map((article, index) => ({
          id: article.id,
          order: index + 1,
        }))
      );
    } catch (error) {
      console.error(
        "Failed to save article order:",
        error
      );

      // Restore actual backend order
      await loadData(activeType, search);
    }
  }

  dragIndex.current = null;
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
        navigate(`/admin/create?edit=${id}&type=${
  item?.tagType === "breaking" ? "breaking"
  : item?.tagType === "live"   ? "live"
  : "standard"
}`);
        break;

     case "view-live":
  window.open(`/article/${id}`, "_blank", "noopener,noreferrer");
  break;

      case "pin": {
  try {
    await toggleHomepagePin(id);

    // Reload from backend so the UI reflects
    // the actual pinned/unpinned state.
    await loadData(activeType, search);
  } catch (error) {
    console.error(
      "Failed to update homepage pin:",
      error
    );
  }

  break;
}

      case "mark-breaking": {
        if (!item || !canModifyArticle(item)) break;

        const isBreaking = item.tagType === "breaking";

        try {
          if (isBreaking) {
            // Removing Breaking records history and is allowed for Admin or
            // the Editor who created this article.
            await removeBreakingStatus(id);
          } else {
            // Re-breaking a previously removed article clears the old
            // breakingRemovedAt/wasBreaking marker in the backend.
            await apiUpdateNews(id, {
              articleType: "BREAKING",
              status: "PUBLISHED",
            } as any);
          }

          await loadData(activeType, search);
        } catch (err) {
          console.error("Failed to update Breaking status:", err);
        }

        break;
      }

      case "convert-live": {
        if (!item || !canModifyArticle(item)) break;

        const isLive = item.tagType === "live";

        // Ending an already-ended live story from here is a no-op — that
        // state is managed from the Live Stories page.
        if (isLive && item?.isEnded) break;

try {
  if (isLive) {
    // "End Live": mirror Livestories.tsx handleEndLive exactly — keep
    // articleType LIVE (so the live-updates timeline still renders on
    // the public site) and just flip statusType to "ended". Previously
    // this branch converted articleType back to STANDARD, which is a
    // different, more destructive action and caused the two pages to
    // disagree about whether a story had ended.
    await apiUpdateNews(
      id,
      {
        status: "PUBLISHED",
        statusType: "ended",
        articleType: "LIVE",
      } as any
    );
  } else {
    // "Convert to Live": promote a standard/breaking article to a live one.
    await apiUpdateNews(
      id,
      {
        articleType: "LIVE",
        status: "PUBLISHED",
      } as any
    );
  }

  await loadData(activeType, search);

} catch (err) {
  console.error(err);
}

break;
      }

      case "delete":
        setDeleteModal(id);
        break;
    }
  };

  const [deleteModeChoice, setDeleteModeChoice] = useState<"instant" | "interval">("instant");
  const [deleting, setDeleting] = useState(false);

const confirmDelete = async () => {
  if (!deleteModal || deleting) return;

  setDeleting(true);

  try {
    await apiDeleteNews(deleteModal, {
      deleteMode: deleteModeChoice,
      deleteIntervalDays: 14,
    });

    await loadData(activeType, search);
    setDeleteModal(null);
  } catch (err) {
    console.error("Delete failed:", err);
  } finally {
    setDeleting(false);
  }
};

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const handleBulkPublish = async () => {
    for (const id of selectedItems) {
      try {
        await apiUpdateNews(id, { status: "PUBLISHED" } as any);
        
      } catch (err) { console.error(err); }
    }
    await loadData(activeType, search);
    setSelectedItems(new Set());
  };

  const handleBulkDraft = async () => {
    for (const id of selectedItems) {
      try {
        await apiUpdateNews(id, { status: "DRAFT" } as any);
        
      } catch (err) { console.error(err); }
    }
    await loadData(activeType, search);
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    for (const id of selectedItems) {
      try {
        await apiDeleteNews(id);
        
      } catch (err) { console.error(err); }
    }
    await loadData(activeType, search);
    setSelectedItems(new Set());
  };
  

  if (loading && articles.length === 0) {
  return <Preloader />;
}

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
                  draggable={isAdmin}
                  onDragStart={e => {
  if (!isAdmin) return;
  onDragStart(e, index, news.id);
}}
onDragEnter={() => {
  if (!isAdmin) return;
  onDragEnter(index, news.id);
}}
onDragOver={e => {
  if (isAdmin) e.preventDefault();
}}
onDragEnd={() => {
  if (!isAdmin) return;
  onDragEnd();
}}
                >
                  {/* DRAG HANDLE */}
                  <td className="drag-handle-cell">
  {isAdmin && <GripVertical size={15} className="drag-handle" />}
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
                          {canModifyArticle(news) && (
  <button
    className="dropdown-item"
    onClick={() => handleMenuAction("edit", news.id)}
  >
    <Edit size={15} /> Edit
  </button>
)}
                          {news.status === "Published" && (
  <button
    className="dropdown-item"
    onClick={() => handleMenuAction("view-live", news.id)}
  >
    <ExternalLink size={15} /> View Live
  </button>
)}
                          <div className="dropdown-divider" />
{isAdmin && news.status === "Published" && (
  <button
    className="dropdown-item"
    onClick={() => handleMenuAction("pin", news.id)}
  >
    <Pin
      size={15}
      className={news.isPinned ? "icon-blue" : ""}
    />
    {news.isPinned
      ? "Unpin from Homepage"
      : "Pin to Homepage"}
  </button>
)}
                          {canMarkBreaking(news) && (
  <button
    className={`dropdown-item${news.tagType === "breaking" ? " breaking-active" : ""}`}
                            onClick={() => handleMenuAction("mark-breaking", news.id)}
                          >
                            <Zap size={15} className={news.tagType === "breaking" ? "icon-red" : ""} />
                            {news.tagType === "breaking" ? "Remove Breaking" : "Mark as Breaking"}
                          </button>)}
{canConvertLive(news) && (
  <button
    className={`dropdown-item${news.tagType === "live" ? " breaking-active" : ""}`}
    onClick={() => handleMenuAction("convert-live", news.id)}
    disabled={news.tagType === "live" && news.isEnded}
    style={
      news.tagType === "live"
        ? news.isEnded
          ? {
              color: "#6b7280",
              opacity: 0.6,
              cursor: "not-allowed",
            }
          : { color: "#16a34a" }
        : {}
    }
  >
    <Radio size={15} />
    {news.tagType === "live"
      ? news.isEnded
        ? "Ended"
        : "End Live"
      : "Convert to Live"}
  </button>
)}
                          <div className="dropdown-divider" />
                          {canModifyArticle(news) && (
  <button
    className="dropdown-item danger"
    onClick={() => handleMenuAction("delete", news.id)}
  >
    <Trash2 size={15} /> Delete
  </button>
)}
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
      {hasMore && articles.length > 0 && (
  <div className="load-more-container">
    <button
      className="load-more-btn"
      onClick={handleLoadMore}
      disabled={loadingMore}
    >
      {loadingMore ? "Loading..." : "Load More"}
    </button>
  </div>
)}

      {/* DELETE MODAL */}
      {deleteModal !== null && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon"><Trash2 size={22} /></div>
            <h4>Delete Article?</h4>
            <p style={{ marginBottom: 12 }}>Choose how to delete this article:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", border: deleteModeChoice === "instant" ? "2px solid #dc2626" : "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", background: deleteModeChoice === "instant" ? "#fff1f1" : "#fafafa" }}>
                <input type="radio" name="deleteMode" value="instant" checked={deleteModeChoice === "instant"} onChange={() => setDeleteModeChoice("instant")} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Instant Delete</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Permanently removed right now.</div>
                </div>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", border: deleteModeChoice === "interval" ? "2px solid #f59e0b" : "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", background: deleteModeChoice === "interval" ? "#fffbeb" : "#fafafa" }}>
                <input type="radio" name="deleteMode" value="interval" checked={deleteModeChoice === "interval"} onChange={() => setDeleteModeChoice("interval")} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Delete After 14 Days</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Hidden now, permanently purged in 14 days.</div>
                </div>
              </label>
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button
  className="modal-confirm"
  onClick={confirmDelete}
  disabled={deleting}
>
  {deleting ? (
    <>
      <span className="delete-spinner" />
      Deleting...
    </>
  ) : (
    "Yes, Delete"
  )}
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllNews;