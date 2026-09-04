import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { getPublicCategories } from "../../../api/user/categoryNews";
import { fetchAllNews } from "../../../api/news";
import type { Category } from "../../../types/category";
import "./CategoryShowcase.css";

const slugOf = (text: string) =>
  text ? text.toLowerCase().replace(/\s+/g, "-") : "";

// Inline SVG placeholder — no network request, never fails, unlike
// via.placeholder.com which is unreliable / can go down.
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const LAYOUT_STYLES = [
  "hero-sidebar",
  "grid-3",
  "hero-reversed",
  "grid-4",
  "split-sidebar",
];

const CategoryShowcase: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Categories
        const categoryData = await getPublicCategories();
        setCategories(categoryData || []);

        // News
        const newsData = await fetchAllNews();
        setArticles(newsData?.news || []);
      } catch (error) {
        console.error("Category showcase fetch error:", error);
      }
    };

    fetchData();
  }, []);

  const showcaseCategories = categories.filter(
    (c) => c.inShowcase && c.enabled,
  );

  if (showcaseCategories.length === 0) return null;

  return (
    <div className="cs-wrapper">
      {showcaseCategories.map((cat, index) => {
        const allowedCategories = [
          cat.name?.toLowerCase(),
          ...(cat.children || []).map((child: any) =>
            child.name?.toLowerCase(),
          ),
        ];

        const realArticles = articles
          .filter((a: any) =>
            allowedCategories.includes(
              (
                a?.categoryId?.name ||
                a?.categoryName ||
                a?.category ||
                ""
              ).toLowerCase(),
            ),
          )
          .map((a: any) => ({
            id: a._id || a.id,

            title: a.headline || a.title || "Untitled News",

            subtitle: a.excerpt || a.shortTitle || "Read full story",

            // Always resolve to a usable src — never an empty string.
            img: a.featuredImage || a.imageUrl || a.img || PLACEHOLDER_IMG,

            category:
              a?.categoryId?.name || a?.categoryName || a?.category || "News",

            time: a.createdAt || a.publishedAt || "Just now",
          }));
        const displayArticles = realArticles.slice(0, 10);

        if (displayArticles.length === 0) {
          return null;
        }

        const layout = LAYOUT_STYLES[index % LAYOUT_STYLES.length];

        return (
          <section key={cat.id || index} className="cs-section">
            <div className="cs-header">
              <div className="cs-header-left">
                <h2 className="cs-title">{cat.name}</h2>
                <div className="cs-underline"></div>
              </div>
              <Link to={`/category/${slugOf(cat.name)}`} className="cs-more">
                View All <ArrowRight size={16} />
              </Link>
            </div>

            <div className={`cs-layout cs-layout-${layout}`}>
              {/* LAYOUT 1: HERO + SIDEBAR */}
              {layout === "hero-sidebar" && (
                <>
                  <div className="cs-hero-col">
                    <Link
                      to={`/article/${displayArticles[0].id}`}
                      className="cs-dark-card"
                    >
                      <div className="cs-img-wrap">
                        <img src={displayArticles[0].img} alt="" />
                      </div>
                      <div className="cs-card-body">
                        <span className="cs-card-badge">
                          {displayArticles[0].category}
                        </span>
                        <h3 className="cs-card-title">
                          {displayArticles[0].title}
                        </h3>
                        <p className="cs-card-sub">
                          {displayArticles[0].subtitle}
                        </p>
                        <div className="cs-card-time">
                          <Clock size={14} /> {displayArticles[0].time}
                        </div>
                      </div>
                    </Link>
                  </div>
                  <div className="cs-sidebar-col">
                    {displayArticles.slice(1, 5).map((article, i) => (
                      <Link
                        to={`/article/${article.id}`}
                        key={article.id || i}
                        className="cs-list-item"
                      >
                        <img src={article.img} alt="" className="cs-list-img" />
                        <div className="cs-list-content">
                          <span className="cs-list-cat">
                            {article.category}
                          </span>
                          <h4 className="cs-list-title">{article.title}</h4>
                          <div className="cs-card-time">
                            <Clock size={14} /> {article.time}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {/* LAYOUT 3: 3-COLUMN GRID */}
              {layout === "grid-3" &&
                displayArticles.slice(0, 6).map((article, i) => (
                  <Link
                    to={`/article/${article.id}`}
                    key={article.id || i}
                    className="cs-dark-card"
                  >
                    <div className="cs-img-wrap">
                      <img src={article.img} alt="" />
                    </div>
                    <div className="cs-card-body">
                      <span className="cs-card-badge">{article.category}</span>
                      <h3 className="cs-card-title">{article.title}</h3>
                      <p className="cs-card-sub">{article.subtitle}</p>
                      <div className="cs-card-time">
                        <Clock size={14} /> {article.time}
                      </div>
                    </div>
                  </Link>
                ))}

              {/* LAYOUT 5: HERO REVERSED */}
              {layout === "hero-reversed" && (
                <>
                  <div className="cs-sidebar-col cs-sidebar-reversed">
                    {displayArticles.slice(1, 5).map((article, i) => (
                      <Link
                        to={`/article/${article.id}`}
                        key={article.id || i}
                        className="cs-list-item"
                      >
                        <img src={article.img} alt="" className="cs-list-img" />
                        <div className="cs-list-content">
                          <span className="cs-list-cat">
                            {article.category}
                          </span>
                          <h4 className="cs-list-title">{article.title}</h4>
                          <div className="cs-card-time">
                            <Clock size={14} /> {article.time}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="cs-hero-col cs-hero-reversed">
                    <Link
                      to={`/article/${displayArticles[0].id}`}
                      className="cs-dark-card"
                    >
                      <div className="cs-img-wrap">
                        <img src={displayArticles[0].img} alt="" />
                      </div>
                      <div className="cs-card-body">
                        <span className="cs-card-badge">
                          {displayArticles[0].category}
                        </span>
                        <h3 className="cs-card-title">
                          {displayArticles[0].title}
                        </h3>
                        <p className="cs-card-sub">
                          {displayArticles[0].subtitle}
                        </p>
                        <div className="cs-card-time">
                          <Clock size={14} /> {displayArticles[0].time}
                        </div>
                      </div>
                    </Link>
                  </div>
                </>
              )}

              {/* LAYOUT 4: 4-COLUMN GRID */}
              {layout === "grid-4" &&
                displayArticles.slice(0, 8).map((article, i) => (
                  <Link
                    to={`/article/${article.id}`}
                    key={article.id || i}
                    className="cs-dark-card"
                  >
                    <div className="cs-img-wrap">
                      <img src={article.img} alt="" />
                    </div>
                    <div className="cs-card-body">
                      <span className="cs-card-badge">{article.category}</span>
                      <h3 className="cs-card-title cs-grid-title-small">
                        {article.title}
                      </h3>
                      <p className="cs-card-sub">{article.subtitle}</p>
                      <div className="cs-card-time">
                        <Clock size={14} /> {article.time}
                      </div>
                    </div>
                  </Link>
                ))}

              {/* LAYOUT 2: SPLIT + SIDEBAR */}
              {layout === "split-sidebar" && (
                <>
                  <div className="cs-split-col">
                    <Link
                      to={`/article/${displayArticles[0].id}`}
                      className="cs-dark-card"
                    >
                      <div className="cs-img-wrap">
                        <img src={displayArticles[0].img} alt="" />
                      </div>
                      <div className="cs-card-body">
                        <span className="cs-card-badge">
                          {displayArticles[0].category}
                        </span>
                        <h3 className="cs-card-title">
                          {displayArticles[0].title}
                        </h3>
                        <p className="cs-card-sub">
                          {displayArticles[0].subtitle}
                        </p>
                        <div className="cs-card-time">
                          <Clock size={14} /> {displayArticles[0].time}
                        </div>
                      </div>
                    </Link>
                  </div>
                  <div className="cs-sidebar-col">
                    {displayArticles.slice(2, 6).map((article, i) => (
                      <Link
                        to={`/article/${article.id}`}
                        key={article.id || i}
                        className="cs-list-item"
                      >
                        <img src={article.img} alt="" className="cs-list-img" />
                        <div className="cs-list-content">
                          <span className="cs-list-cat">
                            {article.category}
                          </span>
                          <h4 className="cs-list-title">{article.title}</h4>
                          <div className="cs-card-time">
                            <Clock size={14} /> {article.time}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default CategoryShowcase;