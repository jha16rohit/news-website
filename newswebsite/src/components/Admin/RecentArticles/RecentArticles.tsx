import "./RecentArticles.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Pencil, Trash2, MonitorPlay } from "lucide-react";

const articles = [
  { id: 1, title: "Tech Giants Report Strong Q4 Earnings...", author: "Priya Sharma", category: "Business", status: "Published", time: "10:45 AM", views: "12.5K" },
  { id: 2, title: "National Sports Day: Athletes Share...", author: "Rahul Verma", category: "Sports", status: "Published", time: "10:30 AM", views: "8.2K" },
  { id: 3, title: "New Healthcare Policy: What It Means for...", author: "Dr. Anita Patel", category: "Health", status: "Draft", time: "-", views: "-" },
  { id: 4, title: "Exclusive: Behind the Scenes of...", author: "Karan Mehta", category: "Entertainment", status: "Scheduled", time: "2:00 PM", views: "-" },
  { id: 5, title: "Climate Summit: India Announces...", author: "Neha Gupta", category: "Environment", status: "Published", time: "9:15 AM", views: "45.3K" },
];

const RecentArticles = () => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const menuRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const MenuDropdown = ({ id }: { id: number }) => (
    <>
      <button className="three-dot-btn" onClick={() => setOpenMenu(openMenu === id ? null : id)}>
        <MoreVertical size={16} />
      </button>
      {openMenu === id && (
        <div className="row-dropdown">
          <div className="dropdown-item" onClick={() => { navigate(`/admin/news/edit/${id}`); setOpenMenu(null); }}>
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
          {articles.map((item) => (
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
          ))}
        </tbody>
      </table>
      </div>


      {/* DELETE MODAL */}
      {deleteId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon"><Trash2 size={22} /></div>
            <h4>Delete Story?</h4>
            <p>This action cannot be undone. The story will be permanently removed.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="modal-confirm" onClick={() => setDeleteId(null)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentArticles;