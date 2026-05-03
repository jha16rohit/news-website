import React, { useState } from "react"; // 👇 FIX: Added useEffect here!
import { Clock, Eye } from "lucide-react"; 
import { Link } from "react-router-dom";
import "./LatestNews.css";

const LatestNews: React.FC = () => {
  const [showAll, setShowAll] = useState(false);



  // Data matching your mockups perfectly
  const newsData = [
    {
      id: 1,
      category: "POLITICS",
      title: "Parliament Passes Historic Budget Bill: What It Means For India's Economy",
      excerpt: "In a landmark session, the Indian Parliament has passed the most ambitious budget bill in recent...",
      time: "2 hours ago",
      views: "24,500",
      imgUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 2,
      category: "SPORTS",
      title: "India Clinches Historic Test Series Win Against Australia 3-1",
      excerpt: "A thrilling final day in Sydney sees India seal their greatest overseas triumph.",
      time: "3 hours ago",
      views: "18,200",
      imgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 3,
      category: "BUSINESS",
      title: "Sensex Surges 800 Points as FIIs Pour Record Capital Into Indian Markets",
      excerpt: "Foreign institutional investors bet big on India's growth story.",
      time: "4 hours ago",
      views: "12,300",
      imgUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 4,
      category: "TECHNOLOGY",
      title: "AI Revolution: How Indian Tech Giants Are Leading the Global Race",
      excerpt: "From Bengaluru to Hyderabad, Indian startups are redefining artificial intelligence.",
      time: "5 hours ago",
      views: "9,800",
      imgUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 5,
      category: "ENTERTAINMENT",
      title: "Bollywood's New Wave: Independent Cinema Takes Center Stage",
      excerpt: "A new generation of filmmakers is reshaping Indian cinema with bold storytelling.",
      time: "6 hours ago",
      views: "7,500",
      imgUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 6,
      category: "POLITICS",
      title: "PM Modi At G20 Summit: Key Trade Deals and Climate Commitments",
      excerpt: "India pushes for stronger developing-nation representation at the global stage.",
      time: "7 hours ago",
      views: "15,600",
      imgUrl: "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 7,
      category: "HEALTH",
      title: "Indian Scientists Develop Breakthrough Dengue Vaccine With 95% Efficacy",
      excerpt: "ICMR-backed research shows promising results in phase 3 trials.",
      time: "8 hours ago",
      views: "11,200",
      imgUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=600", 
    },
    {
      id: 8,
      category: "SCIENCE",
      title: "ISRO Announces Ambitious Mars Sample Return Mission for 2028",
      excerpt: "India's space agency plans its most complex interplanetary mission yet.",
      time: "1 day ago",
      views: "20,100",
      imgUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=600", 
    },
    {
      id: 9,
      category: "BUSINESS",
      title: "Indian Startups Raise Record $15 Billion in Q1 2026",
      excerpt: "Investor confidence in India's startup ecosystem reaches all-time high.",
      time: "1 day ago",
      views: "8,900",
      imgUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600", 
    }
  ];

  const visibleArticles = showAll ? newsData : newsData.slice(0, 6);

  return (
    <section className="latest-news-section">
      <div className="latest-news-container">
        
        {/* Section Header */}
        <div className="section-header">
          <h2>Trending News</h2>
          <div className="header-underline"></div>
        </div>

        {/* News Grid */}
        <div className="news-grid">
          {visibleArticles.map((article) => (
            
            <Link 
              to={`/article/${article.id}`} 
              className="news-card text-decoration-none" 
              key={article.id}
            >
              <div className="news-img-wrapper">
                <img src={article.imgUrl} alt={article.title} className="news-img" />
              </div>
              
              <div className="news-content">
                <span className="card-badge">{article.category}</span>
                <h3 className="news-title">{article.title}</h3>
                <p className="news-excerpt">{article.excerpt}</p>
                
                <div className="news-meta">
                  <span><Clock size={16} /> {article.time}</span>
                  <span><Eye size={16} /> {article.views} views</span>
                </div>
              </div>
            </Link>

          ))}
        </div>

        {/* Show More Button */}
        <div className="show-more-wrapper">
          <button 
             className="show-more-btn"
             onClick={() => setShowAll(!showAll)}
          >
             {showAll ? 'SHOW LESS' : 'SHOW MORE'}
          </button>
        </div>

      </div>
    </section>
  );
};

export default LatestNews;