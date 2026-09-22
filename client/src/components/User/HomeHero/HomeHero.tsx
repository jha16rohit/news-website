import React, { useState, useEffect, useRef } from "react";
import { Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./HomeHero.css";
import { StatusBadge } from "../../UI/StatusBadge";
import { getTrendingTags } from "../../../api/user/tag";


// Inline SVG placeholders — no network request, never fails, unlike
// via.placeholder.com which is unreliable / can go down (ERR_CONNECTION_CLOSED).
const PLACEHOLDER_IMG_LARGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='32' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
const PLACEHOLDER_IMG_SMALL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

interface HeroSectionProps {
  articles: Article[];
}

interface Article {
  id?: string;
  _id?: string;
  slug?: string;
  headline: string;
  excerpt?: string;
  featuredImage?: string;
  views?: number;
  createdAt?: string;

  categoryId?: {
    name?: string;
    color?: string;
  };

  articleType?: "STANDARD" | "BREAKING" | "LIVE";
  statusType?: string;
  breakingNewsTicker?: boolean;
}


interface Tag {
  _id: string;
  name: string;
  slug: string;
}


const HeroSection: React.FC<HeroSectionProps> = ({
  articles,
}) => {
  const tagsScrollRef = useRef<HTMLDivElement>(null);
  const [trendingTags, setTrendingTags] = useState<Tag[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  

  // 👇 EXPERT FIX: Fetch trending tags
  useEffect(() => {
    const fetchTrendingTagsData = async () => {
      try {
        const tags = await getTrendingTags();
        setTrendingTags(tags || []);
      } catch (error) {
        console.error("Failed to fetch trending tags:", error);
      }
    };
    fetchTrendingTagsData();
  }, []);

  // 👇 EXPERT FIX: Update arrow visibility based on actual overflow
  const updateTagScrollState = () => {
    const el = tagsScrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const hasOverflow = el.scrollWidth > el.clientWidth + 1;

    if (!hasOverflow) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    );
  };

  // 👇 EXPERT FIX: Update on mount, resize, and tag changes
  useEffect(() => {
    const update = () => updateTagScrollState();
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [trendingTags]);

  // 👇 EXPERT FIX: Scroll functions for the tags carousel
  const scrollTags = (direction: "left" | "right") => {
    if (tagsScrollRef.current) {
      const scrollAmount = 250; // pixels per click
      tagsScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 👇 EXPERT FIX: Handle keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") scrollTags("left");
      if (e.key === "ArrowRight") scrollTags("right");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Featured article (first in the list)
  const featuredArticle = articles[0];
  const recentArticles = articles.slice(1, 5); // Next 4 for the sidebar

  const getArticleUrl = (article: Article): string | null => {
    const slug = article?.slug;
    if (slug) return `/news/${slug}`;
    const id = article?.id || article?._id;
    if (id) return `/article/${id}`;
    return null;
  };

  const featuredUrl = featuredArticle
    ? getArticleUrl(featuredArticle)
    : null;

  return (
    <section className="hero-section" id="hero-section">
      <div className="hero-bg"></div>

      <div className="hero-container">

        <div className="trending-tags-container">
          {canScrollLeft && (
            <button
              className="tag-scroll-btn left"
              onClick={() => scrollTags("left")}
              aria-label="Scroll tags left"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div
            className="tags-scroll-wrapper"
            ref={tagsScrollRef}
            onScroll={updateTagScrollState}
          >
            {trendingTags.map((tag) => (
              <Link
                key={tag._id}
                to={`/tag/${tag.slug}`}
                className="tag-pill"
              >
                {tag.name}
              </Link>
            ))}
          </div>

          {canScrollRight && (
            <button
              className="tag-scroll-btn right"
              onClick={() => scrollTags("right")}
              aria-label="Scroll tags right"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        <div className="hero-top-row">
          {featuredUrl && featuredArticle && (
            <Link
              to={featuredUrl}
              className="featured-article text-decoration-none"
            >
              <img
                src={
                  featuredArticle.featuredImage || PLACEHOLDER_IMG_LARGE
                }
                alt={featuredArticle.headline}
                className="featured-bg-img"
              />

              <div className="featured-overlay">
                <div className="featured-badges">
                  <StatusBadge
                    articleType={featuredArticle.articleType}
                    statusType={featuredArticle.statusType}
                    variant="default"
                  />
                  <span className="category-badge politics">
                    {featuredArticle.categoryId?.name || "NEWS"}
                  </span>
                </div>
                <h1 className="featured-title">
                  {featuredArticle.headline}
                </h1>

                <p className="featured-excerpt">
                  {featuredArticle.excerpt || "No description available."}
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
              {recentArticles.map((article) => {
                const articleUrl = getArticleUrl(article);
                if (!articleUrl) {
                  return null;
                }

                return (
                  <Link
                    to={articleUrl}
                    className="trending-card text-decoration-none"
                    key={String(article.id ?? article._id ?? article.slug)}
                  >
                    <img
                      src={
                        article.featuredImage || PLACEHOLDER_IMG_SMALL
                      }
                      alt={article.headline}
                      className="trending-img"
                    />

                    <div className="trending-info">
                      <div className="trending-info-header">
                        <StatusBadge
                          articleType={article.articleType}
                          statusType={article.statusType}
                          variant="compact"
                        />
                        <span className="trending-category">
                          {article.categoryId?.name}
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
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


export default HeroSection;