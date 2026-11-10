import React, { useState } from "react";
import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import "./LatestNews.css";
import { StatusBadge } from "../../UI/StatusBadge";

interface LatestNewsProps {
  trendingNews?: any[];
}

const LatestNews: React.FC<LatestNewsProps> = ({
  trendingNews = [],
}) => {
  const [showAll, setShowAll] = useState(false);

  const visibleArticles = showAll ? trendingNews : trendingNews.slice(0, 8);

  const getArticleUrl = (article: any): string | null => {
    const slug = article?.slug;
    if (slug) return `/news/${slug}`;
    const id = article?._id || article?.id;
    if (id) return `/article/${id}`;
    return null;
  };

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
          {visibleArticles.map((article) => {
            const articleUrl = getArticleUrl(article);
            if (!articleUrl) {
              return null;
            }

            return (
              <Link
                to={articleUrl}
                className="news-card text-decoration-none"
                key={String(article._id ?? article.id ?? article.slug)}
              >
                <div className="news-img-wrapper">
                  <img
                    src={
                      article.featuredImage ||
                      "https://placehold.co/400x225/e2e8f0/64748b?text=No+Image"
                    }
                    alt={article.headline}
                    className="news-img"
                  />
                </div>

                <div className="news-content">
                  <div className="news-badges">
                    <StatusBadge
                      articleType={article.articleType}
                      statusType={article.statusType}
                      variant="compact"
                    />
                    <span className="card-badge">{article.categoryId?.name ?? article.category}</span>
                  </div>
                  <h3 className="news-title">{article.headline}</h3>
                  <p className="news-excerpt">{article.excerpt}</p>

                  <div className="news-meta">
                    <span>
                      <Clock size={16} />
                      {article.createdAt && !isNaN(new Date(article.createdAt).getTime())
                        ? new Date(article.createdAt).toLocaleDateString()
                        : "Recently"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Show More Button */}
        {trendingNews.length > 8 && (
          <div className="show-more-wrapper">
            <button
              className="show-more-btn"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "SHOW LESS" : "SHOW MORE"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestNews;