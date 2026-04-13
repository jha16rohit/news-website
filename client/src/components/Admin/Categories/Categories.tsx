import { useState } from "react";
import "./Categories.css";
import EditCategoryModal from "./EditCategoryModal/EditCategoryModal";
import AddCategoryModal from "./AddCategoryModal/AddCategoryModal";
import { Folder, FileText, Eye, Pencil, Trash2, CheckCircle, ChevronRight } from "lucide-react";
import { useNews } from "../NewsStore/NewsStore";
import type { Category } from "../NewsStore/NewsStore";

const FEATURED_LIMIT = 5;

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useNews();

  const [editingCategory,  setEditingCategory]  = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [search,           setSearch]           = useState("");
  const [toastMsg,         setToastMsg]         = useState("");
  const [isAddModalOpen,   setIsAddModalOpen]   = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // Build display name with breadcrumb for children
  const getBreadcrumb = (cat: Category): string => {
    if (!cat.parentId) return cat.name;
    const parent = categories.find(c => c.id === cat.parentId);
    return parent ? `${parent.name} / ${cat.name}` : cat.name;
  };

  const filtered = categories.filter(c =>
    getBreadcrumb(c).toLowerCase().includes(search.toLowerCase())
  );

  // Sort: parents first, then children under their parent
  const sorted = [...filtered].sort((a, b) => {
    const aRoot = a.parentId ?? a.id;
    const bRoot = b.parentId ?? b.id;
    if (aRoot !== bRoot) return aRoot - bRoot;
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return 0;
  });

  const toggleCategory = (id: number) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    updateCategory(id, { enabled: !cat.enabled });
  };

  const executeDelete = () => {
    if (!categoryToDelete) return;
    const childCount = categories.filter(c => c.parentId === categoryToDelete.id).length;
    deleteCategory(categoryToDelete.id);
    showToast(`"${categoryToDelete.name}" deleted${childCount ? ` along with ${childCount} sub-categor${childCount > 1 ? "ies" : "y"}` : ""}.`);
    setCategoryToDelete(null);
  };

  const handleEdit = (updatedCat: Category) => {
    const otherFeatured = categories.filter(c => c.featured && c.id !== updatedCat.id).length;
    if (updatedCat.featured && otherFeatured >= FEATURED_LIMIT) {
      showToast("Limit reached: only 5 categories can be featured. Saved as unfeatured.");
      updateCategory(updatedCat.id, { ...updatedCat, featured: false });
    } else {
      updateCategory(updatedCat.id, updatedCat);
      showToast(`"${updatedCat.name}" updated.`);
    }
  };

  const handleAdd = (newCat: Omit<Category, "id">) => {
    const featuredCount = categories.filter(c => c.featured).length;
    if (newCat.featured && featuredCount >= FEATURED_LIMIT) {
      showToast("Limit reached: only 5 categories can be featured. Created as unfeatured.");
      addCategory({ ...newCat, featured: false });
    } else {
      addCategory(newCat);
      showToast(`"${newCat.name}" created.`);
    }
  };

  const childCountOf = (id: number) => categories.filter(c => c.parentId === id).length;

  const stats = [
    { icon: <Folder size={20} />,   val: categories.filter(c => !c.parentId).length, label: "Parent Categories", bg: "bg-gray"  },
    { icon: <FileText size={20} />, val: categories.filter(c => c.parentId).length,  label: "Sub-Categories",    bg: "bg-green" },
    { icon: <Eye size={20} />,      val: "16.8M",                                    label: "Total Views",        bg: "bg-light" },
    { icon: <Folder size={20} />,   val: categories.filter(c => c.featured).length,  label: "Featured",           bg: "bg-gray"  },
  ];

  return (
    <div className="cat-root">
      {toastMsg && (
        <div className="cat-toast">
          <CheckCircle size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {categoryToDelete && (
        <div className="cat-modal-overlay">
          <div className="cat-delete-modal">
            <h3>Delete "{categoryToDelete.name}"?</h3>
            <p>
              This will permanently remove the category
              {childCountOf(categoryToDelete.id) > 0
                ? ` and its ${childCountOf(categoryToDelete.id)} sub-categor${childCountOf(categoryToDelete.id) > 1 ? "ies" : "y"}`
                : ""}
              . This action cannot be undone.
            </p>
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
            <p className="cat-subtitle">Organize your news content with categories and sub-categories</p>
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
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="cat-grid">
          {sorted.map(c => (
            <div
              key={c.id}
              className={`cat-card${c.parentId ? " cat-card--child" : ""}`}
            >
              <div className="cat-drag">⋮⋮</div>

              {c.parentId && <div className="cat-child-indent"><ChevronRight size={14} /></div>}

              <div className="cat-avatar" style={{ background: c.color }}>
                {c.name.charAt(0)}
              </div>

              <div className="cat-content">
                <div className="cat-top">
                  <div className="cat-name-row">
                    {c.parentId && (
                      <span className="cat-breadcrumb">
                        {categories.find(p => p.id === c.parentId)?.name}
                        <ChevronRight size={12} />
                      </span>
                    )}
                    <h3>{c.name}</h3>
                  </div>
                  <div className="cat-badges">
                    {c.featured && <span className="cat-featured">Featured</span>}
                    {!c.parentId && childCountOf(c.id) > 0 && (
                      <span className="cat-child-count">{childCountOf(c.id)} sub</span>
                    )}
                  </div>
                </div>
                <p className="cat-desc">{c.description}</p>
                <div className="cat-meta">
                  <span>{c.articles} articles</span>
                  <span>{c.views} views</span>
                </div>
              </div>

              <div className="cat-actions">
                <button
                  className={`cat-toggle ${c.enabled ? "on" : ""}`}
                  onClick={() => toggleCategory(c.id)}
                >
                  <span />
                </button>
                <div className="cat-icons">
                  <button className="cat-icon-btn" onClick={() => setEditingCategory(c)}>
                    <Pencil size={15} />
                  </button>
                  <button className="cat-icon-btn cat-icon-btn--delete" onClick={() => setCategoryToDelete(c)}>
                    <Trash2 size={15} />
                  </button>
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
        categories={categories}
      />

      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAdd}
        categories={categories}
      />
    </div>
  );
}