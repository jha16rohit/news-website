import React, { useState, useEffect } from "react";
import { Clock, Eye, Bookmark } from "lucide-react"; 
import { Link } from "react-router-dom";
import "./HomeHero.css";

const HeroSection: React.FC = () => {
  // 1. Initialize state from localStorage
  const [savedArticles, setSavedArticles] = useState<number[]>(() => {
    const saved = localStorage.getItem("localNewzSavedArticles");
    return saved ? JSON.parse(saved) : [];
  });

  // 👇 Listen for saves happening in other components so the homepage stays synced!
  useEffect(() => {
    const syncSavedArticles = () => {
      const saved = localStorage.getItem("localNewzSavedArticles");
      setSavedArticles(saved ? JSON.parse(saved) : []);
    };
    
    window.addEventListener("localNewzSavedUpdate", syncSavedArticles);
    return () => window.removeEventListener("localNewzSavedUpdate", syncSavedArticles);
  }, []);

  // 2. The universal toggle function
  const toggleSave = (e: React.MouseEvent, id: number) => {
    e.preventDefault(); // Stop links from firing
    
    let currentSaved = JSON.parse(localStorage.getItem("localNewzSavedArticles") || "[]");
    
    if (currentSaved.includes(id)) {
      currentSaved = currentSaved.filter((savedId: number) => savedId !== id);
    } else {
      currentSaved.push(id);
    }
    
    // Save to browser
    localStorage.setItem("localNewzSavedArticles", JSON.stringify(currentSaved));
    // Update local button color
    setSavedArticles(currentSaved);
    
    // Broadcast the change so the Profile page instantly updates!
    window.dispatchEvent(new Event("localNewzSavedUpdate"));
  };

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
              
              {/* 👇 FIX: Changed 999 to 1 to match the article ID! 👇 */}
              <button 
                className="save-btn featured-save-btn" 
                onClick={(e) => toggleSave(e, 1)}
                aria-label="Save featured article"
              >
                <Bookmark 
                  size={24} 
                  fill={savedArticles.includes(1) ? "#e60000" : "none"} 
                  color={savedArticles.includes(1) ? "#e60000" : "#ffffff"} 
                />
              </button>
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
                    
                    {/* Header Row: Category on left, Save Icon on right */}
                    <div className="trending-info-header">
                      <span className="trending-category">{article.category}</span>
                      <button 
                        className="save-btn" 
                        onClick={(e) => toggleSave(e, article.id)}
                        aria-label="Save article"
                      >
                        <Bookmark 
                          size={18} 
                          fill={savedArticles.includes(article.id) ? "#e60000" : "none"} 
                          color={savedArticles.includes(article.id) ? "#e60000" : "#94a3b8"} 
                        />
                      </button>
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