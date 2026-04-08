import React from "react";
import { TrendingUp, ArrowRight } from "lucide-react";
import "./TrendingToday.css";

const TrendingToday: React.FC = () => {
  const trendingData = [
    {
      id: 1,
      category: "POLITICS",
      title: "Parliament Passes Historic Budget Bill: What It Means For India's Economy",
      meta: "2 hours ago · 24,500 views",
      imgUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 2,
      category: "SPORTS",
      title: "India Clinches Historic Test Series Win Against Australia 3-1",
      meta: "3 hours ago · 18,200 views",
      imgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 3,
      category: "BUSINESS",
      title: "Sensex Surges 800 Points as FIIs Pour Record Capital Into Indian Markets",
      meta: "4 hours ago · 12,300 views",
      imgUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 4,
      category: "TECHNOLOGY",
      title: "AI Revolution: How Indian Tech Giants Are Leading the Global Race",
      meta: "5 hours ago · 9,800 views",
      imgUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 5,
      category: "ENTERTAINMENT",
      title: "Bollywood's New Wave: Independent Cinema Takes Center Stage",
      meta: "6 hours ago · 7,500 views",
      imgUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200",
    }
  ];

  return (
    <section className="trending-section">
      <div className="trending-container">
        
        {/* Header */}
        <div className="trending-header">
          <div className="trending-title-wrapper">
            <TrendingUp size={28} className="trending-icon" strokeWidth={2.5} />
            <h2>Trending Today</h2>
            <div className="header-underline"></div>
          </div>
          <a href="#" className="view-all-link">
            View All <ArrowRight size={16} />
          </a>
        </div>

        {/* List Container */}
        <div className="trending-list-card">
          {trendingData.map((item) => (
            <div className="trending-row" key={item.id}>
              
              {/* Thumbnail Image Moved to the Left! */}
              <div className="trending-image-wrapper">
                <img src={item.imgUrl} alt={item.title} className="trending-thumbnail" />
              </div>

              {/* Text Content */}
              <div className="trending-content">
                <span className="trending-category">{item.category}</span>
                <h3 className="trending-title">{item.title}</h3>
                <span className="trending-meta">{item.meta}</span>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TrendingToday;