import React from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, Share2, Facebook, Twitter, AlertCircle } from "lucide-react";
import "./LiveDetails.css";

const LiveDetail: React.FC = () => {
  const { eventId } = useParams();

  // Mock data for a Live Event
  const liveEvent = {
    title: "Parliament Session Live: Budget Bill Debate Continues",
    category: "Politics",
    status: "LIVE", // Can be "LIVE" or "ENDED"
    viewers: "12.5K",
    lastUpdated: "Just now",
    videoUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=1200", // Placeholder for video thumbnail
    updates: [
      {
        id: 1,
        time: "10:45 AM",
        title: "Finance Minister Takes the Floor",
        content: "The Finance Minister has begun addressing the opposition's concerns regarding the proposed healthcare budget cuts.",
        isImportant: true,
      },
      {
        id: 2,
        time: "10:30 AM",
        title: "Session Resumes After Brief Recess",
        content: "Members of Parliament have returned to their seats. The Speaker has called the house to order.",
        isImportant: false,
      },
      {
        id: 3,
        time: "09:15 AM",
        title: "Opposition Demands Clarification on Tech Subsidies",
        content: "Several opposition leaders have walked to the well of the house demanding a detailed breakdown of the subsidies proposed for foreign tech companies.",
        isImportant: true,
      },
      {
        id: 4,
        time: "09:00 AM",
        title: "Session Begins",
        content: "The parliamentary session has officially started for the day. Attendance is at 95%.",
        isImportant: false,
      }
    ]
  };

  return (
    <div className="live-page">
      <div className="live-container">
        
        {/* Main Feed Column */}
        <main className="live-main">
          
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="divider">/</span>
            <span className="current">Live Updates</span>
          </div>

          {/* Header Area */}
          <div className="live-header-box">
            <div className="live-badges">
              <span className="live-indicator">
                <span className="pulsing-dot"></span>
                LIVE
              </span>
              <span className="live-category">{liveEvent.category}</span>
            </div>
            <h1 className="live-headline">{liveEvent.title}</h1>
            <div className="live-meta">
              <span><AlertCircle size={16} /> Last updated: {liveEvent.lastUpdated}</span>
              <span><Clock size={16} /> {liveEvent.viewers} watching</span>
            </div>
          </div>

          {/* Video / Main Image Area */}
          <div className="live-media-player">
            <img src={liveEvent.videoUrl} alt="Live Stream" className="live-video-placeholder" />
            <div className="play-button-overlay">▶</div>
          </div>

          {/* The Timeline Feed */}
          <div className="timeline-container">
            <div className="timeline-header">
              <h2>Latest Updates</h2>
              <div className="share-buttons">
                <button className="share-btn fb"><Facebook size={14} /></button>
                <button className="share-btn tw"><Twitter size={14} /></button>
              </div>
            </div>

            <div className="timeline-feed">
              {liveEvent.updates.map((update) => (
                <div className={`timeline-item ${update.isImportant ? 'important-update' : ''}`} key={update.id}>
                  {/* The dot and line */}
                  <div className="timeline-marker">
                    <div className="timeline-dot"></div>
                    <div className="timeline-line"></div>
                  </div>
                  
                  {/* The content */}
                  <div className="timeline-content">
                    <span className="update-time">{update.time}</span>
                    <h3 className="update-title">{update.title}</h3>
                    <p className="update-text">{update.content}</p>
                    {update.isImportant && <span className="key-event-tag">Key Event</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>

        {/* Sidebar */}
        <aside className="live-sidebar">
          <div className="sidebar-widget">
            <h3 className="widget-title">About This Event</h3>
            <div className="widget-underline"></div>
            <p className="widget-text">
              Follow our real-time coverage as the Indian Parliament debates the landmark 2026 Budget Bill. Key focus areas include healthcare, infrastructure, and technology subsidies.
            </p>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Key Speakers Today</h3>
            <div className="widget-underline"></div>
            <ul className="speaker-list">
              <li>Finance Minister</li>
              <li>Leader of the Opposition</li>
              <li>Minister of IT & Communications</li>
            </ul>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default LiveDetail;