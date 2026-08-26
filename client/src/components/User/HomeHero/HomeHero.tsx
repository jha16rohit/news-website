import React, { useRef, useEffect, useState } from "react";
import { Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getHomepageNews } from "../../../api/user/news";
import { getTrendingTags } from "../../../api/user/tag";
import "./HomeHero.css";

interface Article {
  id: string;
  slug: string;
  headline: string;
  excerpt?: string;
  featuredImage?: string;
  views?: number;
  createdAt?: string;

  categoryId?: {
    name?: string;
    color?: string;
  };
}
interface Tag {
  _id: string;
  name: string;
  slug: string;
}

const HeroSection: React.FC = () => {
  // Reference for the scrolling tags container
  const tagsScrollRef = useRef<HTMLDivElement>(null);

  // Backend Articles State
  const [articles, setArticles] = useState<Article[]>([]);
  const [trendingTags, setTrendingTags] = useState<Tag[]>([]);
  
  // 👇 EXPERT FIX: State to track if tags are overflowing the screen
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Function to check if tags take up more space than the screen allows
  const checkOverflow = () => {
    if (tagsScrollRef.current) {
      const { scrollWidth, clientWidth } = tagsScrollRef.current;
      // If scrollWidth is strictly greater than clientWidth, we need arrows
      setIsOverflowing(scrollWidth > clientWidth);
    }
  };

  useEffect(() => {
    const fetchTrendingTags = async () => {
      try {
        const tags = await getTrendingTags();
        setTrendingTags(tags);
      } catch (error) {
        console.error("Failed to fetch trending tags:", error);
      }
    };

    fetchTrendingTags();
  }, []);

  // 👇 EXPERT FIX: Re-check overflow whenever tags load or window resizes
  useEffect(() => {
    // Small timeout ensures the DOM has painted the tags before measuring
    const timeoutId = setTimeout(checkOverflow, 100);
    window.addEventListener("resize", checkOverflow);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [trendingTags]);

  // Fetch News From Backend
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getHomepageNews();

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
          
          {/* 👇 EXPERT FIX: Show Left Arrow ONLY if overflowing 👇 */}
          {isOverflowing && (
            <button
              className="tag-scroll-btn left"
              onClick={() => scrollTags("left")}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div className="tags-scroll-wrapper" ref={tagsScrollRef}>
            {trendingTags.map((tag) => (
              <Link
                key={tag._id}
                to={`/tag/${tag.slug}`}
                className="tag-pill text-decoration-none"
              >
                {tag.name}
              </Link>
            ))}
          </div>

          {/* 👇 EXPERT FIX: Show Right Arrow ONLY if overflowing 👇 */}
          {isOverflowing && (
            <button
              className="tag-scroll-btn right"
              onClick={() => scrollTags("right")}
            >
              <ChevronRight size={20} />
            </button>
          )}
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
                  {featuredArticle.categoryId?.name || "NEWS"}
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
                        {article.categoryId?.name || "NEWS"}
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