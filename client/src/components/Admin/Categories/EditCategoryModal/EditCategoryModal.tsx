import { useState, useEffect } from "react";
import { X, Check, Palette } from "lucide-react";
import "./EditCategoryModal.css";
import type { Category } from "../../NewsStore/NewsStore";

// Category is imported from the single shared definition — no local redeclaration.

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  /** Parent (Categories.tsx) calls updateCategory on the context then closes. */
  onSave: (updatedCategory: Category) => void;
}

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981",
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
];

export default function EditCategoryModal({
  isOpen,
  onClose,
  category,
  onSave,
}: EditCategoryModalProps) {
  const [formData, setFormData] = useState<Category | null>(null);
  const [slug, setSlug] = useState("");

  // Populate form whenever the modal opens with a category
  useEffect(() => {
    if (category) {
      setFormData(category);
      setSlug(category.name.toLowerCase().replace(/\s+/g, "-"));
    }
  }, [category]);

  if (!isOpen || !formData) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData({ ...formData, name: newName });
    setSlug(newName.toLowerCase().replace(/\s+/g, "-"));
  };

  const handleSave = () => {
    onSave(formData);  // parent handles context + toast
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit Category</h2>
            <p className="modal-subtitle">Update the category details below.</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">

          <div className="form-group">
            <label>Category Name <span className="required">*</span></label>
            <input type="text" value={formData.name} onChange={handleNameChange} />
          </div>

          <div className="form-group">
            <label>Slug <span className="required">*</span></label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <span className="input-hint">URL-friendly identifier. Auto-generated from name.</span>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Color Picker */}
          <div className="form-group">
            <label className="color-label"><Palette size={16} /> Color</label>
            <div className="color-picker">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-circle ${formData.color === color ? "selected" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                >
                  {formData.color === color && <Check size={14} color="white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="toggles-row">
            <div className="toggle-group">
              <button
                className={`modal-toggle ${formData.featured ? "on" : ""}`}
                onClick={() => setFormData({ ...formData, featured: !formData.featured })}
              ><span /></button>
              <label>Featured</label>
            </div>

            <div className="toggle-group">
              <button
                className={`modal-toggle ${formData.enabled ? "on" : ""}`}
                onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
              ><span /></button>
              <label>Active</label>
            </div>
          </div>

          {/* Preview */}
          <div className="preview-section">
            <label className="preview-label">PREVIEW</label>
            <div className="preview-card">
              <div className="preview-avatar" style={{ backgroundColor: formData.color }}>
                {formData.name.charAt(0) || "C"}
              </div>
              <div className="preview-info">
                <h4>{formData.name || "Category Name"}</h4>
                <p>/{slug || "slug"}</p>
              </div>
              {formData.featured && <span className="preview-featured">Featured</span>}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save Changes</button>
        </div>

      </div>
    </div>
  );
}