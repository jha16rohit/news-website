import { useState, useMemo } from "react";
import {
  Tag,
  TrendingUp,
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import "./Tags.css";
import { useNews } from "../NewsStore/NewsStore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TagItem {
  id:       number;
  name:     string;
  slug:     string;
  articles: number;   // computed from articles store
  date:     string;   // ISO creation date
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toSlug(name: string) {
  return (
    "/" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Persistent tag store in localStorage so tags survive refreshes
const TAGS_STORAGE_KEY = "cms_tags";

interface StoredTag {
  id:   number;
  name: string;
  date: string;
}

function loadStoredTags(): StoredTag[] {
  try {
    const raw = localStorage.getItem(TAGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Seed defaults matching the original static data
  return [
    { id: 1, name: "Elections 2024", date: "2024-01-15T00:00:00Z" },
    { id: 2, name: "Budget 2024",    date: "2024-02-01T00:00:00Z" },
    { id: 3, name: "IPL 2024",       date: "2024-03-01T00:00:00Z" },
    { id: 4, name: "Stock Market",   date: "2024-01-01T00:00:00Z" },
  ];
}

function saveStoredTags(tags: StoredTag[]) {
  localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
}

// ─── AddTagModal ──────────────────────────────────────────────────────────────
interface AddTagModalProps {
  existingNames: string[];
  onSave:  (name: string) => void;
  onClose: () => void;
}

function AddTagModal({ existingNames, onSave, onClose }: AddTagModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const slug = name.trim() ? toSlug(name) : "";

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Tag name is required."); return; }
    if (existingNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
      setError("A tag with this name already exists.");
      return;
    }
    onSave(trimmed);
  };

  return (
    <div className="tags-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tags-modal" role="dialog" aria-modal="true">
        <div className="tags-modal-header">
          <div className="tags-modal-title-wrap">
            <div className="tags-modal-icon"><Tag size={18} /></div>
            <div>
              <h2>Add New Tag</h2>
              <p>Tags help readers discover related content.</p>
            </div>
          </div>
          <button className="tags-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="tags-modal-body">
          <div className="tags-modal-field">
            <label>Tag Name <span className="tags-required">*</span></label>
            <input
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. Budget 2025"
            />
            {error && (
              <span className="tags-modal-error">
                <AlertTriangle size={13} /> {error}
              </span>
            )}
          </div>
          {slug && (
            <div className="tags-modal-field">
              <label>URL Slug <span className="tags-muted">(auto-generated)</span></label>
              <div className="tags-slug-preview">{slug}</div>
            </div>
          )}
        </div>

        <div className="tags-modal-footer">
          <button className="tags-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="tags-modal-save" onClick={handleSubmit}>
            <Check size={14} /> Create Tag
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EditTagModal ─────────────────────────────────────────────────────────────
interface EditTagModalProps {
  tag:           StoredTag;
  existingNames: string[];
  onSave:        (id: number, newName: string) => void;
  onClose:       () => void;
}

function EditTagModal({ tag, existingNames, onSave, onClose }: EditTagModalProps) {
  const [name, setName] = useState(tag.name);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Tag name is required."); return; }
    if (
      trimmed.toLowerCase() !== tag.name.toLowerCase() &&
      existingNames.some(n => n.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError("A tag with this name already exists.");
      return;
    }
    onSave(tag.id, trimmed);
  };

  return (
    <div className="tags-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tags-modal" role="dialog" aria-modal="true">
        <div className="tags-modal-header">
          <div className="tags-modal-title-wrap">
            <div className="tags-modal-icon"><Pencil size={18} /></div>
            <div>
              <h2>Edit Tag</h2>
              <p>Update the tag name. Articles using this tag will be updated automatically.</p>
            </div>
          </div>
          <button className="tags-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="tags-modal-body">
          <div className="tags-modal-field">
            <label>Tag Name <span className="tags-required">*</span></label>
            <input
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            {error && (
              <span className="tags-modal-error">
                <AlertTriangle size={13} /> {error}
              </span>
            )}
          </div>
          <div className="tags-modal-field">
            <label>URL Slug <span className="tags-muted">(auto-generated)</span></label>
            <div className="tags-slug-preview">{toSlug(name)}</div>
          </div>
        </div>
        <div className="tags-modal-footer">
          <button className="tags-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="tags-modal-save" onClick={handleSubmit}>
            <Check size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DeleteConfirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ name, articleCount, onConfirm, onCancel }:
  { name: string; articleCount: number; onConfirm: () => void; onCancel: () => void }
) {
  return (
    <div className="tags-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="tags-delete-modal" role="dialog" aria-modal="true">
        <div className="tags-delete-icon"><Trash2 size={22} /></div>
        <h3>Delete "{name}"?</h3>
        <p>
          This tag is used in <strong>{articleCount}</strong> article{articleCount !== 1 ? "s" : ""}.
          Removing it will unlink it from those articles permanently.
        </p>
        <div className="tags-delete-actions">
          <button className="tags-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="tags-btn-delete" onClick={onConfirm}><Trash2 size={14} /> Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Tags() {
  const { articles } = useNews();

  // Load tags from localStorage, keep in component state
  const [storedTags, setStoredTags] = useState<StoredTag[]>(() => loadStoredTags());
  const [search,     setSearch]     = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [editTag,    setEditTag]    = useState<StoredTag | null>(null);
  const [deleteTag,  setDeleteTag]  = useState<StoredTag | null>(null);

  // Persist helper
  const persist = (tags: StoredTag[]) => {
    setStoredTags(tags);
    saveStoredTags(tags);
  };

  // Compute article counts from NewsStore
  // Each article has tags[] stored as strings; we match by name (case-insensitive)
  const articleCountByTag = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const article of articles) {
      const rawTags: string[] = (article as unknown as { tags?: string[] }).tags ?? [];
      for (const t of rawTags) {
        const key = t.toLowerCase().trim();
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }, [articles]);

  // Build full TagItem list
  const tagItems: TagItem[] = useMemo(() =>
    storedTags.map(t => ({
      id:       t.id,
      name:     t.name,
      slug:     toSlug(t.name),
      articles: articleCountByTag[t.name.toLowerCase().trim()] ?? 0,
      date:     formatDate(t.date),
    })),
  [storedTags, articleCountByTag]);

  // Filtered list
  const filtered = useMemo(() =>
    tagItems.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
    ),
  [tagItems, search]);

  // Popular: top 12 by article count, then alphabetically
  const popular = useMemo(() =>
    [...tagItems]
      .sort((a, b) => b.articles - a.articles || a.name.localeCompare(b.name))
      .slice(0, 12),
  [tagItems]);

  // Stats
  const totalTagged   = tagItems.reduce((s, t) => s + t.articles, 0);
  const newThisWeek   = storedTags.filter(t => {
    const d = new Date(t.date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;
  const trending      = tagItems.filter(t => t.articles > 0).length;
  const existingNames = storedTags.map(t => t.name);

  // Handlers
  const handleAdd = (name: string) => {
    const tag: StoredTag = { id: Date.now(), name, date: new Date().toISOString() };
    persist([...storedTags, tag]);
    setShowAdd(false);
  };

  const handleEdit = (id: number, newName: string) => {
    persist(storedTags.map(t => t.id === id ? { ...t, name: newName } : t));
    setEditTag(null);
  };

  const handleDelete = (id: number) => {
    persist(storedTags.filter(t => t.id !== id));
    setDeleteTag(null);
  };

  return (
    <div className="tags-root">
      <div className="tags-container">

        {/* HEADER */}
        <div className="tags-header">
          <div>
            <h1 className="tags-title">Tags</h1>
            <p className="tags-subtitle">Manage tags for better content discovery</p>
          </div>
          <button className="tags-add-btn" onClick={() => setShowAdd(true)}>
            <Plus size={16} />
            Add Tag
          </button>
        </div>

        {/* STATS */}
        <div className="tags-stats">
          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-gray"><Tag size={20} /></div>
            <div>
              <div className="tags-stat-value">{tagItems.length}</div>
              <div className="tags-stat-label">Total Tags</div>
            </div>
          </div>
          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-blue"><TrendingUp size={20} /></div>
            <div>
              <div className="tags-stat-value">{trending}</div>
              <div className="tags-stat-label">With Articles</div>
            </div>
          </div>
          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-green"><FileText size={20} /></div>
            <div>
              <div className="tags-stat-value">{totalTagged.toLocaleString()}</div>
              <div className="tags-stat-label">Tagged Articles</div>
            </div>
          </div>
          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-gray"><Tag size={20} /></div>
            <div>
              <div className="tags-stat-value">{newThisWeek}</div>
              <div className="tags-stat-label">New This Week</div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="tags-grid">

          {/* LEFT - POPULAR TAGS */}
          <div className="tags-popular">
            <div className="tags-section-header">
              <TrendingUp size={18} />
              <h2>Popular Tags</h2>
            </div>
            <div className="tags-chip-wrap">
              {popular.length === 0 && (
                <span className="tags-empty-msg">No tags yet. Add some!</span>
              )}
              {popular.map(t => (
                <span
                  key={t.id}
                  className="tags-chip"
                  title={`${t.articles} article${t.articles !== 1 ? "s" : ""}`}
                >
                  {t.name}
                  {t.articles > 0 && (
                    <span className="tags-chip-count"> ({t.articles})</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT - ALL TAGS */}
          <div className="tags-all">
            <div className="tags-section-header between">
              <div className="flex">
                <Tag size={18} />
                <h2>All Tags</h2>
              </div>
              <div className="tags-search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="tags-search-clear" onClick={() => setSearch("")}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="tags-list">
              {filtered.length === 0 && (
                <div className="tags-no-results">
                  {search
                    ? `No tags matching "${search}"`
                    : "No tags yet — click Add Tag to create one."}
                </div>
              )}
              {filtered.map(t => (
                <div key={t.id} className="tags-row">
                  <div className="tags-row-left">
                    <div className="tags-icon-box"><Tag size={16} /></div>
                    <div>
                      <div className="tags-name">{t.name}</div>
                      <div className="tags-slug">{t.slug}</div>
                    </div>
                  </div>
                  <div className="tags-row-right">
                    <div className="tags-count">
                      <div className="count">{t.articles}</div>
                      <div className="label">Articles</div>
                    </div>
                    <div className="tags-date">{t.date}</div>
                    <div className="tags-actions">
                      <button
                        className="icon-btn"
                        title="Edit tag"
                        onClick={() => setEditTag(storedTags.find(s => s.id === t.id) ?? null)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="icon-btn delete"
                        title="Delete tag"
                        onClick={() => setDeleteTag(storedTags.find(s => s.id === t.id) ?? null)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddTagModal
          existingNames={existingNames}
          onSave={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editTag && (
        <EditTagModal
          tag={editTag}
          existingNames={existingNames}
          onSave={handleEdit}
          onClose={() => setEditTag(null)}
        />
      )}
      {deleteTag && (
        <DeleteConfirm
          name={deleteTag.name}
          articleCount={articleCountByTag[deleteTag.name.toLowerCase().trim()] ?? 0}
          onConfirm={() => handleDelete(deleteTag.id)}
          onCancel={() => setDeleteTag(null)}
        />
      )}
    </div>
  );
}