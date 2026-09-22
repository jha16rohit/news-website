// import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
// import { getPublicCategories } from "../../../api/user/categoryNews";
// import { fetchAllNews } from "../../../api/news";
import type { Category } from "../../../types/category";
import "./CategoryShowcase.css";
import { StatusBadge } from "../../UI/StatusBadge";

interface CategoryShowcaseProps {
  categories: Category[];
  articles: any[];
}

const slugOf = (text: string) =>
  text ? text.toLowerCase().replace(/\s+/g, "-") : "";

// Inline SVG placeholder — no network request, never fails, unlike
// via.placeholder.com which is unreliable / can go down.
// const PLACEHOLDER_IMG =
//   "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

const LAYOUT_STYLES = [
  "hero-sidebar",
  "grid-3",
  "split-sidebar",
  "grid-4",
];

const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({
  categories,
  articles,
}) => {
  // const [categories, setCategories] = useState<Category[]>([]);
  // const [articles, setArticles] = useState<any[]>([]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       // Categories
  //       const categoryData = await getPublicCategories();
  //       setCategories(categoryData || []);
  //
  //       // News
  //       const newsData = await fetchAllNews();
  //       setArticles(newsData?.news || []);
  //     } catch (error) {
  //       console.error("Category showcase fetch error:", error);
  //     }
  //   };
  //
  //   fetchData();
  // }, []);

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
            slug: a.slug,
            title: a.headline || a.title || "Untitled News",
            subtitle: a.excerpt || a.shortTitle || "Read full story",

            img: a.featuredImage || a.imageUrl || a.img || "https://placehold.co/400x225/e2e8f0/64748b?text=No+Image",

            category:
              a?.categoryId?.name || a?.categoryName || a?.category || "News",
            categoryId: a.categoryId,

            articleType: a.articleType,
            statusType: a.statusType,

            time:
              a.createdAt || a.publishedAt
                ? new Date(a.createdAt || a.publishedAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )
                : "Just now",
          }));

        const displayArticles = realArticles.slice(0, 10);

        if (displayArticles.length === 0) {
          return null;
        }

        const layout = LAYOUT_STYLES[index % LAYOUT_STYLES.length];

        const getArticleUrl = (article: any): string | null => {
          const slug = article?.slug;
          if (slug) return `/news/${slug}`;
          const id = article?.id || article?._id;
          if (id) return `/article/${id}`;
          return null;
        };

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
              {layout === "hero-sidebar" && displayArticles.length > 0 && (
                <>
                  <div className="cs-hero-col">
                    {(() => {
                      const heroArticle = displayArticles[0];
                      const heroUrl = getArticleUrl(heroArticle);
                      if (!heroUrl) return null;
                      return (
                        <Link to={heroUrl} className="cs-dark-card">
                          <div className="cs-img-wrap">
                            <img src={heroArticle.img} />
                          </div>
                          <div className="cs-card-body">
                            <div className="cs-card-badges">
                              <StatusBadge
                                articleType={heroArticle.articleType}
                                statusType={heroArticle.statusType}
                                variant="default"
                              />
                              <span className="cs-card-badge">
                                {heroArticle.category}
                              </span>
                            </div>
                            <h3 className="cs-card-title">
                              {heroArticle.title}
                            </h3>
                            <p className="cs-card-sub">
                              {heroArticle.subtitle}
                            </p>
                            <div className="cs-card-time">
                              <Clock size={14} /> {heroArticle.time}
                            </div>
                          </div>
                        </Link>
                      );
                    })()}
                  </div>
                  <div className="cs-sidebar-col">
                    {displayArticles.slice(1, 5).map((article, i) => {
                      const sidebarUrl = getArticleUrl(article);
                      if (!sidebarUrl) return null;
                      return (
                        <Link
                          to={sidebarUrl}
                          key={String(article.id ?? article.id ?? article.slug ?? i)}
                          className="cs-list-item"
                        >
                          <img src={article.img} className="cs-list-img" />
                          <div className="cs-list-content">
                            <div className="cs-list-badges">
                              <StatusBadge
                                articleType={article.articleType}
                                statusType={article.statusType}
                                variant="compact"
                              />
                              <span className="cs-list-cat">
                                {article.categoryId?.name ?? article.category}
                              </span>
                            </div>
                            <h4 className="cs-list-title">{article.title}</h4>
                            <div className="cs-card-time">
                              <Clock size={14} /> {article.time}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}

              {/* LAYOUT 2: SPLIT + SIDEBAR */}
              {layout === "split-sidebar" && displayArticles.length > 0 && (
                <>
                  <div className="cs-split-col">
                    {(function() {
                      const heroArticle = displayArticles[0];
                      const heroUrl = getArticleUrl(heroArticle);
                      if (!heroUrl) return null;
                      return (
                        <Link to={heroUrl} className="cs-dark-card">
                          <div className="cs-img-wrap">
                            <img src={heroArticle.img} alt="" />
                          </div>
                          <div className="cs-card-body">
                            <div className="cs-card-badges">
                              <StatusBadge
                                articleType={heroArticle.articleType}
                                statusType={heroArticle.statusType}
                                variant="default"
                              />
                              <span className="cs-card-badge">
                                {heroArticle.categoryId?.name ?? heroArticle.category}
                              </span>
                            </div>
                            <h3 className="cs-card-title">{heroArticle.title}</h3>
                            <p className="cs-card-sub">{heroArticle.subtitle}</p>
                            <div className="cs-card-time">
                              <Clock size={14} /> {heroArticle.time}
                            </div>
                          </div>
                        </Link>
                      );
                    })()}
                  </div>
                  <div className="cs-sidebar-col">
                    {displayArticles.slice(2, 6).map((article, i) => {
                      const sidebarUrl = getArticleUrl(article);
                      if (!sidebarUrl) return null;
                      return (
                        <Link
                          to={sidebarUrl}
                          key={String(article.id ?? article.id ?? article.slug ?? i)}
                          className="cs-list-item"
                        >
                          <img src={article.img} alt="" className="cs-list-img" />
                          <div className="cs-list-content">
                            <div className="cs-list-badges">
                              <StatusBadge
                                articleType={article.articleType}
                                statusType={article.statusType}
                                variant="compact"
                              />
                              <span className="cs-list-cat">
                                {article.categoryId?.name ?? article.category}
                              </span>
                            </div>
                            <h4 className="cs-list-title">{article.title}</h4>
                            <div className="cs-card-time">
                              <Clock size={14} /> {article.time}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}

              {/* LAYOUT 3: 3-COLUMN GRID */}
              {layout === "grid-3" &&
                displayArticles.slice(0, 6).map((article, i) => {
                  const grid3Url = getArticleUrl(article);
                  if (!grid3Url) return null;
                  return (
                    <Link
                      to={grid3Url}
                      key={String(article.id ?? article.id ?? article.slug ?? i)}
                      className="cs-dark-card"
                    >
                      <div className="cs-img-wrap">
                        <img src={article.img} alt="" />
                      </div>
                      <div className="cs-card-body">
                        <div className="cs-card-badges">
                          <StatusBadge
                            articleType={article.articleType}
                            statusType={article.statusType}
                            variant="compact"
                          />
                          <span className="cs-card-badge">{article.categoryId?.name ?? article.category}</span>
                        </div>
                        <h3 className="cs-card-title">{article.title}</h3>
                        <p className="cs-card-sub">{article.subtitle}</p>
                        <div className="cs-card-time">
                          <Clock size={14} /> {article.time}
                        </div>
                      </div>
                    </Link>
                  );
                })}

              {/* LAYOUT 4: 4-COLUMN GRID */}
              {layout === "grid-4" &&
                displayArticles.slice(0, 8).map((article, i) => {
                  const grid4Url = getArticleUrl(article);
                  if (!grid4Url) return null;
                  return (
                    <Link
                      to={grid4Url}
                      key={String(article.id ?? article.id ?? article.slug ?? i)}
                      className="cs-dark-card"
                    >
                      <div className="cs-img-wrap">
                        {article.img && <img src={article.img} alt="" />}
                      </div>
                      <div className="cs-card-body">
                        <div className="cs-card-badges">
                          <StatusBadge
                            articleType={article.articleType}
                            statusType={article.statusType}
                            variant="compact"
                          />
                          <span className="cs-card-badge">{article.categoryId?.name ?? article.category}</span>
                        </div>
                        <h3 className="cs-card-title cs-grid-title-small">{article.title}</h3>
                        <p className="cs-card-sub">{article.subtitle}</p>
                        <div className="cs-card-time">
                          <Clock size={14} /> {article.time}
                        </div>
                      </div>
                    </Link>
                  );
                })}

              {/* LAYOUT 5: HERO REVERSED */}
              {layout === "hero-reversed" && displayArticles.length > 0 && (
                <>
                  <div className="cs-sidebar-col cs-sidebar-reversed">
                    {displayArticles.slice(1, 5).map((article, i) => {
                      const sidebarUrl = getArticleUrl(article);
                      if (!sidebarUrl) return null;
                      return (
                        <Link
                          to={sidebarUrl}
                          key={String(article.id ?? article.id ?? article.slug ?? i)}
                          className="cs-list-item"
                        >
                          <img src={article.img} alt="" className="cs-list-img" />
                          <div className="cs-list-content">
                            <div className="cs-list-badges">
                              <StatusBadge
                                articleType={article.articleType}
                                statusType={article.statusType}
                                variant="compact"
                              />
                              <span className="cs-list-cat">
                                {article.categoryId?.name ?? article.category}
                              </span>
                            </div>
                            <h4 className="cs-list-title">{article.title}</h4>
                            <div className="cs-card-time">
                              <Clock size={14} /> {article.time}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="cs-hero-col cs-hero-reversed">
                    {(function() {
                      const heroArticle = displayArticles[0];
                      const heroUrl = getArticleUrl(heroArticle);
                      if (!heroUrl) return null;
                      return (
                        <Link to={heroUrl} className="cs-dark-card">
                          <div className="cs-img-wrap">
                            <img src={heroArticle.img} alt="" />
                          </div>
                          <div className="cs-card-body">
                            <div className="cs-card-badges">
                              <StatusBadge
                                articleType={heroArticle.articleType}
                                statusType={heroArticle.statusType}
                                variant="default"
                              />
                              <span className="cs-card-badge">
                                {heroArticle.categoryId?.name ?? heroArticle.category}
                              </span>
                            </div>
                            <h3 className="cs-card-title">{heroArticle.title}</h3>
                            <p className="cs-card-sub">{heroArticle.subtitle}</p>
                            <div className="cs-card-time">
                              <Clock size={14} /> {heroArticle.time}
                            </div>
                          </div>
                        </Link>
                      );
                    })()}
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