import React, { useRef, useEffect, useState } from "react";
import { Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getAllNews } from "../../../api/user/news";
import "./HomeHero.css";

interface Article {
  id: string;
  slug: string;
  headline: string;
  excerpt?: string;
  featuredImage?: string;
  views?: number;
  createdAt?: string;
  category?: {
    name?: string;
  };
}

const HeroSection: React.FC = () => {
  // Reference for the scrolling tags container
  const tagsScrollRef = useRef<HTMLDivElement>(null);

  // Backend Articles State
  const [articles, setArticles] = useState<Article[]>([]);

  // Mock data for the trending tags
  const trendingTags = [
    "Budget 2026",
    "Election Results",
    "IPL Live",
    "Stock Market",
    "Tech Trends",
    "Local News",
    "Global Affairs",
    "Health & Wellness",
    "Startups",
    "Bollywood Updates",
    "Space Missions",
    "AI Revolution",
  ];

  // Fetch News From Backend
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getAllNews();

        if (data?.news) {
          setArticles(data.news);
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      }
    };

    fetchNews();
  }, []);

  // Featured Article
  const featuredArticle = articles[0];

  // Sidebar Articles
  const recentArticles = articles.slice(1, 5);

  // Function to smoothly scroll the tags horizontally
  const scrollTags = (direction: "left" | "right") => {
    if (tagsScrollRef.current) {
      const scrollAmount = 250;

      tagsScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="hero-section" id="hero-section">
      <div className="hero-container">

        {/* ================= TRENDING TAGS TOP BAR ================= */}
        <div className="trending-tags-container">
          <button
            className="tag-scroll-btn left"
            onClick={() => scrollTags("left")}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="tags-scroll-wrapper" ref={tagsScrollRef}>
            {trendingTags.map((tag, index) => {
              const slug = tag.toLowerCase().replace(/\s+/g, "-");

              return (
                <Link
                  to={`/tag/${slug}`}
                  key={index}
                  className="tag-pill text-decoration-none"
                >
                  {tag}
                </Link>
              );
            })}
          </div>

          <button
            className="tag-scroll-btn right"
            onClick={() => scrollTags("right")}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ================= TOP ROW ================= */}
        <div className="hero-top-row">

          {/* Left Side: Featured Article */}
          {featuredArticle && (
            <Link
              to={`/news/${featuredArticle.slug}`}
              className="featured-article text-decoration-none"
            >
              <img
                src={
                  featuredArticle.featuredImage ||
                  "https://via.placeholder.com/1200x700?text=No+Image"
                }
                alt={featuredArticle.headline}
                className="featured-bg-img"
              />

              <div className="featured-overlay">
                <span className="category-badge politics">
                  {featuredArticle.category?.name || "NEWS"}
                </span>

                <h1 className="featured-title">
                  {featuredArticle.headline}
                </h1>

                <p className="featured-excerpt">
                  {featuredArticle.excerpt ||
                    "No description available."}
                </p>

                <div className="featured-meta">
                  <span>
                    <Clock size={16} />

                    {featuredArticle.createdAt
                      ? new Date(
                          featuredArticle.createdAt
                        ).toLocaleDateString()
                      : "Recently"}
                  </span>

                  <span>
                    <Eye size={16} />

                    {featuredArticle.views || 0} views
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Right Side: Image Trending Sidebar */}
          <div className="trending-sidebar">
            <div className="section-header aa1">
              <h2>Recent News</h2>
              <div className="header-underline"></div>
            </div>

            <div className="trending-list">
              {recentArticles.map((article) => (
                <Link
                  to={`/news/${article.slug}`}
                  className="trending-card text-decoration-none"
                  key={article.id}
                >
                  <img
                    src={
                      article.featuredImage ||
                      "https://via.placeholder.com/200x150?text=No+Image"
                    }
                    alt={article.headline}
                    className="trending-img"
                  />

                  <div className="trending-info">

                    {/* Header Row: Category on left */}
                    <div className="trending-info-header">
                      <span className="trending-category">
                        {article.category?.name || "NEWS"}
                      </span>
                    </div>

                    <h3 className="trending-title">
                      {article.headline}
                    </h3>

                    <span className="trending-time">
                      {article.createdAt
                        ? new Date(
                            article.createdAt
                          ).toLocaleDateString()
                        : "Recently"}
                    </span>
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