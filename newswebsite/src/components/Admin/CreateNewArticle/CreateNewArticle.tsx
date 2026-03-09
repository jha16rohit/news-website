import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./CreateNewArticle.css";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Video,
  Upload,
  Globe,
} from "lucide-react";

type ArticleType =
  | "Standard Article"
  | "Breaking News"
  | "Exclusive Story"
  | "Opinion / Editorial"
  | "Live Updates"
  | "Video Story"
  | "Photo Gallery";

const ARTICLE_TYPES: { label: ArticleType; icon: string }[] = [
  { label: "Standard Article", icon: "📄" },
  { label: "Breaking News", icon: "🔴" },
  { label: "Exclusive Story", icon: "⭐" },
  { label: "Opinion / Editorial", icon: "✏️" },
  { label: "Live Updates", icon: "📡" },
  { label: "Video Story", icon: "🎬" },
  { label: "Photo Gallery", icon: "🖼️" },
];

const SUGGESTED_TAGS = ["India", "Economy", "Government", "Reform"];

/* ─── Custom Select Component ─────────────────────────────── */
interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; avatar?: string }[];
  placeholder?: string;
  withAvatar?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  withAvatar = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel = selectedOption?.label ?? "";

  return (
    <div className="cna-custom-select" ref={ref}>
      <button
        type="button"
        className={`cna-select-trigger${open ? " cna-select-trigger--open" : ""}`}
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cna-select-trigger-left">
          {withAvatar && selectedLabel && (
            <span className="cna-author-avatar cna-author-avatar--sm">
              {selectedLabel.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className={selectedLabel ? "cna-select-value" : "cna-select-placeholder"}>
            {selectedLabel || placeholder}
          </span>
        </span>
        <svg
          className={`cna-select-chevron${open ? " cna-select-chevron--open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M2.5 5L7 9.5L11.5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul className="cna-select-dropdown" role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`cna-select-option${opt.value === value ? " cna-select-option--selected" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {withAvatar && (
                <span className="cna-author-avatar cna-author-avatar--sm">
                  {opt.label.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              )}
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ─── SEO Tab types ───────────────────────────────────────── */
type SeoTab = "settings" | "google";

/* ─── Query param → ArticleType map ──────────────────────── */
const TYPE_PARAM_MAP: Record<string, ArticleType> = {
  breaking:  "Breaking News",
  exclusive: "Exclusive Story",
  opinion:   "Opinion / Editorial",
  live:      "Live Updates",
  video:     "Video Story",
  gallery:   "Photo Gallery",
};

/* ─── Main Component ──────────────────────────────────────── */
const CreateNewArticle: React.FC = () => {
  const routerLocation = useLocation();

  const getInitialType = (): ArticleType => {
    const params = new URLSearchParams(routerLocation.search);
    const type = params.get("type") ?? "";
    return TYPE_PARAM_MAP[type] ?? "Standard Article";
  };

  const [selectedType, setSelectedType] = useState<ArticleType>(getInitialType);
  const [headline, setHeadline] = useState("");
  const [shortTitle, setShortTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>(["Politics", "Parliament", "Budget"]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("english");
  const [articleLocation, setArticleLocation] = useState("");
  const [author, setAuthor] = useState("editor-admin");
  const [editorialPriority, setEditorialPriority] = useState({
    breakingNews: false,
    topStory: false,
    pinToHomepage: false,
    categoryFeatured: false,
  });

  // Breaking News panel
  const [breakingToggles, setBreakingToggles] = useState({ newsTicker: true, pushNotification: true, homepageAlert: true });
  const toggleBreaking = (key: keyof typeof breakingToggles) =>
    setBreakingToggles((p) => ({ ...p, [key]: !p[key] }));

  // Exclusive Story panel
  const [exclusiveToggles, setExclusiveToggles] = useState({ featureOnHomepage: true, premiumOnly: false });
  const toggleExclusive = (key: keyof typeof exclusiveToggles) =>
    setExclusiveToggles((p) => ({ ...p, [key]: !p[key] }));

  // Opinion / Editorial panel
  const [authorBio, setAuthorBio] = useState("");
  const [disclaimer, setDisclaimer] = useState("Views expressed are personal and do not represent the views of this publication.");
  const [opinionToggles, setOpinionToggles] = useState({ showAuthorPhoto: true, allowComments: true });
  const toggleOpinion = (key: keyof typeof opinionToggles) =>
    setOpinionToggles((p) => ({ ...p, [key]: !p[key] }));

  // Live Updates panel
  const [liveInput, setLiveInput] = useState("");
  const [liveUpdates, setLiveUpdates] = useState([
    { id: 1, time: "10:30 AM", text: "Initial report coming in..." },
  ]);
  const addLiveUpdate = () => {
    if (!liveInput.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setLiveUpdates((p) => [...p, { id: Date.now(), time, text: liveInput.trim() }]);
    setLiveInput("");
  };
  const removeLiveUpdate = (id: number) => setLiveUpdates((p) => p.filter((u) => u.id !== id));

  // Video Story panel
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("00:00");
  const [videoQuality, setVideoQuality] = useState("1080p");
  const videoFileRef = useRef<HTMLInputElement>(null);

  // Photo Gallery panel
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const handleGalleryFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        setGalleryImages((p) => [...p, URL.createObjectURL(file)]);
      }
    });
  };

  // Featured Media
  const [dragOver, setDragOver] = useState(false);
  const [, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [photoCredit, setPhotoCredit] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SEO
  const [seoTab, setSeoTab] = useState<SeoTab>("settings");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [urlSlug, setUrlSlug] = useState("");
  const [focusKeywords, setFocusKeywords] = useState("");

  const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleTagAdd = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed]);
    setTagInput("");
  };
  const handleTagRemove = (tag: string) => setTags(tags.filter((t) => t !== tag));
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleTagAdd(tagInput);
  };
  const togglePriority = (key: keyof typeof editorialPriority) =>
    setEditorialPriority((prev) => ({ ...prev, [key]: !prev[key] }));

  const applyFormat = (format: string) => console.log("Format:", format);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const googlePreviewUrl = `https://yournewssite.com/news/${urlSlug || "article-slug"}`;
  const googlePreviewTitle = metaTitle || headline || "Your article title will appear here";
  const googlePreviewDesc =
    metaDesc || "Your meta description will appear here. Make it compelling to increase click-through rates from search results.";

  const categoryOptions = [
    { label: "Politics", value: "politics" },
    { label: "Economy", value: "economy" },
    { label: "Sports", value: "sports" },
    { label: "Technology", value: "tech" },
    { label: "World", value: "world" },
  ];
  const languageOptions = [
    { label: "English", value: "english" },
    { label: "Hindi", value: "hindi" },
    { label: "Bengali", value: "bengali" },
    { label: "Tamil", value: "tamil" },
  ];
  const locationOptions = [
    { label: "National", value: "national" },
    { label: "Delhi", value: "delhi" },
    { label: "Mumbai", value: "mumbai" },
    { label: "Bangalore", value: "bangalore" },
    { label: "Chennai", value: "chennai" },
    { label: "Kolkata", value: "kolkata" },
    { label: "Hyderabad", value: "hyderabad" },
    { label: "Pune", value: "pune" },
    { label: "Ahmedabad", value: "ahmedabad" },
    { label: "International", value: "international" },
  ];
  const authorOptions = [
    { label: "Editor Admin", value: "editor-admin" },
    { label: "Priya Sharma", value: "priya-sharma" },
    { label: "Rahul Mehta", value: "rahul-mehta" },
    { label: "Ananya Singh", value: "ananya-singh" },
  ];

  return (
    <div className="cna-root">
      {/* ── Header ── */}
      <header className="cna-header">
        <div className="cna-header-left">
          <div className="cna-title-group">
            <h1 className="cna-title">Create New Article</h1>
            <span className="cna-badge">
              <span className="cna-badge-dot" />
              {selectedType}
            </span>
          </div>
          <p className="cna-subtitle">Regular news article with full editorial features</p>
        </div>
        <div className="cna-header-actions">
          <button className="cna-btn cna-btn-ghost">
            <span className="cna-btn-icon">👁</span> Preview
          </button>
          <button className="cna-btn cna-btn-outline">
            <span className="cna-btn-icon">🕐</span> Schedule
          </button>
          <button className="cna-btn cna-btn-secondary">Save Draft</button>
          <button className="cna-btn cna-btn-primary">
            <span className="cna-btn-icon">🚀</span> Publish Now
          </button>
        </div>
      </header>

      <div className="cna-body">
        {/* ── Main Column ── */}
        <main className="cna-main">

          {/* Article Type */}
          <section className="cna-section">
            <label className="cna-section-label">Article Type</label>
            <div className="cna-type-grid">
              {ARTICLE_TYPES.map(({ label, icon }) => (
                <button
                  key={label}
                  className={`cna-type-btn${selectedType === label ? " cna-type-btn--active" : ""}`}
                  onClick={() => setSelectedType(label)}
                >
                  <span className="cna-type-icon">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Breaking News Panel ── */}
          {selectedType === "Breaking News" && (
            <section className="cna-section cna-type-panel cna-type-panel--breaking">
              <div className="cna-type-panel-header">
                <div className="cna-type-panel-icon cna-type-panel-icon--breaking">
                  <span>⚡</span>
                </div>
                <div>
                  <h3 className="cna-type-panel-title cna-type-panel-title--breaking">Breaking News Mode</h3>
                  <p className="cna-type-panel-desc">This article will be published immediately and shown in the breaking news ticker. Push notifications will be sent to subscribers.</p>
                </div>
              </div>
              <div className="cna-type-panel-toggles">
                {([
                  { key: "newsTicker", label: "News Ticker" },
                  { key: "pushNotification", label: "Push Notification" },
                  { key: "homepageAlert", label: "Homepage Alert" },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="cna-inline-toggle">
                    <button
                      className={`cna-toggle cna-toggle--dark${breakingToggles[key] ? " cna-toggle--on" : ""}`}
                      onClick={() => toggleBreaking(key)}
                      aria-label={label}
                    >
                      <span className="cna-toggle-knob" />
                    </button>
                    <span className="cna-inline-toggle-label">{label}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* ── Exclusive Story Panel ── */}
          {selectedType === "Exclusive Story" && (
            <section className="cna-section cna-type-panel cna-type-panel--exclusive">
              <div className="cna-type-panel-header">
                <div className="cna-type-panel-icon cna-type-panel-icon--exclusive">
                  <span>✦</span>
                </div>
                <div>
                  <h3 className="cna-type-panel-title cna-type-panel-title--exclusive">Exclusive Content</h3>
                  <p className="cna-type-panel-desc">This article will be marked as an exclusive and featured prominently across the platform.</p>
                </div>
              </div>
              <div className="cna-type-panel-toggles">
                {([
                  { key: "featureOnHomepage", label: "Feature on Homepage" },
                  { key: "premiumOnly", label: "Premium Only" },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="cna-inline-toggle">
                    <button
                      className={`cna-toggle cna-toggle--dark${exclusiveToggles[key] ? " cna-toggle--on" : ""}`}
                      onClick={() => toggleExclusive(key)}
                      aria-label={label}
                    >
                      <span className="cna-toggle-knob" />
                    </button>
                    <span className="cna-inline-toggle-label">{label}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* ── Opinion / Editorial Panel ── */}
          {selectedType === "Opinion / Editorial" && (
            <section className="cna-section cna-type-panel cna-type-panel--opinion">
              <div className="cna-type-panel-header cna-type-panel-header--opinion">
                <div className="cna-type-panel-icon cna-type-panel-icon--opinion">
                  <span>✏️</span>
                </div>
                <h3 className="cna-type-panel-title cna-type-panel-title--opinion">Opinion / Editorial Settings</h3>
              </div>
              <div className="cna-field-group">
                <label className="cna-field-label">Author Bio (Displayed with article)</label>
                <textarea
                  className="cna-input cna-seo-textarea"
                  placeholder="Brief bio about the author and their expertise..."
                  value={authorBio}
                  onChange={(e) => setAuthorBio(e.target.value)}
                />
              </div>
              <div className="cna-field-group">
                <label className="cna-field-label">Disclaimer</label>
                <textarea
                  className="cna-input cna-seo-textarea"
                  value={disclaimer}
                  onChange={(e) => setDisclaimer(e.target.value)}
                />
              </div>
              <div className="cna-type-panel-toggles">
                {([
                  { key: "showAuthorPhoto", label: "Show Author Photo" },
                  { key: "allowComments", label: "Allow Comments" },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="cna-inline-toggle">
                    <button
                      className={`cna-toggle cna-toggle--dark${opinionToggles[key] ? " cna-toggle--on" : ""}`}
                      onClick={() => toggleOpinion(key)}
                      aria-label={label}
                    >
                      <span className="cna-toggle-knob" />
                    </button>
                    <span className="cna-inline-toggle-label">{label}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* ── Live Updates Panel ── */}
          {selectedType === "Live Updates" && (
            <section className="cna-section cna-type-panel cna-type-panel--live">
              <div className="cna-type-panel-header">
                <span className="cna-live-dot" />
                <h3 className="cna-type-panel-title cna-type-panel-title--breaking">Live Updates Feed</h3>
              </div>
              <div className="cna-live-input-row">
                <input
                  className="cna-input"
                  placeholder="Add a new update..."
                  value={liveInput}
                  onChange={(e) => setLiveInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLiveUpdate()}
                />
                <button className="cna-btn cna-btn-live" onClick={addLiveUpdate}>
                  + Add Update
                </button>
              </div>
              <div className="cna-live-feed">
                {liveUpdates.map((u) => (
                  <div key={u.id} className="cna-live-item">
                    <span className="cna-live-time">{u.time}</span>
                    <span className="cna-live-text">{u.text}</span>
                    <button className="cna-live-delete" onClick={() => removeLiveUpdate(u.id)} aria-label="Delete">
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Video Story Panel ── */}
          {selectedType === "Video Story" && (
            <section className="cna-section cna-type-panel cna-type-panel--video">
              <div className="cna-type-panel-header">
                <span className="cna-type-panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  🎬 <span>Video Content</span>
                </span>
              </div>
              <div
                className="cna-dropzone cna-video-dropzone"
                onClick={() => videoFileRef.current?.click()}
              >
                <div className="cna-dropzone-inner">
                  <div className="cna-dropzone-icon-wrap">
                    <Video size={22} strokeWidth={1.5} />
                  </div>
                  <p className="cna-dropzone-title">Upload Video</p>
                  <p className="cna-dropzone-sub">MP4, WebM up to 500MB</p>
                  <button className="cna-btn cna-btn-secondary cna-dropzone-btn"
                    onClick={(e) => { e.stopPropagation(); videoFileRef.current?.click(); }}>
                    Choose File
                  </button>
                </div>
                <input ref={videoFileRef} type="file" accept="video/mp4,video/webm" style={{ display: "none" }} />
              </div>
              <p className="cna-video-or">or</p>
              <div className="cna-field-group">
                <label className="cna-field-label">Video URL (YouTube, Vimeo)</label>
                <input
                  className="cna-input"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <div className="cna-seo-row">
                <div className="cna-field-group">
                  <label className="cna-field-label">Duration</label>
                  <input
                    className="cna-input"
                    placeholder="00:00"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                  />
                </div>
                <div className="cna-field-group">
                  <label className="cna-field-label">Video Quality</label>
                  <CustomSelect
                    value={videoQuality}
                    onChange={setVideoQuality}
                    options={[
                      { label: "1080p Full HD", value: "1080p" },
                      { label: "720p HD", value: "720p" },
                      { label: "480p SD", value: "480p" },
                      { label: "4K Ultra HD", value: "4k" },
                    ]}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── Photo Gallery Panel ── */}
          {selectedType === "Photo Gallery" && (
            <section className="cna-section cna-type-panel cna-type-panel--gallery">
              <div className="cna-type-panel-header">
                <span className="cna-type-panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  🖼️ <span>Photo Gallery</span>
                </span>
              </div>
              <div
                className="cna-gallery-dropzone"
                onClick={() => galleryInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleGalleryFiles(e.dataTransfer.files); }}
              >
                <Upload size={24} strokeWidth={1.4} />
                <p className="cna-dropzone-title" style={{ marginTop: 8 }}>Drag & drop images</p>
                <p className="cna-dropzone-sub">or click to browse</p>
                <button className="cna-btn cna-btn-secondary cna-dropzone-btn"
                  onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click(); }}>
                  Open Media Library
                </button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => handleGalleryFiles(e.target.files)}
                />
              </div>
              <div className="cna-gallery-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="cna-gallery-cell">
                    {galleryImages[i] ? (
                      <img src={galleryImages[i]} alt={`Gallery ${i + 1}`} className="cna-gallery-img" />
                    ) : (
                      <span className="cna-gallery-placeholder">🖼</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Main Headline */}
          <section className="cna-section">
            <label className="cna-field-label">
              Main Headline <span className="cna-required">*</span>
            </label>
            <input
              className="cna-input cna-headline-input"
              placeholder="Enter your compelling headline here..."
              value={headline}
              maxLength={120}
              onChange={(e) => setHeadline(e.target.value)}
            />
            <p className="cna-hint">{headline.length}/120 characters • Recommended: 60–80 characters</p>
          </section>

          {/* Short Title */}
          <section className="cna-section">
            <label className="cna-field-label">Short Title (Mobile)</label>
            <input
              className="cna-input"
              placeholder="Shorter version for mobile devices..."
              value={shortTitle}
              maxLength={50}
              onChange={(e) => setShortTitle(e.target.value)}
            />
            <p className="cna-hint">{shortTitle.length}/50 characters • Used in mobile and notifications</p>
          </section>

          {/* Rich Text Editor */}
          <section className="cna-section cna-editor-section">
            <div className="cna-toolbar">
              {[
                { icon: <Heading1 size={16} />, title: "Heading 1" },
                { icon: <Heading2 size={16} />, title: "Heading 2" },
                { icon: <Bold size={16} />, title: "Bold" },
                { icon: <Italic size={16} />, title: "Italic" },
                { icon: <Underline size={16} />, title: "Underline" },
                { icon: <List size={16} />, title: "Bullet List" },
                { icon: <ListOrdered size={16} />, title: "Numbered List" },
                { icon: <Quote size={16} />, title: "Quote" },
                { icon: <AlignLeft size={16} />, title: "Align Left" },
                { icon: <AlignCenter size={16} />, title: "Align Center" },
                { icon: <AlignRight size={16} />, title: "Align Right" },
                { icon: <Link size={16} />, title: "Link" },
                { icon: <Image size={16} />, title: "Image" },
                { icon: <Video size={16} />, title: "Video" },
              ].map(({ icon, title }) => (
                <button key={title} className="cna-toolbar-btn" title={title} onClick={() => applyFormat(title)}>
                  {icon}
                </button>
              ))}
            </div>
            <textarea
              className="cna-editor"
              placeholder={`Start writing your article content here...\n\nYou can format text using the toolbar above. Add images, videos, and other media to enhance your story.\n\nTips for great journalism:\n• Start with a strong lead paragraph\n• Use short paragraphs for better readability\n• Include relevant quotes and sources\n• Add context and background information`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="cna-editor-footer">
              <span>Words: {wordCount}</span>
              <span>Est. read time: {readTime} min</span>
            </div>
          </section>

          {/* ── Featured Media ── */}
          <section className="cna-section">
            <label className="cna-section-label">Featured Media</label>

            <div
              className={`cna-dropzone${dragOver ? " cna-dropzone--over" : ""}${mediaPreview ? " cna-dropzone--has-image" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => !mediaPreview && fileInputRef.current?.click()}
            >
              {mediaPreview ? (
                <>
                  <img src={mediaPreview} alt="Preview" className="cna-dropzone-preview" />
                  <button
                    className="cna-dropzone-remove"
                    onClick={(e) => { e.stopPropagation(); setMediaFile(null); setMediaPreview(null); }}
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="cna-dropzone-inner">
                  <div className="cna-dropzone-icon-wrap">
                    <Upload size={22} strokeWidth={1.5} />
                  </div>
                  <p className="cna-dropzone-title">Drag and drop your featured image</p>
                  <p className="cna-dropzone-sub">or click to browse • PNG, JPG up to 10MB</p>
                  <button
                    className="cna-btn cna-btn-secondary cna-dropzone-btn"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Choose File
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
            </div>

            <div className="cna-media-meta">
              <div className="cna-media-meta-field">
                <label className="cna-field-label">Image Caption</label>
                <input
                  className="cna-input"
                  placeholder="Enter image caption..."
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                />
              </div>
              <div className="cna-media-meta-field">
                <label className="cna-field-label">Photo Credit</label>
                <input
                  className="cna-input"
                  placeholder="Photographer / Source"
                  value={photoCredit}
                  onChange={(e) => setPhotoCredit(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ── SEO Settings ── */}
          <section className="cna-section cna-section--last">
            {/* Tab Bar */}
            <div className="cna-seo-tabs">
              {(["settings", "google"] as SeoTab[]).map((tab) => (
                <button
                  key={tab}
                  className={`cna-seo-tab${seoTab === tab ? " cna-seo-tab--active" : ""}`}
                  onClick={() => setSeoTab(tab)}
                >
                  {tab === "settings" && "SEO Settings"}
                  {tab === "google" && "Google Preview"}
                </button>
              ))}
            </div>

            {/* SEO Settings Panel */}
            {seoTab === "settings" && (
              <div className="cna-seo-panel">
                <div className="cna-field-group">
                  <label className="cna-field-label">Meta Title</label>
                  <input
                    className="cna-input"
                    placeholder="SEO-optimized title for search engines..."
                    value={metaTitle}
                    maxLength={60}
                    onChange={(e) => setMetaTitle(e.target.value)}
                  />
                  <p className="cna-hint">{metaTitle.length}/60 characters</p>
                </div>
                <div className="cna-field-group">
                  <label className="cna-field-label">Meta Description</label>
                  <textarea
                    className="cna-input cna-seo-textarea"
                    placeholder="Brief description for search results..."
                    value={metaDesc}
                    maxLength={160}
                    onChange={(e) => setMetaDesc(e.target.value)}
                  />
                  <p className="cna-hint">{metaDesc.length}/160 characters</p>
                </div>
                <div className="cna-seo-row">
                  <div className="cna-field-group cna-seo-slug-group">
                    <label className="cna-field-label">URL Slug</label>
                    <div className="cna-slug-input-wrap">
                      <span className="cna-slug-prefix">/news/</span>
                      <input
                        className="cna-input cna-slug-input"
                        placeholder="article-url-slug"
                        value={urlSlug}
                        onChange={(e) => setUrlSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      />
                    </div>
                  </div>
                  <div className="cna-field-group cna-seo-kw-group">
                    <label className="cna-field-label">Focus Keywords</label>
                    <input
                      className="cna-input"
                      placeholder="keyword1, keyword2, keyword3"
                      value={focusKeywords}
                      onChange={(e) => setFocusKeywords(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Google Preview Panel */}
            {seoTab === "google" && (
              <div className="cna-seo-panel">
                <div className="cna-google-preview">
                  <div className="cna-google-url-row">
                    <Globe size={14} className="cna-google-globe" />
                    <span className="cna-google-url">{googlePreviewUrl}</span>
                  </div>
                  <p className="cna-google-title">{googlePreviewTitle}</p>
                  <p className="cna-google-desc">{googlePreviewDesc}</p>
                </div>
              </div>
            )}

          </section>
        </main>

        {/* ── Sidebar ── */}
        <aside className="cna-sidebar">

          {/* Author */}
          <div className="cna-card">
            <h2 className="cna-card-title">Author</h2>
            <CustomSelect
              value={author}
              onChange={setAuthor}
              options={authorOptions}
              withAvatar
            />
          </div>

          {/* Editorial Priority */}
          <div className="cna-card">
            <div className="cna-card-header">
              <span className="cna-card-icon">⭐</span>
              <h2 className="cna-card-title">Editorial Priority</h2>
            </div>
            <p className="cna-card-desc">Full manual control over how this news appears on your website</p>
            <div className="cna-priority-list">
              {(
                [
                  { key: "breakingNews", icon: "🔴", label: "Breaking News", desc: "Show in breaking news ticker" },
                  { key: "topStory", icon: "⭐", label: "Top Story", desc: "Feature as top story" },
                  { key: "pinToHomepage", icon: "📌", label: "Pin to Homepage", desc: "Keep at top of homepage" },
                  { key: "categoryFeatured", icon: "🏷", label: "Category Featured", desc: "Feature in category page" },
                ] as const
              ).map(({ key, icon, label, desc }) => (
                <div key={key} className="cna-priority-item">
                  <div className="cna-priority-info">
                    <span className="cna-priority-icon">{icon}</span>
                    <div>
                      <p className="cna-priority-label">{label}</p>
                      <p className="cna-priority-desc">{desc}</p>
                    </div>
                  </div>
                  <button
                    className={`cna-toggle${editorialPriority[key] ? " cna-toggle--on" : ""}`}
                    onClick={() => togglePriority(key)}
                    aria-label={`Toggle ${label}`}
                  >
                    <span className="cna-toggle-knob" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Classification */}
          <div className="cna-card">
            <h2 className="cna-card-title">Classification</h2>
            <div className="cna-field-group">
              <label className="cna-field-label">Category <span className="cna-required">*</span></label>
              <CustomSelect value={category} onChange={setCategory} options={categoryOptions} placeholder="Select category" />
            </div>
            <div className="cna-field-group">
              <label className="cna-field-label">Language</label>
              <CustomSelect value={language} onChange={setLanguage} options={languageOptions} />
            </div>
            <div className="cna-field-group">
              <label className="cna-field-label">Location</label>
              <CustomSelect value={articleLocation} onChange={setArticleLocation} options={locationOptions} placeholder="Select location" />
            </div>
          </div>

          {/* Tags */}
          <div className="cna-card">
            <h2 className="cna-card-title">Tags</h2>
            <div className="cna-tags">
              {tags.map((tag) => (
                <span key={tag} className="cna-tag">
                  {tag}
                  <button className="cna-tag-remove" onClick={() => handleTagRemove(tag)}>×</button>
                </span>
              ))}
            </div>
            <div className="cna-tag-input-row">
              <input
                className="cna-input cna-tag-input"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <button className="cna-tag-search-btn" onClick={() => handleTagAdd(tagInput)}>🔍</button>
            </div>
            <div className="cna-suggested-tags">
              <p className="cna-hint">Suggested tags:</p>
              <div className="cna-suggested-list">
                {SUGGESTED_TAGS.map((tag) => (
                  <button key={tag} className="cna-suggested-tag" onClick={() => handleTagAdd(tag)}>
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
};

export default CreateNewArticle;