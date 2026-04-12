import React, { useState } from "react";
import "./Livestories.css";

interface LiveStory {
  id: number;
  status: "live" | "draft" | "ended";
  category: string;
  title: string;
  startedAt: string;
  updates: number;
  views: string;
  lastUpdate: string;
}

const liveStories: LiveStory[] = [
  {
    id: 1,
    status: "live",
    category: "Sports",
    title: "India vs Australia 2nd ODI – Live Score & Updates",
    startedAt: "Today, 2:00 PM",
    updates: 34,
    views: "245.8K",
    lastUpdate: "2 min ago",
  },
  {
    id: 2,
    status: "live",
    category: "Politics",
    title: "Union Budget 2025 Parliament Session – Live Coverage",
    startedAt: "Today, 11:00 AM",
    updates: 67,
    views: "189.4K",
    lastUpdate: "5 min ago",
  },
  {
    id: 3,
    status: "live",
    category: "Weather",
    title: "Cyclone Tracking: Coastal Region Updates",
    startedAt: "Yesterday, 8:00 PM",
    updates: 22,
    views: "312.0K",
    lastUpdate: "12 min ago",
  },
];

const draftStories = [
  {
    id: 4,
    status: "draft",
    category: "Business",
    title: "Stock Market Crash: Real-Time Market Tracking",
    note: "Ready to go live — publish article first, then start live updates",
  },
];

const pastStories = [
  {
    id: 5,
    status: "ended",
    category: "Politics",
    title: "Election Night Results – State Assembly 2025",
    dateRange: "Feb 14, 8:00 AM → Feb 14, 11:45 PM",
    updates: 158,
    views: "1240K",
  },
];

const LiveStoriesPage: React.FC = () => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const toggleMenu = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="ls-page" onClick={() => setOpenMenuId(null)}>
      {/* Header */}
      <div className="ls-header">
        <div className="ls-header-left">
          <div className="ls-title-row">
            <span className="ls-live-icon">
              <span className="ls-live-dot" />
            </span>
            <h1 className="ls-title">Live Stories</h1>
          </div>
          <p className="ls-subtitle">Manage real-time live coverage and event updates</p>
        </div>
        <div className="ls-header-actions">
          <button className="ls-btn-refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
            </svg>
            Refresh
          </button>
          <button className="ls-btn-new">
            <span>+</span> New Live Story
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="ls-stats">
        <div className="ls-stat-card">
          <div className="ls-stat-info">
            <span className="ls-stat-label">Currently Live</span>
            <span className="ls-stat-value">3</span>
          </div>
          <span className="ls-stat-icon ls-stat-icon--live">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
              <path d="M7.76 7.76a6 6 0 0 0 0 8.49" />
              <path d="M20.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M3.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
          </span>
        </div>
        <div className="ls-stat-card">
          <div className="ls-stat-info">
            <span className="ls-stat-label">Draft (Ready)</span>
            <span className="ls-stat-value">1</span>
          </div>
          <span className="ls-stat-icon ls-stat-icon--draft">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
        </div>
        <div className="ls-stat-card">
          <div className="ls-stat-info">
            <span className="ls-stat-label">Past Live</span>
            <span className="ls-stat-value">3</span>
          </div>
          <span className="ls-stat-icon ls-stat-icon--past">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </span>
        </div>
        <div className="ls-stat-card">
          <div className="ls-stat-info">
            <span className="ls-stat-label">Total Updates</span>
            <span className="ls-stat-value">413</span>
          </div>
          <span className="ls-stat-icon ls-stat-icon--updates">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="ls-search-wrap">
        <svg className="ls-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input className="ls-search" type="text" placeholder="Search live stories..." />
      </div>

      {/* Current Live */}
      <section className="ls-section">
        <div className="ls-section-header">
          <span className="ls-section-dot" />
          <h2 className="ls-section-title">Current Live</h2>
          <span className="ls-badge ls-badge--active">3 active</span>
        </div>

        <div className="ls-stories-list">
          {liveStories.map((story) => (
            <div className="ls-story-card" key={story.id}>
              <div className="ls-story-main">
                <div className="ls-story-tags">
                  <span className="ls-tag ls-tag--live">LIVE</span>
                  <span className="ls-story-category">{story.category}</span>
                </div>
                <h3 className="ls-story-title">{story.title}</h3>
                <div className="ls-story-meta">
                  <span className="ls-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Started: {story.startedAt}
                  </span>
                  <span className="ls-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {story.updates} updates
                  </span>
                  <span className="ls-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {story.views} views
                  </span>
                  <span className="ls-meta-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Last update: {story.lastUpdate}
                  </span>
                </div>
              </div>
              <div className="ls-story-actions" onClick={(e) => e.stopPropagation()}>
                <button className="ls-btn-add-update">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Add Update
                </button>
                <button className="ls-btn-end-live">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  End Live
                </button>
                <div className="ls-more-wrap">
                  <button
                    className="ls-btn-more"
                    onClick={() => toggleMenu(story.id)}
                  >
                    ···
                  </button>
                  {openMenuId === story.id && (
                    <div className="ls-dropdown">
                      <button className="ls-dropdown-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Story
                      </button>
                      <button className="ls-dropdown-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        View Public Page
                      </button>
                      <button className="ls-dropdown-item ls-dropdown-item--danger">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                        Delete Story
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Draft */}
      <section className="ls-section">
        <div className="ls-section-header ls-section-header--muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h2 className="ls-section-title">Draft — Ready to Go Live</h2>
          <span className="ls-badge ls-badge--count">1</span>
        </div>

        <div className="ls-stories-list">
          {draftStories.map((story) => (
            <div className="ls-story-card ls-story-card--draft" key={story.id}>
              <div className="ls-story-main">
                <div className="ls-story-tags">
                  <span className="ls-tag ls-tag--draft">DRAFT</span>
                  <span className="ls-story-category">{story.category}</span>
                </div>
                <h3 className="ls-story-title">{story.title}</h3>
                <p className="ls-story-note">{story.note}</p>
              </div>
              <div className="ls-story-actions">
                <button className="ls-btn-go-live">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="2" fill="white" />
                    <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
                    <path d="M7.76 7.76a6 6 0 0 0 0 8.49" />
                  </svg>
                  Go Live Now
                </button>
                <button className="ls-btn-edit-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Live */}
      <section className="ls-section">
        <div className="ls-section-header ls-section-header--muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
          <h2 className="ls-section-title">Past Live</h2>
          <span className="ls-badge ls-badge--count">3</span>
        </div>

        <div className="ls-stories-list">
          {pastStories.map((story) => (
            <div className="ls-story-card" key={story.id}>
              <div className="ls-story-main">
                <div className="ls-story-tags">
                  <span className="ls-tag ls-tag--ended">ENDED</span>
                  <span className="ls-story-category">{story.category}</span>
                </div>
                <h3 className="ls-story-title">{story.title}</h3>
                <div className="ls-story-meta">
                  <span className="ls-meta-item">{story.dateRange}</span>
                  <span className="ls-meta-item">{story.updates} updates</span>
                  <span className="ls-meta-item">{story.views} views</span>
                </div>
              </div>
              <div className="ls-story-actions">
                <button className="ls-btn-icon-ghost">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button className="ls-btn-more">···</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LiveStoriesPage;