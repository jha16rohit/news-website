import React from "react";
import { Play, ArrowRight } from "lucide-react";
import "./Videos.css";

const Videos: React.FC = () => {
  // Data matching your image perfectly
  const videoData = [
    {
      id: 1,
      category: "POLITICS",
      title: "Budget 2026: Key Highlights Explained",
      views: "45,000 views",
      duration: "12:45",
      imgUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 2,
      category: "SPORTS",
      title: "Kohli's Century: Match Winning Innings",
      views: "120,000 views",
      duration: "5:30",
      imgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 3,
      category: "TECHNOLOGY",
      title: "AI in India: The Future is Here",
      views: "32,000 views",
      duration: "15:20",
      imgUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 4,
      category: "SCIENCE",
      title: "Inside ISRO's Mars Mission Lab",
      views: "67,000 views",
      duration: "20:00",
      imgUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=600",
    }
  ];

  return (
    <section className="videos-section">
      <div className="videos-container">
        
        {/* Header */}
        <div className="videos-header">
          <div className="videos-title-wrapper">
            <Play size={28} className="videos-icon" strokeWidth={2.5} />
            <h2>Videos</h2>
            <div className="header-underline"></div>
          </div>
          <a href="#" className="view-all-link">
            View All <ArrowRight size={16} />
          </a>
        </div>

        {/* Video Grid */}
        <div className="videos-grid">
          {videoData.map((video) => (
            <div className="video-card" key={video.id}>
              
              {/* Thumbnail Container */}
              <div className="video-thumbnail-wrapper">
                <img src={video.imgUrl} alt={video.title} className="video-thumbnail" />
                
                {/* Red Play Button Overlay */}
                <div className="play-button-overlay">
                  <Play size={20} fill="white" color="white" className="play-icon-inner" />
                </div>
                
                {/* Duration Badge */}
                <span className="duration-badge">{video.duration}</span>
              </div>

              {/* Video Info Content */}
              <div className="video-content">
                <span className="video-category">{video.category}</span>
                <h3 className="video-title">{video.title}</h3>
                <span className="video-views">{video.views}</span>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Videos;