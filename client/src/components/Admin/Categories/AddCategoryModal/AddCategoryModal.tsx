import { useState, useEffect } from "react";
import { X, Check, Palette, Plus, ChevronDown } from "lucide-react";
import "./AddCategoryModal.css";
import type { Category } from "../../NewsStore/NewsStore";

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  onAdd:      (c: Omit<Category, "id">) => void;
  categories: Category[];
}

const COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e","#10b981",
  "#06b6d4","#3b82f6","#6366f1","#a855f7","#ec4899",
];

export default function AddCategoryModal({ isOpen, onClose, onAdd, categories }: Props) {
  const [name,        setName]        = useState("");
  const [slug,        setSlug]        = useState("");
  const [description, setDescription] = useState("");
  const [color,       setColor]       = useState("#3b82f6");
  const [featured,    setFeatured]    = useState(false);
  const [enabled,     setEnabled]     = useState(true);
const [parentId, setParentId] = useState<string | null>(null);
  const [inShowcase, setInShowcase] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(""); setSlug(""); setDescription("");
      setColor("#3b82f6"); setFeatured(false);
      setEnabled(true); setParentId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setName(v);
    setSlug(v.toLowerCase().replace(/\s+/g, "-"));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({ name, description, articles: "0", views: "0", featured, enabled, color, parentId, inShowcase });
    onClose();
  };

  // Only top-level categories can be parents
  const parentOptions = categories.filter(c => !c.parentId);

  return (
    <div className="add-modal-overlay">
      <div className="add-modal-container">
        <div className="add-modal-header">
          <div className="add-modal-header-left">
            <div className="add-modal-icon-wrapper"><Plus size={18} /></div>
            <div>
              <h2 className="add-modal-title">Add Category</h2>
              <p className="add-modal-subtitle">Create a parent or sub-category</p>
            </div>
          </div>
          <button className="add-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="add-modal-body">

          {/* Parent selector */}
          <div className="add-form-group">
            <label>Parent Category</label>
            <div className="add-select-wrap">
              <select
                value={parentId ?? ""}
              onChange={e => setParentId(e.target.value || null)}                 className="add-select"
              >
                <option value="">None (top-level)</option>
                {parentOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="add-select-chevron" />
            </div>
            {parentId && (
              <span className="add-input-hint">
                Will appear as: {parentOptions.find(p => p.id === parentId)?.name} / {name || "…"}
              </span>
            )}
          </div>

          <div className="add-form-group">
            <label>Category Name <span className="add-required">*</span></label>
            <input type="text" placeholder="e.g. Cricket" value={name} onChange={handleNameChange} />
          </div>

          <div className="add-form-group">
            <label>Slug <span className="add-required">*</span></label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} />
            <span className="add-input-hint">Auto-generated from name</span>
          </div>

          <div className="add-form-group">
            <label>Description</label>
            <textarea rows={2} placeholder="Brief description..." value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="add-form-group">
            <label className="add-color-label"><Palette size={14} /> Color</label>
            <div className="add-color-picker">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`add-color-circle${color === c ? " selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                >
                  {color === c && <Check size={12} color="white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="add-toggles-row">
            <label className="add-toggle-group">
              <button className={`add-modal-toggle${featured ? " on" : ""}`} onClick={() => setFeatured(!featured)}><span /></button>
              <span>Featured</span>
            </label>
            <label className="add-toggle-group">
              <button className={`add-modal-toggle${inShowcase ? " on" : ""}`} onClick={() => setInShowcase(!inShowcase)}><span /></button>
              <span>Showcase</span> {/* 👇 THE NEW TOGGLE! */}
            </label>
            <label className="add-toggle-group">
              <button className={`add-modal-toggle${enabled ? " on" : ""}`} onClick={() => setEnabled(!enabled)}><span /></button>
              <span>Active</span>
            </label>
          </div>

          <div className="add-preview-section">
            <p className="add-preview-label">PREVIEW</p>
            <div className="add-preview-card">
              <div className="add-preview-avatar" style={{ backgroundColor: color }}>
                {name ? name.charAt(0).toUpperCase() : "?"}
              </div>
              <div className="add-preview-info">
                <h4>{name || "Category Name"}</h4>
                <p>/{slug || "slug"}</p>
              </div>
              {featured && <span className="add-preview-featured">Featured</span>}
            </div>
          </div>
        </div>

        <div className="add-modal-footer">
          <button className="add-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="add-btn-save" onClick={handleSubmit}>Create Category</button>
        </div>
      </div>
    </div>
  );
}