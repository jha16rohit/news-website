import React, { useState,useEffect } from "react"; // 👇 FIX: Added useEffect here!
import { Clock} from "lucide-react"; 
import { Link } from "react-router-dom";
import "./LatestNews.css";
import { getTrendingNews } from "../../../api/user/trendingNews";

const LatestNews: React.FC = () => {
  const [showAll, setShowAll] = useState(false);



  const [newsData, setNewsData] = useState<any[]>([]);

  useEffect(() => {
  const fetchNews = async () => {
    try {
      const response =
        await getTrendingNews();

      setNewsData(
        response.news || []
      );
    } catch (error) {
      console.error(error);
    }
  };

  fetchNews();

  const interval =
    setInterval(
      fetchNews,
      60 * 60 * 1000
    ); // 1 hour

  return () =>
    clearInterval(interval);

}, []);

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
              to={`/news/${article.slug}`}
              className="news-card text-decoration-none" 
              key={article._id}
            >
              <div className="news-img-wrapper">
                <img
  src={article.featuredImage}
  alt={article.headline}
  className="news-img"
/>
              </div>
              
              <div className="news-content">
                <span className="card-badge">{article.category}</span>
               <h3 className="news-title">
  {article.headline}
</h3>
                <p className="news-excerpt">{article.excerpt}</p>
                
                <div className="news-meta">
                  <span><Clock size={16} />{new Date(
  article.createdAt
).toLocaleDateString()}</span>
                  
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