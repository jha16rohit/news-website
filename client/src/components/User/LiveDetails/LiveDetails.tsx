import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock, Facebook, Twitter, AlertCircle } from "lucide-react";
import "./LiveDetails.css";
import { getLiveEventById } from "../../../api/user/liveEvent";
import Preloader from "../../Admin/Preloader/Preloder";
import NotFound404 from "../Errors/NotFound404";

interface LiveEvent {
  _id: string;
  title: string;
  category: string;
  status: string;
  viewers: string;
  lastUpdated: string;
  videoUrl?: string;
  updates: Array<{
    id: string;
    time: string;
    title: string;
    content: string;
    isImportant: boolean;
    imageUrl?: string;
  }>;
  createdAt: string;
}

const LiveDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [liveEvent, setLiveEvent] = useState<LiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const data = await getLiveEventById(eventId!);
        setLiveEvent(data);
      } catch (error: any) {
        console.error("Failed to fetch live event:", error);
        const errorMessage = error?.message || "";
        if (errorMessage.includes("not found") || errorMessage.includes("404")) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  if (loading) {
    return <Preloader />;
  }

  if (notFound || !liveEvent) {
    return <NotFound404 />;
  }

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
                {liveEvent.status}
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