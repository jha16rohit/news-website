import "./RecentArticles.css";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Pencil, Trash2, MonitorPlay } from "lucide-react";
import { fetchAllNews, deleteNews } from "../../../api/news";

// ── Types ──────────────────────────────────────────────────────────────────
interface Article {
  id:       string;
  title:    string;
  author:   string;
  category: string;
  status:   string;   // "Published" | "Draft" | "Scheduled" | "Expired" | "Deleted"
  time:     string;
  views:    string;
}

interface RawNewsDoc {
  id:          string;
  headline:    string;
  status:      string;
  publishedAt?: string;
  createdAt:   string;
  views?:      number;
  categoryId?: { name?: string } | string;
  authorId?:   { name?: string } | string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatViews(n?: number): string {
  if (!n) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function toTitleCase(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function normalize(raw: RawNewsDoc): Article {
  const category = typeof raw.categoryId === "object" ? raw.categoryId?.name : undefined;
  const author = typeof raw.authorId === "object" ? raw.authorId?.name : undefined;
  const isLive = raw.status === "PUBLISHED";

  return {
    id:       raw.id,
    title:    raw.headline,
    author:   author ?? "Unknown",
    category: category ?? "Uncategorized",
    status:   toTitleCase(raw.status),
    time:     isLive ? formatTime(raw.publishedAt) : "-",
    views:    isLive ? formatViews(raw.views) : "-",
  };
}

const RecentArticles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLTableSectionElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllNews({ limit: 5 });
      const raw: RawNewsDoc[] = data?.news ?? [];
      setArticles(raw.map(normalize));
    } catch {
      setError("Could not load recent articles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteNews(deleteId);
      setArticles((prev) => prev.filter((a) => a.id !== deleteId));
    } catch {
      // keep the row if delete failed; a toast/error UI could go here
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const MenuDropdown = ({ id }: { id: string }) => (
    <>
      <button className="three-dot-btn" onClick={() => setOpenMenu(openMenu === id ? null : id)}>
        <MoreVertical size={16} />
      </button>
      {openMenu === id && (
        <div className="row-dropdown">
          <div
  className="dropdown-item"
  onClick={() => {
    navigate(`/admin/create?edit=${id}&type=standard`);
    setOpenMenu(null);
  }}
>
  <Pencil size={15} /> Edit
</div>
          <div className="dropdown-item" onClick={() => { window.open(`/article/${id}`, "_blank"); setOpenMenu(null); }}>
            <MonitorPlay size={15} /> Live Preview
          </div>
          <div className="dropdown-divider" />
          <div className="dropdown-item danger" onClick={() => { setDeleteId(id); setOpenMenu(null); }}>
            <Trash2 size={15} /> Delete
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="recent-card">
      <div className="recent-header">
        <div>
          <h3>Recent Articles</h3>
          <p>Latest content from your newsroom</p>
        </div>
      </div>

      {/* TABLE — scrollable on mobile */}
      <div className="table-scroll-wrap">
      <table className="recent-table">
        <thead>
          <tr>
            <th>Article</th><th>Category</th><th>Status</th>
            <th>Published</th><th>Views</th><th></th>
          </tr>
        </thead>
        <tbody ref={menuRef}>
          {loading ? (
            <tr>
              <td colSpan={6} className="muted" style={{ textAlign: "center", padding: "24px" }}>
                Loading recent articles…
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#dc2626" }}>
                {error} <button onClick={load} style={{ marginLeft: 8 }}>Retry</button>
              </td>
            </tr>
          ) : articles.length === 0 ? (
            <tr>
              <td colSpan={6} className="muted" style={{ textAlign: "center", padding: "24px" }}>
                No articles yet.
              </td>
            </tr>
          ) : (
            articles.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="article-cell">
                    <strong>{item.title}</strong>
                    <span>{item.author}</span>
                  </div>
                </td>
                <td className="muted">{item.category}</td>
                <td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td>
                <td className="muted">{item.time}</td>
                <td className="views">{item.views}</td>
                <td className="menu-cell"><MenuDropdown id={item.id} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>


      {/* DELETE MODAL */}
      {deleteId !== null && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon"><Trash2 size={22} /></div>
            <h4>Delete Story?</h4>
            <p>This action cannot be undone. The story will be permanently removed.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
              <button className="modal-confirm" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentArticles;