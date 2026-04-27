import { useState, useEffect } from "react";
import { X, Check, Palette, ChevronDown } from "lucide-react";
import "./EditCategoryModal.css";
import type { Category } from "../../NewsStore/NewsStore";

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  category:   Category | null;
  onSave:     (c: Category) => void;
  categories: Category[];
}

const COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e","#10b981",
  "#06b6d4","#3b82f6","#6366f1","#a855f7","#ec4899",
];

export default function EditCategoryModal({ isOpen, onClose, category, onSave, categories }: Props) {
  // Everything is held inside this single 'form' object!
  const [form, setForm] = useState<Category | null>(null);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (category) {
      setForm(category);
      setSlug(category.name.toLowerCase().replace(/\s+/g, "-"));
    }
  }, [category]);

  if (!isOpen || !form) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm({ ...form, name: v });
    setSlug(v.toLowerCase().replace(/\s+/g, "-"));
  };

  // Prevent setting self or own children as parent
  const parentOptions = categories.filter(
    c => !c.parentId && c.id !== form.id
  );

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit Category</h2>
            <p className="modal-subtitle">Update the category details below.</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">

          <div className="form-group">
            <label>Parent Category</label>
            <div className="modal-select-wrap">
              <select
                className="modal-select"
                value={form.parentId ?? ""}
                onChange={e => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">None (top-level)</option>
                {parentOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="modal-select-chevron" />
            </div>
          </div>

          <div className="form-group">
            <label>Category Name <span className="required">*</span></label>
            <input type="text" value={form.name} onChange={handleNameChange} />
          </div>

          <div className="form-group">
            <label>Slug <span className="required">*</span></label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} />
            <span className="input-hint">Auto-generated from name</span>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="color-label"><Palette size={14} /> Color</label>
            <div className="color-picker">
              {COLORS.map(color => (
                <button
                  key={color}
                  className={`color-circle${form.color === color ? " selected" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm({ ...form, color })}
                >
                  {form.color === color && <Check size={12} color="white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="toggles-row">
            <label className="toggle-group">
              {/* 👇 Bound to form.featured 👇 */}
              <button 
                className={`modal-toggle${form.featured ? " on" : ""}`} 
                onClick={() => setForm({ ...form, featured: !form.featured })}
              >
                <span />
              </button>
              <span>Featured</span>
            </label>
            
            <label className="toggle-group">
              {/* 👇 Bound to form.inShowcase 👇 */}
              <button 
                className={`modal-toggle${form.inShowcase ? " on" : ""}`} 
                onClick={() => setForm({ ...form, inShowcase: !form.inShowcase })}
              >
                <span />
              </button>
              <span>Showcase</span>
            </label>

            <label className="toggle-group">
              {/* 👇 Bound to form.enabled 👇 */}
              <button 
                className={`modal-toggle${form.enabled ? " on" : ""}`} 
                onClick={() => setForm({ ...form, enabled: !form.enabled })}
              >
                <span />
              </button>
              <span>Active</span>
            </label>
          </div>

          <div className="preview-section">
            <p className="preview-label">PREVIEW</p>
            <div className="preview-card">
              <div className="preview-avatar" style={{ backgroundColor: form.color }}>
                {form.name.charAt(0) || "C"}
              </div>
              <div className="preview-info">
                <h4>{form.name || "Category Name"}</h4>
                <p>/{slug || "slug"}</p>
              </div>
              {form.featured && <span className="preview-featured">Featured</span>}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={() => { onSave(form); onClose(); }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}