import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CreateNewArticle.css";
import { useNews } from "../NewsStore/NewsStore";
import {
  Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered,
  Quote, AlignLeft, AlignCenter, AlignRight, Link, Image, Video,
  Upload, Globe, Eye, Clock, Rocket, Zap, Star, PenLine, Radio,
  FileText, Tag, MapPin, User, BarChart2, Pin, Trash2,
} from "lucide-react";

type ArticleType =
  | "Standard Article"
  | "Breaking News"
  | "Exclusive Story"
  | "Opinion / Editorial"
  | "Live Updates"
  | "Video Story";

const ARTICLE_TYPES: { label: ArticleType; icon: React.ReactNode }[] = [
  { label: "Standard Article",    icon: <FileText size={15} /> },
  { label: "Breaking News",       icon: <Zap size={15} /> },
  { label: "Exclusive Story",     icon: <Star size={15} /> },
  { label: "Opinion / Editorial", icon: <PenLine size={15} /> },
  { label: "Live Updates",        icon: <Radio size={15} /> },
  { label: "Video Story",         icon: <Video size={15} /> },
];

const SUGGESTED_TAGS = ["India", "Economy", "Government", "Reform"];

/* ─── Custom Select ─── */
interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  withAvatar?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value, onChange, options, placeholder = "Select...", withAvatar = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div className="cna-custom-select" ref={ref}>
      <button
        type="button"
        className={`cna-select-trigger${open ? " cna-select-trigger--open" : ""}`}
        onClick={() => setOpen((p) => !p)}
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
        <svg className={`cna-select-chevron${open ? " cna-select-chevron--open" : ""}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="cna-select-dropdown" role="listbox">
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}
              className={`cna-select-option${opt.value === value ? " cna-select-option--selected" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
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

type SeoTab = "settings" | "google";

const TYPE_PARAM_MAP: Record<string, ArticleType> = {
  breaking:  "Breaking News",
  exclusive: "Exclusive Story",
  opinion:   "Opinion / Editorial",
  live:      "Live Updates",
  video:     "Video Story",
};

/* ─── Toggle component ─── */
const Toggle: React.FC<{ on: boolean; onClick: () => void; label: string; dark?: boolean }> = ({ on, onClick, label, dark }) => (
  <button
    className={`cna-toggle${dark ? " cna-toggle--dark" : ""}${on ? " cna-toggle--on" : ""}`}
    onClick={onClick}
    aria-label={label}
  >
    <span className="cna-toggle-knob" />
  </button>
);

/* ─── Main Component ─── */
const CreateNewArticle: React.FC = () => {
  const routerLocation = useLocation();
  const { addArticle } = useNews();
  const navigate = useNavigate();

  const getInitialType = (): ArticleType => {
    const params = new URLSearchParams(routerLocation.search);
    return TYPE_PARAM_MAP[params.get("type") ?? ""] ?? "Standard Article";
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
    breakingNews: false, topStory: false, pinToHomepage: false, categoryFeatured: false,
  });

  const [breakingToggles, setBreakingToggles] = useState({ newsTicker: true, pushNotification: true, homepageAlert: true });
  const [exclusiveToggles, setExclusiveToggles] = useState({ featureOnHomepage: true, premiumOnly: false });
  const [authorBio, setAuthorBio] = useState("");
  const [disclaimer, setDisclaimer] = useState("Views expressed are personal and do not represent the views of this publication.");
  const [opinionToggles, setOpinionToggles] = useState({ showAuthorPhoto: true, allowComments: true });

  const [liveInput, setLiveInput] = useState("");
  const [liveUpdates, setLiveUpdates] = useState([{ id: 1, time: "10:30 AM", text: "Initial report coming in..." }]);
  const addLiveUpdate = () => {
    if (!liveInput.trim()) return;
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setLiveUpdates((p) => [...p, { id: Date.now(), time, text: liveInput.trim() }]);
    setLiveInput("");
  };
  const removeLiveUpdate = (id: number) => setLiveUpdates((p) => p.filter((u) => u.id !== id));

  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("00:00");
  const [videoQuality, setVideoQuality] = useState("1080p");
  const videoFileRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [photoCredit, setPhotoCredit] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [seoTab, setSeoTab] = useState<SeoTab>("settings");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [urlSlug, setUrlSlug] = useState("");
  const [focusKeywords, setFocusKeywords] = useState("");

  const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleTagAdd = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const handleTagRemove = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) { setMediaFile(file); setMediaPreview(URL.createObjectURL(file)); }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) { setMediaFile(file); setMediaPreview(URL.createObjectURL(file)); }
  };

  const googlePreviewUrl = `https://yournewssite.com/news/${urlSlug || "article-slug"}`;
  const googlePreviewTitle = metaTitle || headline || "Your article title will appear here";
  const googlePreviewDesc = metaDesc || "Your meta description will appear here. Make it compelling to increase click-through rates from search results.";

  const categoryOptions = [
    { label: "Politics", value: "politics" }, { label: "Economy", value: "economy" },
    { label: "Sports", value: "sports" },     { label: "Technology", value: "tech" },
    { label: "World", value: "world" },
  ];
  const languageOptions = [
    { label: "English", value: "english" }, { label: "Hindi", value: "hindi" },
    { label: "Bengali", value: "bengali" }, { label: "Tamil", value: "tamil" },
  ];
  const locationOptions = [
    { label: "National", value: "national" },     { label: "Delhi", value: "delhi" },
    { label: "Mumbai", value: "mumbai" },          { label: "Bangalore", value: "bangalore" },
    { label: "Chennai", value: "chennai" },        { label: "Kolkata", value: "kolkata" },
    { label: "Hyderabad", value: "hyderabad" },    { label: "Pune", value: "pune" },
    { label: "Ahmedabad", value: "ahmedabad" },    { label: "International", value: "international" },
  ];
  const authorOptions = [
    { label: "Editor Admin", value: "editor-admin" },
  ];

  const priorityItems: { key: keyof typeof editorialPriority; icon: React.ReactNode; label: string; desc: string }[] = [
    { key: "breakingNews",     icon: <Zap size={15} />,     label: "Breaking News",      desc: "Show in breaking news ticker" },
    { key: "topStory",         icon: <Star size={15} />,    label: "Top Story",           desc: "Feature as top story" },
    { key: "pinToHomepage",    icon: <Pin size={15} />,     label: "Pin to Homepage",     desc: "Keep at top of homepage" },
    { key: "categoryFeatured", icon: <Tag size={15} />,     label: "Category Featured",   desc: "Feature in category page" },
  ];

  const handlePublish = () => {
    if (!headline.trim()) return;
    const authorOption = authorOptions.find((a) => a.value === author);
    const nameParts = (authorOption?.label ?? "Editor Admin").split(" ");
    addArticle({
      title: headline,
      subtitle: shortTitle || headline.slice(0, 40),
      category: selectedType,
      authorFirst: nameParts[0] ?? "Editor",
      authorLast: nameParts.slice(1).join(" ") || "Admin",
      status: "Published",
      statusType: "published",
      priority: "Normal",
      priorityType: "normal",
      published: "Just now",
      views: "0",
      tag: selectedType === "Breaking News" ? "Breaking" : selectedType === "Exclusive Story" ? "Exclusive" : selectedType === "Live Updates" ? "Live" : selectedType === "Opinion / Editorial" ? "Opinion" : undefined,
      tagType: selectedType === "Breaking News" ? "breaking" : selectedType === "Exclusive Story" ? "exclusive" : selectedType === "Live Updates" ? "live" : selectedType === "Opinion / Editorial" ? "opinion" : undefined,
      leftBorder: selectedType === "Breaking News" ? "breaking-left" : selectedType === "Exclusive Story" ? "exclusive-left" : selectedType === "Live Updates" ? "live-left" : undefined,
      isTopStory: editorialPriority.topStory,
      isPinned: editorialPriority.pinToHomepage,
    });
    navigate("/admin/news");
  };

  const handleSaveDraft = () => {
    if (!headline.trim()) return;
    const authorOption = authorOptions.find((a) => a.value === author);
    const nameParts = (authorOption?.label ?? "Editor Admin").split(" ");
    addArticle({
      title: headline,
      subtitle: shortTitle || headline.slice(0, 40),
      category: selectedType,
      authorFirst: nameParts[0] ?? "Editor",
      authorLast: nameParts.slice(1).join(" ") || "Admin",
      status: "Draft",
      statusType: "draft",
      priority: "Normal",
      priorityType: "normal",
      published: "-",
      views: "-",
      isTopStory: false,
      isPinned: false,
    });
    navigate("/admin/news");
  };


  return (
    <div className="cna-root">
      {/* Header */}
      <header className="cna-header">
        <div className="cna-header-left">
          <div className="cna-title-group">
            <h1 className="cna-title">Create New Article</h1>
            <span className="cna-badge"><span className="cna-badge-dot" />{selectedType}</span>
          </div>
          <p className="cna-subtitle">Regular news article with full editorial features</p>
        </div>
        <div className="cna-header-actions">
          <button className="cna-btn cna-btn-ghost"><Eye size={15} /> Preview</button>
          <button className="cna-btn cna-btn-outline"><Clock size={15} /> Schedule</button>
          <button className="cna-btn cna-btn-secondary" onClick={handleSaveDraft}>Save Draft</button>
          <button className="cna-btn cna-btn-primary" onClick={handlePublish}><Rocket size={15} /> Publish Now</button>
        </div>
      </header>

      <div className="cna-body">
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

          {/* Breaking News Panel */}
          {selectedType === "Breaking News" && (
            <section className="cna-section cna-type-panel cna-type-panel--breaking">
              <div className="cna-type-panel-header">
                <div className="cna-type-panel-icon cna-type-panel-icon--breaking"><Zap size={18} /></div>
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
                    <Toggle on={breakingToggles[key]} onClick={() => setBreakingToggles(p => ({ ...p, [key]: !p[key] }))} label={label} dark />
                    <span className="cna-inline-toggle-label">{label}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Exclusive Story Panel */}
          {selectedType === "Exclusive Story" && (
            <section className="cna-section cna-type-panel cna-type-panel--exclusive">
              <div className="cna-type-panel-header">
                <div className="cna-type-panel-icon cna-type-panel-icon--exclusive"><Star size={18} /></div>
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
                    <Toggle on={exclusiveToggles[key]} onClick={() => setExclusiveToggles(p => ({ ...p, [key]: !p[key] }))} label={label} dark />
                    <span className="cna-inline-toggle-label">{label}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Opinion / Editorial Panel */}
          {selectedType === "Opinion / Editorial" && (
            <section className="cna-section cna-type-panel cna-type-panel--opinion">
              <div className="cna-type-panel-header cna-type-panel-header--opinion">
                <div className="cna-type-panel-icon cna-type-panel-icon--opinion"><PenLine size={18} /></div>
                <h3 className="cna-type-panel-title cna-type-panel-title--opinion">Opinion / Editorial Settings</h3>
              </div>
              <div className="cna-field-group">
                <label className="cna-field-label">Author Bio (Displayed with article)</label>
                <textarea className="cna-input cna-seo-textarea" placeholder="Brief bio about the author and their expertise..." value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} />
              </div>
              <div className="cna-field-group">
                <label className="cna-field-label">Disclaimer</label>
                <textarea className="cna-input cna-seo-textarea" value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} />
              </div>
              <div className="cna-type-panel-toggles">
                {([
                  { key: "showAuthorPhoto", label: "Show Author Photo" },
                  { key: "allowComments", label: "Allow Comments" },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="cna-inline-toggle">
                    <Toggle on={opinionToggles[key]} onClick={() => setOpinionToggles(p => ({ ...p, [key]: !p[key] }))} label={label} dark />
                    <span className="cna-inline-toggle-label">{label}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Live Updates Panel */}
          {selectedType === "Live Updates" && (
            <section className="cna-section cna-type-panel cna-type-panel--live">
              <div className="cna-type-panel-header">
                <span className="cna-live-dot" />
                <h3 className="cna-type-panel-title cna-type-panel-title--breaking">Live Updates Feed</h3>
              </div>
              <div className="cna-live-input-row">
                <input className="cna-input" placeholder="Add a new update..." value={liveInput}
                  onChange={(e) => setLiveInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLiveUpdate()} />
                <button className="cna-btn cna-btn-live" onClick={addLiveUpdate}>+ Add Update</button>
              </div>
              <div className="cna-live-feed">
                {liveUpdates.map((u) => (
                  <div key={u.id} className="cna-live-item">
                    <span className="cna-live-time">{u.time}</span>
                    <span className="cna-live-text">{u.text}</span>
                    <button className="cna-live-delete" onClick={() => removeLiveUpdate(u.id)} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Video Story Panel */}
          {selectedType === "Video Story" && (
            <section className="cna-section cna-type-panel cna-type-panel--video">
              <div className="cna-type-panel-header">
                <Video size={18} />
                <h3 className="cna-type-panel-title" style={{ marginLeft: 8 }}>Video Content</h3>
              </div>
              <div className="cna-dropzone cna-video-dropzone" onClick={() => videoFileRef.current?.click()}>
                <div className="cna-dropzone-inner">
                  <div className="cna-dropzone-icon-wrap"><Video size={22} strokeWidth={1.5} /></div>
                  <p className="cna-dropzone-title">Upload Video</p>
                  <p className="cna-dropzone-sub">MP4, WebM up to 500MB</p>
                  <button className="cna-btn cna-btn-secondary cna-dropzone-btn"
                    onClick={(e) => { e.stopPropagation(); videoFileRef.current?.click(); }}>Choose File</button>
                </div>
                <input ref={videoFileRef} type="file" accept="video/mp4,video/webm" style={{ display: "none" }} />
              </div>
              <p className="cna-video-or">or</p>
              <div className="cna-field-group">
                <label className="cna-field-label">Video URL (YouTube, Vimeo)</label>
                <input className="cna-input" placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              </div>
              <div className="cna-seo-row">
                <div className="cna-field-group">
                  <label className="cna-field-label">Duration</label>
                  <input className="cna-input" placeholder="00:00" value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} />
                </div>
                <div className="cna-field-group">
                  <label className="cna-field-label">Video Quality</label>
                  <CustomSelect value={videoQuality} onChange={setVideoQuality} options={[
                    { label: "1080p Full HD", value: "1080p" }, { label: "720p HD", value: "720p" },
                    { label: "480p SD", value: "480p" },        { label: "4K Ultra HD", value: "4k" },
                  ]} />
                </div>
              </div>
            </section>
          )}

          {/* Main Headline */}
          <section className="cna-section">
            <label className="cna-field-label">Main Headline <span className="cna-required">*</span></label>
            <input className="cna-input cna-headline-input" placeholder="Enter your compelling headline here..."
              value={headline} maxLength={120} onChange={(e) => setHeadline(e.target.value)} />
            <p className="cna-hint">{headline.length}/120 characters • Recommended: 60–80 characters</p>
          </section>

          {/* Short Title */}
          <section className="cna-section">
            <label className="cna-field-label">Short Title (Mobile)</label>
            <input className="cna-input" placeholder="Shorter version for mobile devices..."
              value={shortTitle} maxLength={50} onChange={(e) => setShortTitle(e.target.value)} />
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
                <button key={title} className="cna-toolbar-btn" title={title}>{icon}</button>
              ))}
            </div>
            <textarea className="cna-editor"
              placeholder={`Start writing your article content here...\n\nTips for great journalism:\n• Start with a strong lead paragraph\n• Use short paragraphs for better readability\n• Include relevant quotes and sources`}
              value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="cna-editor-footer">
              <span>Words: {wordCount}</span>
              <span>Est. read time: {readTime} min</span>
            </div>
          </section>

          {/* Featured Media */}
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
                  <button className="cna-dropzone-remove" onClick={(e) => { e.stopPropagation(); setMediaFile(null); setMediaPreview(null); }}>×</button>
                </>
              ) : (
                <div className="cna-dropzone-inner">
                  <div className="cna-dropzone-icon-wrap"><Upload size={22} strokeWidth={1.5} /></div>
                  <p className="cna-dropzone-title">Drag and drop your featured image</p>
                  <p className="cna-dropzone-sub">or click to browse • PNG, JPG up to 10MB</p>
                  <button className="cna-btn cna-btn-secondary cna-dropzone-btn"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Choose File</button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" style={{ display: "none" }} onChange={handleFileSelect} />
            </div>
            <div className="cna-media-meta">
              <div className="cna-media-meta-field">
                <label className="cna-field-label">Image Caption</label>
                <input className="cna-input" placeholder="Enter image caption..." value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} />
              </div>
              <div className="cna-media-meta-field">
                <label className="cna-field-label">Photo Credit</label>
                <input className="cna-input" placeholder="Photographer / Source" value={photoCredit} onChange={(e) => setPhotoCredit(e.target.value)} />
              </div>
            </div>
          </section>

          {/* SEO */}
          <section className="cna-section cna-section--last">
            <div className="cna-seo-tabs">
              {(["settings", "google"] as SeoTab[]).map((tab) => (
                <button key={tab} className={`cna-seo-tab${seoTab === tab ? " cna-seo-tab--active" : ""}`} onClick={() => setSeoTab(tab)}>
                  {tab === "settings" ? "SEO Settings" : "Google Preview"}
                </button>
              ))}
            </div>
            {seoTab === "settings" && (
              <div className="cna-seo-panel">
                <div className="cna-field-group">
                  <label className="cna-field-label">Meta Title</label>
                  <input className="cna-input" placeholder="SEO-optimized title..." value={metaTitle} maxLength={60} onChange={(e) => setMetaTitle(e.target.value)} />
                  <p className="cna-hint">{metaTitle.length}/60 characters</p>
                </div>
                <div className="cna-field-group">
                  <label className="cna-field-label">Meta Description</label>
                  <textarea className="cna-input cna-seo-textarea" placeholder="Brief description for search results..." value={metaDesc} maxLength={160} onChange={(e) => setMetaDesc(e.target.value)} />
                  <p className="cna-hint">{metaDesc.length}/160 characters</p>
                </div>
                <div className="cna-seo-row">
                  <div className="cna-field-group cna-seo-slug-group">
                    <label className="cna-field-label">URL Slug</label>
                    <div className="cna-slug-input-wrap">
                      <span className="cna-slug-prefix">/news/</span>
                      <input className="cna-input cna-slug-input" placeholder="article-url-slug" value={urlSlug}
                        onChange={(e) => setUrlSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} />
                    </div>
                  </div>
                  <div className="cna-field-group cna-seo-kw-group">
                    <label className="cna-field-label">Focus Keywords</label>
                    <input className="cna-input" placeholder="keyword1, keyword2" value={focusKeywords} onChange={(e) => setFocusKeywords(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
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

        {/* Sidebar */}
        <aside className="cna-sidebar">

          {/* Author */}
          <div className="cna-card">
            <div className="cna-card-header">
              <User size={15} className="cna-card-icon-svg" />
              <h2 className="cna-card-title">Author</h2>
            </div>
            <CustomSelect value={author} onChange={setAuthor} options={authorOptions} withAvatar />
          </div>

          {/* Editorial Priority */}
          <div className="cna-card">
            <div className="cna-card-header">
              <BarChart2 size={15} className="cna-card-icon-svg" />
              <h2 className="cna-card-title">Editorial Priority</h2>
            </div>
            <p className="cna-card-desc">Full manual control over how this news appears on your website</p>
            <div className="cna-priority-list">
              {priorityItems.map(({ key, icon, label, desc }) => (
                <div key={key} className="cna-priority-item">
                  <div className="cna-priority-info">
                    <span className="cna-priority-icon">{icon}</span>
                    <div>
                      <p className="cna-priority-label">{label}</p>
                      <p className="cna-priority-desc">{desc}</p>
                    </div>
                  </div>
                  <Toggle on={editorialPriority[key]} onClick={() => setEditorialPriority(p => ({ ...p, [key]: !p[key] }))} label={label} />
                </div>
              ))}
            </div>
          </div>

          {/* Classification */}
          <div className="cna-card">
            <div className="cna-card-header">
              <MapPin size={15} className="cna-card-icon-svg" />
              <h2 className="cna-card-title">Classification</h2>
            </div>
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
            <div className="cna-card-header">
              <Tag size={15} className="cna-card-icon-svg" />
              <h2 className="cna-card-title">Tags</h2>
            </div>
            <div className="cna-tags">
              {tags.map((tag) => (
                <span key={tag} className="cna-tag">
                  {tag}
                  <button className="cna-tag-remove" onClick={() => handleTagRemove(tag)}>×</button>
                </span>
              ))}
            </div>
            <div className="cna-tag-input-row">
              <input className="cna-input cna-tag-input" placeholder="Add tag..." value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTagAdd(tagInput)} />
              <button className="cna-tag-search-btn" onClick={() => handleTagAdd(tagInput)}>
                <Tag size={14} />
              </button>
            </div>
            <div className="cna-suggested-tags">
              <p className="cna-hint">Suggested tags:</p>
              <div className="cna-suggested-list">
                {SUGGESTED_TAGS.map((tag) => (
                  <button key={tag} className="cna-suggested-tag" onClick={() => handleTagAdd(tag)}>+ {tag}</button>
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