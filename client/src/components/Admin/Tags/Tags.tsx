import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Tag,
  TrendingUp,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import "./Tags.css";
import {
  getAllTags,
  createTag,
  deleteTag as deleteTagApi,
  type Tag as TagType,
} from "../../../api/tags.api";

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

/** Title-case: "budget 2025" → "Budget 2025" */
function normalizeTagName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── AddTagModal ──────────────────────────────────────────────────────────────
interface AddTagModalProps {
  existingNames: string[];
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}

function AddTagModal({ existingNames, onSave, onClose }: AddTagModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const normalized = name.trim() ? normalizeTagName(name) : "";
  const slug = normalized ? toSlug(normalized) : "";

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Tag name is required."); return; }
    const norm = normalizeTagName(trimmed);
    if (existingNames.some((n) => n.toLowerCase() === norm.toLowerCase())) {
      setError("A tag with this name already exists.");
      return;
    }
    setSaving(true);
    try {
      await onSave(norm);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create tag.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tags-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
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
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. Budget 2025"
              disabled={saving}
            />
            {normalized && name.trim() && (
              <span className="tags-modal-preview-name">
                Will be saved as: <strong>{normalized}</strong>
              </span>
            )}
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
          <button className="tags-modal-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="tags-modal-save" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={14} className="tags-spin" /> : <Check size={14} />}
            {saving ? "Creating…" : "Create Tag"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DeleteConfirm ────────────────────────────────────────────────────────────
function DeleteConfirm({
  name,
  articleCount,
  onConfirm,
  onCancel,
  deleting,
}: {
  name: string;
  articleCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="tags-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="tags-delete-modal" role="dialog" aria-modal="true">
        <div className="tags-delete-icon"><Trash2 size={22} /></div>
        <h3>Delete "{name}"?</h3>
        <p>
          This tag is used in <strong>{articleCount}</strong> article{articleCount !== 1 ? "s" : ""}.
          Removing it will unlink it from those articles permanently.
        </p>
        <div className="tags-delete-actions">
          <button className="tags-modal-cancel" onClick={onCancel} disabled={deleting}>Cancel</button>
          <button className="tags-btn-delete" onClick={onConfirm} disabled={deleting}>
            {deleting ? <Loader2 size={14} className="tags-spin" /> : <Trash2 size={14} />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Tags() {
  const [allTags,       setAllTags]       = useState<TagType[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [showAdd,       setShowAdd]       = useState(false);
  const [deleteTagItem, setDeleteTagItem] = useState<TagType | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [apiError,      setApiError]      = useState<string | null>(null);

  // ── Load all tags from API ─────────────────────────────────────────────────
  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllTags();
      setAllTags(Array.isArray(all) ? all : []);
      setApiError(null);
    } catch {
      setApiError("Failed to load tags. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTags(); }, [loadTags]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const existingNames = allTags.map((t) => t.name);

  // Trending = only tags used in at least 1 article, sorted by usage desc
  const trendingTags = useMemo(
    () =>
      allTags
        .filter((t) => (t._count?.articles ?? 0) > 0)
        .sort((a, b) => (b._count?.articles ?? 0) - (a._count?.articles ?? 0))
        .slice(0, 12),
    [allTags]
  );

  const filtered = useMemo(
    () =>
      allTags.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.slug.toLowerCase().includes(search.toLowerCase())
      ),
    [allTags, search]
  );

  const totalTagged  = allTags.reduce((s, t) => s + (t._count?.articles ?? 0), 0);
  const withArticles = allTags.filter((t) => (t._count?.articles ?? 0) > 0).length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAdd = async (name: string) => {
    await createTag(name);
    await loadTags();
    setShowAdd(false);
  };

  const handleDelete = async () => {
    if (!deleteTagItem) return;
    setDeleting(true);
    try {
      await deleteTagApi(deleteTagItem.id);
      await loadTags();
      setDeleteTagItem(null);
    } catch {
      setApiError("Failed to delete tag.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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

        {apiError && (
          <div className="tags-api-error">
            <AlertTriangle size={16} /> {apiError}
            <button onClick={() => { setApiError(null); loadTags(); }}>Retry</button>
          </div>
        )}

        {/* STATS */}
        <div className="tags-stats">
          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-gray"><Tag size={20} /></div>
            <div>
              <div className="tags-stat-value">{loading ? "—" : allTags.length}</div>
              <div className="tags-stat-label">Total Tags</div>
            </div>
          </div>
          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-blue"><TrendingUp size={20} /></div>
            <div>
              <div className="tags-stat-value">{loading ? "—" : trendingTags.length}</div>
              <div className="tags-stat-label">Trending Tags</div>
            </div>
          </div>
          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-green"><FileText size={20} /></div>
            <div>
              <div className="tags-stat-value">{loading ? "—" : totalTagged.toLocaleString()}</div>
              <div className="tags-stat-label">Tagged Articles</div>
            </div>
          </div>
          <div className="tags-stat-card">
            <div className="tags-stat-icon bg-gray"><Tag size={20} /></div>
            <div>
              <div className="tags-stat-value">{loading ? "—" : withArticles}</div>
              <div className="tags-stat-label">Active Tags</div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="tags-grid">

          {/* LEFT — TRENDING TAGS */}
          <div className="tags-popular">
            <div className="tags-section-header">
              <TrendingUp size={18} />
              <h2>Trending Tags</h2>
            </div>

            {loading ? (
              <div className="tags-loading">
                <Loader2 size={18} className="tags-spin" /> Loading…
              </div>
            ) : trendingTags.length === 0 ? (
              <div className="tags-empty-state">
                <TrendingUp size={32} className="tags-empty-icon" />
                <p className="tags-empty-title">No trending tags yet</p>
                <p className="tags-empty-desc">
                  Tags appear here once they are used in published articles.
                </p>
              </div>
            ) : (
              <div className="tags-chip-wrap">
                {trendingTags.map((t) => (
                  <span
                    key={t.id}
                    className="tags-chip"
                    title={`${t._count?.articles} article${(t._count?.articles ?? 0) !== 1 ? "s" : ""}`}
                  >
                    {t.name}
                    <span className="tags-chip-count"> ({t._count?.articles})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — ALL TAGS TABLE */}
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
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="tags-search-clear" onClick={() => setSearch("")}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="tags-list">
              {loading ? (
                <div className="tags-loading tags-loading--center">
                  <Loader2 size={22} className="tags-spin" /> Loading tags…
                </div>
              ) : filtered.length === 0 ? (
                <div className="tags-no-results">
                  {search
                    ? `No tags matching "${search}"`
                    : "No tags yet — click Add Tag to create one."}
                </div>
              ) : (
                filtered.map((t) => (
                  <div key={t.id} className="tags-row">
                    <div className="tags-row-left">
                      <div className="tags-icon-box"><Tag size={16} /></div>
                      <div>
                        <div className="tags-name">{t.name}</div>
                        <div className="tags-slug">{toSlug(t.name)}</div>
                      </div>
                    </div>
                    <div className="tags-row-right">
                      <div className="tags-count">
                        <div className="count">{t._count?.articles ?? 0}</div>
                        <div className="label">Articles</div>
                      </div>
                      <div className="tags-date">
                        {(t as unknown as { createdAt?: string }).createdAt
                          ? formatDate((t as unknown as { createdAt: string }).createdAt)
                          : "—"}
                      </div>
                      <div className="tags-actions">
                        <button
                          className="icon-btn delete"
                          title="Delete tag"
                          onClick={() => setDeleteTagItem(t)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
      {deleteTagItem && (
        <DeleteConfirm
          name={deleteTagItem.name}
          articleCount={deleteTagItem._count?.articles ?? 0}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTagItem(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}