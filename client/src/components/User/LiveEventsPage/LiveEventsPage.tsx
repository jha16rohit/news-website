import React from "react";
import { Link } from "react-router-dom";
import { Radio } from "lucide-react";
import "./LiveEventsPage.css";

const LiveEventsPage: React.FC = () => {
  // Mock data for all live events
  const allLiveEvents = [
    {
      id: 1,
      category: "POLITICS",
      title: "Parliament Session Live: Budget Bill Debate Continues",
      updates: "245 updates",
      time: "2 min ago",
      imgUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 2,
      category: "SPORTS",
      title: "India vs Australia 4th Test — Day 3",
      updates: "132 updates",
      time: "Just now",
      imgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 3,
      category: "BUSINESS",
      title: "Stock Market Live: Sensex & Nifty Tracker",
      updates: "89 updates",
      time: "5 min ago",
      imgUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 4,
      category: "TECHNOLOGY",
      title: "Global Tech Summit 2026: Keynote Address",
      updates: "42 updates",
      time: "12 min ago",
      imgUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 5,
      category: "WORLD",
      title: "UN Climate Council Emergency Meeting",
      updates: "18 updates",
      time: "15 min ago",
      imgUrl: "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 6,
      category: "HEALTH",
      title: "Ministry of Health Press Conference on New Guidelines",
      updates: "56 updates",
      time: "22 min ago",
      imgUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 8,
      category: "SCIENCE",
      title: "ISRO Mars Mission Launch Control - Countdown",
      updates: "110 updates",
      time: "2 min ago",
      imgUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 9,
      category: "CRIME",
      title: "High Court Begins Hearing on Major Cyber Fraud Case",
      updates: "14 updates",
      time: "28 min ago",
      imgUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
    }
  ];

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
          {allLiveEvents.map((item) => (
            <Link 
              to={`/live/${item.id}`} 
              className="live-grid-card text-decoration-none" 
              key={item.id}
            >
              <div className="card-image-wrapper" style={{ backgroundImage: `url(${item.imgUrl})` }}>
                <div className="live-status-badge">
                  <span className="pulsing-dot"></span> LIVE
                </div>
                <div className="card-overlay">
                  <span className="card-category">{item.category}</span>
                  <h3 className="card-title">{item.title}</h3>
                </div>
              </div>
              <div className="card-footer">
                <span className="updates-count">{item.updates}</span>
                <span className="update-time">{item.time}</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default LiveEventsPage;