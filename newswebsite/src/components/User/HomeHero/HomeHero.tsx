import React from "react";
import { Clock, Eye, TrendingUp, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import "./HomeHero.css";

const HeroSection: React.FC = () => {
  // Existing Image Trending Data
  const trendingArticles = [
    {
      id: 1, 
      category: "SPORTS",
      title: "India Clinches Historic Test Series Win Against Australia 3-1",
      time: "3 hours ago",
      imgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 2,
      category: "BUSINESS",
      title: "Sensex Surges 800 Points as FIIs Pour Record Capital Into Indian Markets",
      time: "4 hours ago",
      imgUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 3,
      category: "TECHNOLOGY",
      title: "AI Revolution: How Indian Tech Giants Are Leading the Global Race",
      time: "5 hours ago",
      imgUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 4,
      category: "ENTERTAINMENT",
      title: "Bollywood's New Wave: Independent Cinema Takes Center Stage",
      time: "6 hours ago",
      imgUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200",
    },
  ];

  // 👇 NEW: Live Updates Data
  const liveUpdates = [
    { id: 1, time: "12:45 PM", text: "PM addresses the nation on education reform passage" },
    { id: 2, time: "12:30 PM", text: "Opposition parties react to the bill — mixed responses" },
    { id: 3, time: "12:15 PM", text: "Bill passed with 356 votes in favor, 98 against" },
    { id: 4, time: "12:00 PM", text: "Final round of voting begins in Parliament" },
    { id: 5, time: "11:45 AM", text: "Heated debate continues on digital literacy provisions" },
    { id: 6, time: "11:30 AM", text: "Education Minister presents the bill's key highlights" },
    { id: 7, time: "11:00 AM", text: "Parliament session begins with the education reform bill on the agenda" },
  ];

  // 👇 NEW: Numbered Trending Data
  const numberedTrending = [
    { id: 1, title: "Education Reform: What It Means for Students", views: "250K" },
    { id: 2, title: "Stock Market Analysis: Bulls vs Bears in 2026", views: "180K" },
    { id: 3, title: "Cricket World Cup Squad Selection Controversy", views: "156K" },
    { id: 4, title: "AI Revolution: India's Tech Giants Lead the Way", views: "134K" },
    { id: 5, title: "Budget 2026: Key Takeaways for Common Man", views: "98K" }
  ];

  return (
    <section className="hero-section">
      <div className="hero-container">
        
        {/* ================= TOP ROW ================= */}
        <div className="hero-top-row">
          
          {/* Left Side: Featured Article */}
          <Link to="/article/1" className="featured-article text-decoration-none">
            <img 
              src="https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&q=80&w=1200" 
              alt="Parliament" 
              className="featured-bg-img" 
            />
            <div className="featured-overlay">
              <span className="category-badge politics">POLITICS</span>
              <h1 className="featured-title">
                Parliament Passes Historic Budget Bill: What It Means For India's Economy
              </h1>
              <p className="featured-excerpt">
                In a landmark session, the Indian Parliament has passed the most ambitious budget bill in recent history, promising sweeping reforms across healthcare, education, and infrastructure sectors.
              </p>
              <div className="featured-meta">
                <span><Clock size={16} /> 2 hours ago</span>
                <span><Eye size={16} /> 24,500 views</span>
              </div>
            </div>
          </Link>

          {/* Right Side: Image Trending Sidebar */}
          <div className="trending-sidebar">          
            <div className="trending-list">
              {trendingArticles.map((article) => (
                <Link 
                  to={`/article/${article.id}`} 
                  className="trending-card text-decoration-none" 
                  key={article.id}
                >
                  <img src={article.imgUrl} alt={article.title} className="trending-img" />
                  <div className="trending-info">
                    <span className="trending-category">{article.category}</span>
                    <h3 className="trending-title">{article.title}</h3>
                    <span className="trending-time">{article.time}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ================= BOTTOM ROW (NEW!) ================= */}
        <div className="hero-bottom-row">
          
          {/* Left Side: Live Updates (2/3 width) */}
          <div className="live-updates-card">
            <div className="section-header">
              <span className="live-dot"></span>
              <h2>LIVE UPDATES</h2>
            </div>
            <div className="live-list">
              {liveUpdates.map((update) => (
                <div key={update.id} className="live-item">
                  <span className="live-time">{update.time}</span>
                  <span className="live-text">{update.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Numbered Trending (1/3 width) */}
          <div className="trending-numbered-card">
            <div className="section-header">
              <TrendingUp size={20} color="#dc2626" strokeWidth={3} />
              <Flame size={20} color="#f97316" fill="#f97316" />
              <h2>TRENDING</h2>
            </div>
            <div className="numbered-list">
              {numberedTrending.map((trend, index) => (
                <Link key={trend.id} to={`/article/${trend.id}`} className="numbered-item text-decoration-none">
                  <div className="trend-rank">{index + 1}</div>
                  <div className="trend-details">
                    <h4>{trend.title}</h4>
                    <span className="trend-views"><Eye size={14} /> {trend.views} views</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HeroSection;