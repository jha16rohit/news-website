import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Plus,
  Search,
  Edit2,
  Eye,
  Trash2,
  X,
  FileText,
  Instagram,
  Facebook,
  Upload,
} from "lucide-react";
import "./TopicProfiles.css";

import { FaXTwitter } from "react-icons/fa6";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Profile {
  id: number;
  name: string;
  slug: string;
  caption: string;
  description: string;
  instagram: string;
  facebook: string;
  twitter: string;
  imageUrl?: string;
  linkedArticles: number;
}

const STORAGE_KEY = "topic_profiles";

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // default seed data
  return [
    {
      id: 1,
      name: "Narendra Modi",
      slug: "narendra-modi",
      caption: "Prime Minister of India",
      description:
        "Narendra Damodardas Modi is an Indian politician serving as the Prime Minister of India since 2014. He is a member of the Bharatiya Janata Party.",
      instagram: "",
      facebook: "",
      twitter: "",
      linkedArticles: 42,
    },
    {
      id: 2,
      name: "Virat Kohli",
      slug: "virat-kohli",
      caption: "Indian Cricketer",
      description:
        "Virat Kohli is an Indian international cricketer and former captain of the India national cricket team. He is widely regarded as one of the greatest batsmen of all time.",
      instagram: "",
      facebook: "",
      twitter: "",
      linkedArticles: 38,
    },
    {
      id: 3,
      name: "Elon Musk",
      slug: "elon-musk",
      caption: "CEO of Tesla & SpaceX",
      description:
        "Elon Reeve Musk is a businessman known for his key roles in Tesla, SpaceX, and various other ventures. He is one of the wealthiest people in the world.",
      instagram: "",
      facebook: "",
      twitter: "",
      linkedArticles: 27,
    },
  ];
}

