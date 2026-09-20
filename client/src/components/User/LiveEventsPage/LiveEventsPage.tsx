import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Radio } from "lucide-react";
import "./LiveEventsPage.css";
import { getLiveEvents } from "../../../api/user/liveEvent";
import Preloader from "../../Admin/Preloader/Preloder";

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

const LiveEventsPage: React.FC = () => {
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getLiveEvents();
        setLiveEvents(data || []);
      } catch (error) {
        console.error("Failed to fetch live events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return <Preloader />;
  }

  return (
    <div className="live-events-page">
      <div className="live-events-container">
        
        {/* Page Header */}
        <div className="page-header">
          <div className="header-title-wrapper">
            <Radio size={32} className="pulsing-icon" />
            <h1>Live Coverage Directory</h1>
          </div>
          <p className="header-subtitle">Real-time updates, breaking news, and live streams happening right now.</p>
          <div className="header-underline"></div>
        </div>

        {/* Live Events Grid */}
        <div className="live-events-grid">
          {liveEvents.map((item) => (
            <Link
              to={`/live/${item._id}`}
              className="live-grid-card text-decoration-none"
              key={item._id}
            >
              <div
                className="card-image-wrapper"
                style={{
                  backgroundImage: `url(${item.videoUrl || "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800"})`,
                }}
              >
                <div className="live-status-badge">
                  <span className="pulsing-dot"></span> {item.status}
                </div>
                <div className="card-overlay">
                  <span className="card-category">{item.category}</span>
                  <h3 className="card-title">{item.title}</h3>
                </div>
              </div>
              <div className="card-footer">
                <span className="updates-count">{item.updates.length} updates</span>
                <span className="update-time">{item.lastUpdated}</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default LiveEventsPage;