import "./BreakingNewsPanel.css";
import { Zap, Clock, Eye, MoreVertical, Pencil, Trash2, MonitorPlay } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

const BreakingNewsPanel = () => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = (id: number) => { setDeleteId(id); setOpenMenu(null); };
  const confirmDelete = () => { /* delete logic */ setDeleteId(null); };

  return (
    <div className="breaking-panel">
      {/* HEADER */}
      <div className="breaking-header">
        <div className="breaking-title">
          <div className="breaking-icon">
            <Zap size={18} className="breaking-zap" />
          </div>
          <div>
            <h3>Breaking News</h3>
            <span>4 live alerts • Updated now</span>
          </div>
        </div>
        <button className="manage-btn" onClick={() => navigate("/admin/live")}>
          Manage Live Stories ↗
        </button>
      </div>

      {/* LIST */}
      <div className="breaking-list" ref={menuRef}>
        {[1, 2, 3, 4].map((id) => (
          <div key={id} className="breaking-item">
            <div className="breaking-left">
              <span className="tag breaking">BREAKING</span>
              <span className="category">Business</span>
              <h4>Stock Markets Hit Record High: Sensex Crosses 85,000 Mark</h4>
              <div className="meta">
                <Clock size={14} /><span>42 min ago</span>
                <Eye size={14} /><span>89K views</span>
              </div>
            </div>

            {/* THREE DOT MENU */}
            <div className="item-menu-wrap">
              <button className="three-dot-btn" onClick={() => setOpenMenu(openMenu === id ? null : id)}>
                <MoreVertical size={18} />
              </button>
              {openMenu === id && (
                <div className="item-dropdown">
                  <div className="item-option" onClick={() => { navigate(`/admin/news/edit/${id}`); setOpenMenu(null); }}>
                    <Pencil size={15} /> Edit
                  </div>
                  <div className="item-option" onClick={() => { window.open(`/article/${id}`, "_blank"); setOpenMenu(null); }}>
                    <MonitorPlay size={15} /> Live Preview
                  </div>
                  <div className="item-option danger" onClick={() => handleDelete(id)}>
                    <Trash2 size={15} /> Delete
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* DELETE CONFIRM MODAL */}
      {deleteId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon"><Trash2 size={22} /></div>
            <h4>Delete Story?</h4>
            <p>This action cannot be undone. The story will be permanently removed.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="modal-confirm" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakingNewsPanel;