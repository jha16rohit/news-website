import { useState } from "react";
import "./Featuredcontent.css";

/* ── Types ── */
type Tab = "Featured Articles" | "Homepage Layout";

interface Article {
  id: number;
  title: string;
  tag: string;
  author: string;
  ago: string;
  slot: string;
  expires: string;
  views: string;
  enabled: boolean;
  img: string;
}

/* ── Static Data ── */
const tagColors: Record<string, string> = {
  Politics: "#f97316",
  Business: "#3b82f6",
  Sports: "#22c55e",
  Science: "#a855f7",
  Technology: "#06b6d4",
  Entertainment: "#ec4899",
};

const INITIAL_ARTICLES: Article[] = [
  {
    id: 1,
    title: "Exclusive: Inside the New Government Initiative",
    tag: "Politics",
    author: "Rahul Sharma",
    ago: "2 hours ago",
    slot: "Hero Banner",
    expires: "Expires in 22 hours",
    views: "45.6K",
    enabled: true,
    img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=160&h=100&fit=crop",
  },
  {
    id: 2,
    title: "Tech Giants Report Record Quarterly Earnings",
    tag: "Business",
    author: "Priya Patel",
    ago: "4 hours ago",
    slot: "Featured Grid #1",
    expires: "Expires in 20 hours",
    views: "32.1K",
    enabled: true,
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=160&h=100&fit=crop",
  },
  {
    id: 3,
    title: "World Cup Qualifier: India vs Australia Preview",
    tag: "Sports",
    author: "Arun Mehta",
    ago: "6 hours ago",
    slot: "Featured Grid #2",
    expires: "Expires in 18 hours",
    views: "28.9K",
    enabled: false,
    img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=160&h=100&fit=crop",
  },
  {
    id: 4,
    title: "Breakthrough Cancer Research Published in Nature",
    tag: "Science",
    author: "Dr. Sneha Iyer",
    ago: "8 hours ago",
    slot: "Featured Grid #3",
    expires: "Expires in 14 hours",
    views: "19.4K",
    enabled: true,
    img: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=160&h=100&fit=crop",
  },
];

/* ── Drag handle icon ── */
function DragHandle() {
  return (
    <svg width="14" height="20" viewBox="0 0 14 20" fill="none" className="fc-drag-handle">
      {[0, 6, 12].map((y) => (
        <g key={y}>
          <circle cx="4" cy={y + 4} r="1.5" fill="currentColor" />
          <circle cx="10" cy={y + 4} r="1.5" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

/* ── Toggle ── */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`fc-toggle ${on ? "fc-toggle--on" : ""}`}
    >
      <span className="fc-toggle__thumb" />
    </button>
  );
}

/* ── Homepage Layout placeholder ── */
function HomepageLayout() {
  const slots = [
    { label: "Hero Banner", desc: "Main top story position", filled: true },
    { label: "Featured Grid #1", desc: "First grid position", filled: true },
    { label: "Featured Grid #2", desc: "Second grid position", filled: true },
    { label: "Featured Grid #3", desc: "Third grid position", filled: false },
    { label: "Sidebar Featured", desc: "Right sidebar highlight", filled: true },
  ];

  return (
    <div className="fc-layout-tab">
      <div className="fc-layout-header">
        <h2 className="fc-layout-title">Homepage Slots</h2>
      </div>

      <div className="fc-layout-grid">
        {slots.map((s) => (
          <div className="fc-layout-slot" key={s.label}>
            <div className="fc-layout-slot__top">
              <div>
                <div className="fc-layout-slot__name">{s.label}</div>
                <div className="fc-layout-slot__desc">{s.desc}</div>
              </div>

              <span
                className={`fc-layout-slot__status ${
                  s.filled ? "fc-layout-slot__status--filled" : "fc-layout-slot__status--empty"
                }`}
              >
                {s.filled ? "Filled" : "Empty"}
              </span>
            </div>

            <button
              className={`fc-layout-slot__btn ${
                s.filled ? "fc-layout-slot__btn--light" : "fc-layout-slot__btn--dark"
              }`}
            >
              {s.filled ? "Change Article" : "Assign Article"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ── Main Component ── */
export default function FeaturedContent() {
  const [tab, setTab] = useState<Tab>("Featured Articles");
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [showModal, setShowModal] = useState(false);

  const activeCount = articles.filter((a) => a.enabled).length;
  const expiringCount = articles.filter((a) => {
    const h = parseInt(a.expires.replace(/\D/g, ""), 10);
    return h <= 20;
  }).length;
  const totalViews = "125K";

  function toggleArticle(id: number) {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  }

  function deleteArticle(id: number) {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="fc-root">
      <div className="fc-bg-orb fc-bg-orb--1" />
      <div className="fc-bg-orb fc-bg-orb--2" />

      <div className="fc-container">
        {/* ── Page Header ── */}
        <header className="fc-header">
          <div>
            <h1 className="fc-title">Featured Content</h1>
            <p className="fc-subtitle">Manage homepage featured articles and editorial picks</p>
          </div>
          <button className="fc-add-btn" onClick={() => setShowModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Featured
          </button>
        </header>

        {/* ── Tabs ── */}
        <div className="fc-tabs">
          {(["Featured Articles", "Homepage Layout"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`fc-tab ${tab === t ? "fc-tab--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Stat Cards ── */}
        <div className="fc-stats">
          {[
            { icon: "⭐", value: String(activeCount), label: "Active Featured", color: "#f97316" },
            { icon: "▦", value: "5", label: "Total Slots", color: "#3b82f6" },
            { icon: "👁", value: totalViews, label: "Featured Views", color: "#22c55e" },
            { icon: "⏰", value: String(expiringCount), label: "Expiring Soon", color: "#f59e0b" },
          ].map((s) => (
            <div className="fc-stat-card" key={s.label} style={{ "--c": s.color } as React.CSSProperties}>
              <div className="fc-stat-icon">{s.icon}</div>
              <div>
                <div className="fc-stat-value">{s.value}</div>
                <div className="fc-stat-label">{s.label}</div>
              </div>
              <div className="fc-stat-glow" />
            </div>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {tab === "Featured Articles" ? (
          <section className="fc-articles">
            <div className="fc-articles__header">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <h2 className="fc-articles__title">Featured Articles</h2>
            </div>

            <div className="fc-article-list">
              {articles.map((a, i) => (
                <div
                  className={`fc-article ${!a.enabled ? "fc-article--disabled" : ""}`}
                  key={a.id}
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <DragHandle />

                  <div className="fc-article__img-wrap">
                    <img src={a.img} alt={a.title} className="fc-article__img" />
                  </div>

                  <div className="fc-article__body">
                    <h3 className="fc-article__title">{a.title}</h3>
                    <div className="fc-article__meta">
                      <span
                        className="fc-tag"
                        style={{ "--tag-color": tagColors[a.tag] ?? "#888" } as React.CSSProperties}
                      >
                        {a.tag}
                      </span>
                      <span className="fc-article__author">{a.author}</span>
                      <span className="fc-article__dot">•</span>
                      <span className="fc-article__ago">{a.ago}</span>
                    </div>
                  </div>

                  <div className="fc-article__slot-info">
                    <span className="fc-slot-badge">{a.slot}</span>
                    <span className="fc-article__expires">{a.expires}</span>
                  </div>

                  <div className="fc-article__views">
                    <span className="fc-article__views-num">{a.views}</span>
                    <span className="fc-article__views-label">Views</span>
                  </div>

                  <div className="fc-article__actions">
                    <Toggle on={a.enabled} onChange={() => toggleArticle(a.id)} />
                    <button className="fc-action-btn fc-action-btn--edit" title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="fc-action-btn fc-action-btn--delete"
                      title="Delete"
                      onClick={() => deleteArticle(a.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {articles.length === 0 && (
                <div className="fc-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <p>No featured articles yet. Add one to get started.</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <HomepageLayout />
        )}
      </div>

      {/* ── Add Modal ── */}
      {showModal && (
        <div className="fc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fc-modal__header">
              <h3 className="fc-modal__title">Add Featured Article</h3>
              <button className="fc-modal__close" onClick={() => setShowModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="fc-modal__body">
              <p className="fc-modal__hint">Search and select an article to feature on the homepage.</p>
              <div className="fc-modal__search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Search articles…" className="fc-modal__input" autoFocus />
              </div>
              <div className="fc-modal__actions">
                <button className="fc-modal__cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="fc-modal__confirm" onClick={() => setShowModal(false)}>Add Article</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}