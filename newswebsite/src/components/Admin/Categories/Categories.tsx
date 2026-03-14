import { useState, useEffect } from "react";
import "./Categories.css";
import EditCategoryModal from "./EditCategoryModal/EditCategoryModal";
import AddCategoryModal from "./AddCategoryModal/AddCategoryModal";
import { Folder, FileText, Eye, Pencil, Trash2, CheckCircle } from "lucide-react";

export interface Category {
  id: number; name: string; description: string; articles: string;
  views: string; featured: boolean; enabled: boolean; color: string;
}

const initialCategories: Category[] = [
  { id: 1, name: "Politics", description: "National and international political news", articles: "1,245", views: "2.5M", featured: true, enabled: true, color: "#dc2626" },
  { id: 2, name: "Business", description: "Markets, economy, and corporate news", articles: "987", views: "1.9M", featured: true, enabled: true, color: "#2563eb" },
  { id: 3, name: "Sports", description: "Cricket, football, and all sports coverage", articles: "1,567", views: "3.2M", featured: true, enabled: true, color: "#16a34a" },
  { id: 4, name: "Entertainment", description: "Bollywood, Hollywood, and celebrity news", articles: "2,134", views: "4.5M", featured: false, enabled: true, color: "#9333ea" },
  { id: 5, name: "Technology", description: "Tech news, gadgets, and innovations", articles: "1,024", views: "2.1M", featured: true, enabled: true, color: "#0ea5e9" },
];

export default function Categories() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem("localNewzCategories");
      return saved ? JSON.parse(saved) : initialCategories;
    } catch (e) {
      return initialCategories;
    }
  });

  useEffect(() => {
    localStorage.setItem("localNewzCategories", JSON.stringify(categories));
  }, [categories]);

  const filtered = (categories || []).filter(c => 
    (c?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleCategory = (id: number) => setCategories(p => p.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const executeDelete = () => {
    if (!categoryToDelete) return;
    setCategories(p => p.filter(c => c.id !== categoryToDelete.id));
    showToast(`"${categoryToDelete.name}" category deleted.`);
    setCategoryToDelete(null);
  };

  // --- PRO LOGIC: Enforce 5 Featured Limit ---
  const handleEdit = (updatedCat: Category) => {
    const otherFeaturedCount = categories.filter(c => c.featured && c.id !== updatedCat.id).length;
    
    if (updatedCat.featured && otherFeaturedCount >= 5) {
      showToast("Limit Reached: Only 5 categories can be Featured. Saved as unfeatured.");
      updatedCat.featured = false;
    } else {
      showToast(`"${updatedCat.name}" updated successfully!`);
    }
    
    setCategories(p => p.map(c => c.id === updatedCat.id ? updatedCat : c));
  };

  const handleAdd = (newCat: Category) => {
    const featuredCount = categories.filter(c => c.featured).length;
    
    if (newCat.featured && featuredCount >= 5) {
      showToast("Limit Reached: Only 5 categories can be Featured. Created as unfeatured.");
      newCat.featured = false;
    } else {
      showToast(`"${newCat.name}" category created successfully!`);
    }
    
    setCategories(prev => [...prev, newCat]);
  };

  const stats = [
    { icon: <Folder size={22} />, val: categories.length, label: "Total Categories", bg: "bg-gray" },
    { icon: <FileText size={22} />, val: "8,333", label: "Total Articles", bg: "bg-green" },
    { icon: <Eye size={22} />, val: "16.8M", label: "Total Views", bg: "bg-light" },
    { icon: <Folder size={22} />, val: categories.filter(c => c.featured).length, label: "Featured", bg: "bg-gray" }
  ];

  return (
    <div className="cat-root">
      {toastMsg && (
        <div className="cat-toast">
          <CheckCircle size={20} />
          <span>{toastMsg}</span>
        </div>
      )}

      {categoryToDelete && (
        <div className="cat-modal-overlay">
          <div className="cat-delete-modal">
            <h3>Delete "{categoryToDelete?.name}"?</h3>
            <p>This will permanently remove the category and unlink {categoryToDelete?.articles} articles. This action cannot be undone.</p>
            <div className="cat-delete-actions">
              <button className="cat-btn-cancel" onClick={() => setCategoryToDelete(null)}>Cancel</button>
              <button className="cat-btn-delete" onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="cat-container">
        <div className="cat-header">
          <div>
            <h1 className="cat-title">Categories</h1>
            <p className="cat-subtitle">Organize your news content with categories</p>
          </div>
          <button className="cat-add-btn" onClick={() => setIsAddModalOpen(true)}>+ Add Category</button>
        </div>

        <div className="cat-stats">
          {stats.map((s, i) => (
            <div key={i} className="cat-stat-card">
              <div className={`cat-stat-icon ${s.bg}`}>{s.icon}</div>
              <div>
                <div className="cat-stat-value">{s.val}</div>
                <div className="cat-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="cat-search">
          <input type="text" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="cat-grid">
          {filtered.map(c => (
            <div key={c.id} className="cat-card">
              <div className="cat-drag">⋮⋮</div>
              <div className="cat-avatar" style={{ background: c.color }}>{c.name.charAt(0)}</div>
              
              <div className="cat-content">
                <div className="cat-top">
                  <h3>{c.name}</h3>
                  {c.featured && <span className="cat-featured">Featured</span>}
                </div>
                <p className="cat-desc">{c.description}</p>
                <div className="cat-meta">
                  <span>{c.articles} articles</span>
                  <span>{c.views} views</span>
                </div>
              </div>

              <div className="cat-actions">
                <button className={`cat-toggle ${c.enabled ? "on" : ""}`} onClick={() => toggleCategory(c.id)}><span /></button>
                <div className="cat-icons">
                  <button className="cat-icon-btn" onClick={() => setEditingCategory(c)}><Pencil size={16} /></button>
                  <button className="cat-icon-btn cat-icon-btn--delete" onClick={() => setCategoryToDelete(c)}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EditCategoryModal 
        isOpen={editingCategory !== null}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        onSave={handleEdit}
      />

      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}