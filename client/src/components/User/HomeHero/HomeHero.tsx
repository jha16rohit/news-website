import React, { useRef } from "react";
import { Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react"; 
import { Link } from "react-router-dom";
import "./HomeHero.css";

const HeroSection: React.FC = () => {
  // Reference for the scrolling tags container
  const tagsScrollRef = useRef<HTMLDivElement>(null);

  // Mock data for the trending tags
  const trendingTags = [
    "Budget 2026", "Election Results", "IPL Live", "Stock Market", 
    "Tech Trends", "Local News", "Global Affairs", "Health & Wellness", 
    "Startups", "Bollywood Updates", "Space Missions", "AI Revolution"
  ];

  const trendingArticles = [
    {
      id: 2,
      category: "SPORTS",
      title: "India Clinches Historic Test Series Win Against Australia 3-1",
      time: "3 hours ago",
      imgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 3,
      category: "BUSINESS",
      title: "Sensex Surges 800 Points as FIIs Pour Record Capital Into Indian Markets",
      time: "4 hours ago",
      imgUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 4,
      category: "TECHNOLOGY",
      title: "AI Revolution: How Indian Tech Giants Are Leading the Global Race",
      time: "5 hours ago",
      imgUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=200",
    },
    {
      id: 5,
      category: "ENTERTAINMENT",
      title: "Bollywood's New Wave: Independent Cinema Takes Center Stage",
      time: "6 hours ago",
      imgUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200",
    },
  ];

  // Function to smoothly scroll the tags horizontally
  const scrollTags = (direction: 'left' | 'right') => {
    if (tagsScrollRef.current) {
      const scrollAmount = 250;
      tagsScrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <section className="hero-section" id="hero-section">
      <div className="hero-container">
        
        {/* ================= TRENDING TAGS TOP BAR ================= */}
        <div className="trending-tags-container">
          <button className="tag-scroll-btn left" onClick={() => scrollTags('left')}>
            <ChevronLeft size={20} />
          </button>
          
          <div className="tags-scroll-wrapper" ref={tagsScrollRef}>
            {trendingTags.map((tag, index) => {
              // Formats "Budget 2026" to "budget-2026"
              const slug = tag.toLowerCase().replace(/\s+/g, '-'); 
              return (
                <Link to={`/tag/${slug}`} key={index} className="tag-pill text-decoration-none">
                  {tag}
                </Link>
              );
            })}
          </div>

          <button className="tag-scroll-btn right" onClick={() => scrollTags('right')}>
            <ChevronRight size={20} />
          </button>
        </div>

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
            <div className="section-header aa1">
              <h2>Recent News</h2>
              <div className="header-underline"></div>
            </div>
            <div className="trending-list">
              {trendingArticles.map((article) => (
                <Link 
                  to={`/article/${article.id}`} 
                  className="trending-card text-decoration-none" 
                  key={article.id}
                >
                  <img src={article.imgUrl} alt={article.title} className="trending-img" />
                  <div className="trending-info">
                    
                    {/* Header Row: Category on left */}
                    <div className="trending-info-header">
                      <span className="trending-category">{article.category}</span>
                    </div>

                    <h3 className="trending-title">{article.title}</h3>
                    <span className="trending-time">{article.time}</span>
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