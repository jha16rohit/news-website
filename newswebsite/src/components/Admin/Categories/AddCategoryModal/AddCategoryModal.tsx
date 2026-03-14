import { useState, useEffect } from "react";
import { X, Check, Palette, Plus } from "lucide-react";
import "./AddCategoryModal.css";

export interface Category {
  id: number;
  name: string;
  description: string;
  articles: string;
  views: string;
  featured: boolean;
  enabled: boolean;
  color: string;
}

// ---> THIS WAS MISSING! <---
interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newCategory: Category) => void;
}

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981", 
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"
];

export default function AddCategoryModal({ isOpen, onClose, onAdd }: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6"); // Default to blue
  const [featured, setFeatured] = useState(false);
  const [enabled, setEnabled] = useState(true);

  // Reset the form every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setSlug("");
      setDescription("");
      setColor("#3b82f6");
      setFeatured(false);
      setEnabled(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(newName.toLowerCase().replace(/\s+/g, '-'));
  };

  const handleSubmit = () => {
    if (!name.trim()) return; // Prevent adding empty categories

    const newCategory: Category = {
      id: Date.now(), // Generate a unique ID
      name,
      description,
      articles: "0", // Default starting stats
      views: "0",
      featured,
      enabled,
      color,
    };

    onAdd(newCategory);
    onClose();
  };

  return (
    <div className="add-modal-overlay">
      <div className="add-modal-container">
        
        {/* Header */}
        <div className="add-modal-header">
          <div className="add-modal-header-left">
            <div className="add-modal-icon-wrapper">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="add-modal-title">Add New Category</h2>
              <p className="add-modal-subtitle">Fill in the details to create a new category.</p>
            </div>
          </div>
          <button className="add-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="add-modal-body">
          
          <div className="add-form-group">
            <label>Category Name <span className="add-required">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. Technology"
              value={name} 
              onChange={handleNameChange} 
            />
          </div>

          <div className="add-form-group">
            <label>Slug <span className="add-required">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. technology"
              value={slug} 
              onChange={(e) => setSlug(e.target.value)} 
            />
            <span className="add-input-hint">URL-friendly identifier. Auto-generated from name.</span>
          </div>

          <div className="add-form-group">
            <label>Description</label>
            <textarea 
              rows={3} 
              placeholder="Brief description of this category..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Color Picker */}
          <div className="add-form-group">
            <label className="add-color-label"><Palette size={16} /> Color</label>
            <div className="add-color-picker">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`add-color-circle ${color === c ? "selected" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                >
                  {color === c && <Check size={14} color="white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="add-toggles-row">
            <div className="add-toggle-group">
              <button
                className={`add-modal-toggle ${featured ? "on" : ""}`}
                onClick={() => setFeatured(!featured)}
              ><span /></button>
              <label>Featured</label>
            </div>
            
            <div className="add-toggle-group">
              <button
                className={`add-modal-toggle ${enabled ? "on" : ""}`}
                onClick={() => setEnabled(!enabled)}
              ><span /></button>
              <label>Active</label>
            </div>
          </div>

          {/* Preview */}
          <div className="add-preview-section">
            <label className="add-preview-label">PREVIEW</label>
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

        {/* Footer */}
        <div className="add-modal-footer">
          <button className="add-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="add-btn-save" onClick={handleSubmit}>Create Category</button>
        </div>

      </div>
    </div>
  );
}