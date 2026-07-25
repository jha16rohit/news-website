import React, {  useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock,   ChevronRight} from "lucide-react";
import "./TagPage.css";
import { getTagNews } from "../../../api/user/tagNews";
import { getRecentNews } from "../../../api/user/recentNews";
import { getTrendingTags } from "../../../api/user/tag";
import Preloader from "../../Admin/Preloader/Preloder";
import {
  getAdvertisementPool,
  type Advertisement as AdType,
} from "../../../api/user/advertisementPool";
import Advertisement from "../Advertisment/Advertisment";


const TagPage: React.FC = () => {
  const { tagSlug } = useParams<{ tagSlug: string }>();
  const [visibleCount, setVisibleCount] = useState(4);
  const [articles, setArticles] = useState<any[]>([]);
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<{
    cards: AdType[];
    strips: AdType[];
}>({
    cards: [],
    strips: [],
});

  const currentTagSlug = tagSlug || "budget-2026";
  const displayTag = currentTagSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  useEffect(() => {
  const fetchTagNews = async () => {
    try {
      setLoading(true);

      const response =
        await getTagNews(currentTagSlug);

      setArticles(
        response.news || []
      );

      const recent =
  await getRecentNews();

if (recent.success) {
  setRecentNews(
    recent.news || []
  );

  const tags =
  await getTrendingTags();

setTrendingTags(
  tags || []
);
}
const adResponse =
    await getAdvertisementPool({
        cards: 1,
        strips: 0,
    });

setAds(adResponse);


    } catch (error) {

      console.error(
        "Failed to fetch tag news:",
        error
      );

      setArticles([]);

    } finally {

      setLoading(false);
    }
  };

  setVisibleCount(4);

  fetchTagNews();

}, [currentTagSlug]);



  const visibleArticles = articles.slice(0,visibleCount);




  if (loading) {
  return (
    <div className="tp-loader-wrapper">
      <Preloader />
    </div>
  );
}


  return (
    <div className="tp-wrapper">
      <div className="tp-container">

        {/* ── HERO ── */}
        

        {/* ── TAG NAV ── */}


        {articles.length > 0 ? (
          <div className="tp-layout">

            {/* ── LEFT: MAIN FEED ── */}
            <div className="tp-feed-col">
              <div className="tp-section-head">
                <h2 className="tp-section-title">Latest Stories</h2>
              </div>

              

              {/* List cards */}
              <div className="tp-list-feed">
                {visibleArticles.map((article) => (
                  <Link
                    to={`/news/${article.slug}`}
                    key={article.id}
                    className="tp-list-card text-decoration-none"
                  >
                    <div className="tp-list-img-wrap">
<img
  src={article.featuredImage}
  alt={article.headline}
/>                    </div>
                    <div className="tp-list-body">
                      <span className="tp-list-cat">{displayTag}</span>
                      <h4 className="tp-list-title">{article.headline}</h4>
                      <p className="tp-trend-excerpt">{article.excerpt}</p>
                      <div className="tp-list-time">
                        <Clock size={12} /> {new Date(
  article.createdAt
).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {visibleCount < articles.length ? (
    <button
      className="tp-view-more-btn"
      onClick={() =>
        setVisibleCount(
          prev => prev + 4
        )
      }
    >
      Load More Stories
    </button>
  ) : (
    articles.length > 4 && (
      <button
        className="tp-view-more-btn"
        onClick={() =>
          setVisibleCount(4)
        }
      >
        Show Less
      </button>
    )
  )}

            </div>

            {/* ── RIGHT: SIDEBAR ── */}
            <aside className="tp-sidebar">

              
              <div className="tp-sidebar-widget">
                <div className="tp-section-head">
                  <h2 className="tp-section-title">Recent News</h2>
                </div>
                <div className="tp-trending-list">
                  {recentNews.slice(0, 5).map((article) => (
                    <Link
                      to={`/news/${article.slug}`}
  key={article._id}
                      className="tp-trending-item text-decoration-none"
                    >
                      <span className="tp-trend-arrow">
                        <ChevronRight size={18} />
                      </span>
                      <div className="tp-trend-body">
                        <span className="tp-trend-cat">{article.category}</span>
                        <p className="tp-trend-title">{article.shortTitle || article.headline}</p>
                        <span className="tp-trend-time">
                          <Clock size={11} /> {article.publishedAt
  ? new Date(
      article.publishedAt
    ).toLocaleDateString()
  : "Recently"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

<Advertisement
    adData={ads.cards[0] ?? null}
    variant="card"
/>
            

              {/* Tag cloud */}
              <div className="tp-sidebar-widget">
                <div className="tp-section-head">
                  <h2 className="tp-section-title">Explore Topics</h2>
                </div>
                <div className="tp-tag-cloud">
                  {trendingTags.map((tag) => (
  <Link
    key={tag._id}
    to={`/tag/${tag.slug}`}
    className="tp-cloud-tag"
  >
    {tag.name}
  </Link>
))}
                </div>
              </div>

            </aside>
          </div>
        ) : (
          <div className="tp-empty-state">
            
          </div>
        )}
      </div>
    </div>
  );
};

export default TagPage;