function saveProfiles(profiles: Profile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Modal form ──────────────────────────────────────────────────────────────
interface ProfileFormProps {
  initial?: Partial<Profile>;
  onSave: (data: Omit<Profile, "id" | "linkedArticles">) => void;
  onClose: () => void;
}

function ProfileForm({ initial, onSave, onClose }: ProfileFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [instagram, setInstagram] = useState(initial?.instagram ?? "");
  const [facebook, setFacebook] = useState(initial?.facebook ?? "");
  const [twitter, setTwitter] = useState(initial?.twitter ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const [isWikiLoading, setIsWikiLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!initial?.slug) setSlug(toSlug(v));
  };

  // Helper function to read the image file
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleQuickSearch = (platform: string) => {
    if (!name.trim()) {
      alert("Please enter the person's Name at the top first!");
      return;
    }
    const query = encodeURIComponent(`${name} official ${platform}`);
    window.open(`https://www.google.com/search?q=${query}`, "_blank");
  };

  const handleFetchWiki = async () => {
    if (!name.trim()) {
      alert("Please enter the Name first so I know who to search for on Wikipedia!");
      return;
    }
    setIsWikiLoading(true);
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&format=json&origin=*&titles=${encodeURIComponent(name)}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId === "-1") {
          alert("Could not find a Wikipedia page matching that exact name.");
        } else if (pages[pageId].extract) {
          let fullText = pages[pageId].extract;
          if (fullText.length > 6000) {
            let choppedText = fullText.substring(0, 6000);
            choppedText = choppedText.substring(0, choppedText.lastIndexOf(".")) + ".";
            setDescription(choppedText);
          } else {
            setDescription(fullText);
          }
        } else {
          alert("Wikipedia didn't return a description for this name.");
        }
      } else {
        alert("Could not connect to Wikipedia.");
      }
    } catch (error) {
      alert("Failed to connect to Wikipedia.");
    } finally {
      setIsWikiLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !description.trim()) return;
    onSave({ name, slug, caption, description, instagram, facebook, twitter, imageUrl });
  };

  return (
    <div className="tp-overlay" onClick={onClose}>
      <div className="tp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tp-modal-header">
          <h2>{initial?.id ? "Edit Profile" : "Create New Profile"}</h2>
          <p>Fill in the details to create a new person or topic profile.</p>
          <button className="tp-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="tp-modal-body">
          {/* Basic Information */}
          <div className="tp-section-label">
            <User size={14} />
            Basic Information
          </div>

          <div className="tp-row-2">
            <div className="tp-field">
              <label>Name <span className="required">*</span></label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="tp-field">
              <label>URL Slug <span className="required">*</span></label>
              <div className="tp-slug-wrap">
                <span className="tp-slug-prefix">/topic/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="tp-slug-input"
                />
              </div>
            </div>
          </div>

          {/* Profile Image */}
          <div className="tp-section-label" style={{ marginTop: 16 }}>
            <FileText size={14} />
            Profile Image
          </div>

          <div
            className={`tp-upload-zone ${isDragging ? "dragging" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={imageUrl ? { padding: 0, border: "none" } : {}}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="preview" className="tp-upload-preview" />
            ) : (
              <>
                <Upload size={28} strokeWidth={1.5} />
                <span>{isDragging ? "Drop image here!" : "Click to upload or drag & drop"}</span>
                <small>PNG, JPG up to 5MB</small>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />

          <div className="tp-field" style={{ marginTop: 12 }}>
            <label>Image Caption (Red Highlight Tag)</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="tp-field" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Description / Biography <span className="required">*</span></label>
              <button 
                type="button" 
                className="tp-wiki-fetch-btn" 
                onClick={handleFetchWiki}
                disabled={isWikiLoading}
              >
                {isWikiLoading ? "Fetching..." : "✨ Auto-Fetch from Wikipedia"}
              </button>
            </div>
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a detailed biography or click Auto-Fetch..."
              rows={8}
            />
          </div>

          {/* Social Media */}
          <div className="tp-section-label" style={{ marginTop: 16 }}>
            Social Media Links
          </div>

          <div className="tp-social-field">
            <span className="tp-social-icon tp-ig"><Instagram size={16} /></span>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/username"
            />
            <button type="button" className="tp-quick-search-btn" onClick={() => handleQuickSearch("Instagram")} title="Find Instagram">
              <Search size={14} />
            </button>
          </div>

          <div className="tp-social-field">
            <span className="tp-social-icon tp-fb"><Facebook size={16} /></span>
            <input
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/username"
            />
            <button type="button" className="tp-quick-search-btn" onClick={() => handleQuickSearch("Facebook")} title="Find Facebook">
              <Search size={14} />
            </button>
          </div>

          <div className="tp-social-field">
            <span className="tp-social-icon tp-tw"><FaXTwitter size={16} /></span>
            <input
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://x.com/username"
            />
            <button type="button" className="tp-quick-search-btn" onClick={() => handleQuickSearch("Twitter")} title="Find Twitter">
              <Search size={14} />
            </button>
          </div>

          {/* Preview */}
          <div className="tp-preview-label">Preview</div>
          <div className="tp-preview-card">
            <div className="tp-preview-avatar">
              {imageUrl ? <img src={imageUrl} alt="" /> : <User size={20} />}
            </div>
            <div>
              <div className="tp-preview-name">{name || "Person Name"}</div>
              <div className="tp-preview-caption">{caption || "Caption"}</div>
              <div className="tp-preview-slug">/topic/{slug || "slug"}</div>
            </div>
          </div>
        </div>

        <div className="tp-modal-footer">
          <button className="tp-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="tp-btn-create" onClick={handleSubmit}>
            {initial?.id ? "Save Changes" : "Create Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="tp-overlay" onClick={onCancel}>
      <div className="tp-delete-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Delete Profile?</h3>
        <p>This will permanently remove the profile and unlink it from all associated articles.</p>
        <div className="tp-delete-actions">
          <button className="tp-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="tp-btn-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TopicProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setProfiles(loadProfiles());
  }, []);

  const persist = (updated: Profile[]) => {
    setProfiles(updated);
    saveProfiles(updated);
  };

  const handleCreate = (data: Omit<Profile, "id" | "linkedArticles">) => {
    const newProfile: Profile = {
      ...data,
      id: Date.now(),
      linkedArticles: 0,
    };
    persist([...profiles, newProfile]);
    setShowCreate(false);
  };

  const handleEdit = (data: Omit<Profile, "id" | "linkedArticles">) => {
    if (!editingProfile) return;
    persist(
      profiles.map((p) =>
        p.id === editingProfile.id ? { ...p, ...data } : p
      )
    );
    setEditingProfile(null);
  };

  const handleDelete = (id: number) => {
    persist(profiles.filter((p) => p.id !== id));
    setDeletingId(null);
  };

  const filtered = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.caption.toLowerCase().includes(search.toLowerCase())
  );

  const totalLinked = profiles.reduce((s, p) => s + p.linkedArticles, 0);

  return (
    <div className="tp-page">
      {/* Header */}
      <div className="tp-header">
        <div>
          <h1 className="tp-title">Topic Profiles</h1>
          <p className="tp-subtitle">Create and manage profiles for people and topics linked in articles</p>
        </div>
        <button className="tp-btn-new" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Create Profile
        </button>
      </div>

      {/* Stats */}
      <div className="tp-stats">
        <div className="tp-stat-card">
          <div className="tp-stat-icon tp-icon-blue"><User size={20} /></div>
          <div>
            <div className="tp-stat-num">{profiles.length}</div>
            <div className="tp-stat-label">Total Profiles</div>
          </div>
        </div>
        <div className="tp-stat-card">
          <div className="tp-stat-icon tp-icon-green"><User size={20} /></div>
          <div>
            <div className="tp-stat-num">{profiles.length}</div>
            <div className="tp-stat-label">Active</div>
          </div>
        </div>
        <div className="tp-stat-card">
          <div className="tp-stat-icon tp-icon-yellow"><FileText size={20} /></div>
          <div>
            <div className="tp-stat-num">{totalLinked}</div>
            <div className="tp-stat-label">Linked Articles</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="tp-search-wrap">
        <Search size={16} className="tp-search-icon" />
        <input
          className="tp-search"
          placeholder="Search profiles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Profile Cards */}
      <div className="tp-grid">
        {filtered.map((profile) => (
          <div className="tp-card" key={profile.id}>
            <div className="tp-card-banner" />
            <div className="tp-card-avatar">
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt={profile.name} />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="tp-card-body">
              <div className="tp-card-name">{profile.name}</div>
              <div className="tp-card-caption">{profile.caption}</div>
              <div className="tp-card-slug">/topic/{profile.slug}</div>
              <p className="tp-card-desc">{profile.description}</p>

              <div className="tp-card-socials">
                {profile.instagram && (
                  <a href={profile.instagram} target="_blank" rel="noreferrer">
                    <Instagram size={15} />
                  </a>
                )}
                {profile.facebook && (
                  <a href={profile.facebook} target="_blank" rel="noreferrer">
                    <Facebook size={15} />
                  </a>
                )}
                {profile.twitter && (
                  <a href={profile.twitter} target="_blank" rel="noreferrer">
                    <FaXTwitter size={15} />
                  </a>
                )}
              </div>

              <div className="tp-card-articles">
                <FileText size={13} />
                {profile.linkedArticles} linked articles
              </div>
            </div>

            <div className="tp-card-actions">
              <button className="tp-action-btn" onClick={() => setEditingProfile(profile)}>
                <Edit2 size={14} /> Edit
              </button>
              <button className="tp-action-btn">
                <Eye size={14} /> View
              </button>
              <button className="tp-action-btn tp-action-delete" onClick={() => setDeletingId(profile.id)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="tp-empty">No profiles found.</div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <ProfileForm onSave={handleCreate} onClose={() => setShowCreate(false)} />
      )}
      {editingProfile && (
        <ProfileForm
          initial={editingProfile}
          onSave={handleEdit}
          onClose={() => setEditingProfile(null)}
        />
      )}
      {deletingId !== null && (
        <DeleteConfirm
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}