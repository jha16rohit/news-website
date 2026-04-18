import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useNews } from "../../Admin/NewsStore/NewsStore";
import "./CategoryShowcase.css";

// Professional fallback articles for empty categories
const FALLBACK_ARTICLES = [
  { id: 901, title: "Waiting for new articles to be published in this category...", img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80" },
  { id: 902, title: "Stay tuned for more updates and breaking news coverage.", img: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&q=80" },
  { id: 903, title: "Our reporters are gathering the latest information right now.", img: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&q=80" },
  { id: 904, title: "Check back later for deep dives and analytical pieces.", img: "https://images.unsplash.com/photo-1526470608115-b77826f047df?w=400&q=80" },
  { id: 905, title: "Explore our other sections while we update this feed.", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80" },
];

const slugOf = (text: string) => text ? text.toLowerCase().replace(/\s+/g, "-") : "";

// Cycles through layouts to keep the page looking dynamic
const LAYOUT_STYLES = ["hero-sidebar", "grid-3", "hero-reversed", "grid-4", "split-sidebar"];

const CategoryShowcase: React.FC = () => {
  // SAFETY FIX: If useNews returns undefined, default to empty arrays to prevent white screen crash
  const { categories, articles } = useNews() || {};
  const safeCategories = categories || [];
  const safeArticles = articles || [];

  // Only grab categories that have the Showcase toggle turned ON
  const showcaseCategories = safeCategories.filter(c => c.inShowcase && c.enabled);

  if (showcaseCategories.length === 0) return null; // Hides section completely if none are selected

  return (
    <div className="cs-wrapper">
      {showcaseCategories.map((cat, index) => {
        // Find real articles for this category (with safety checks)
        const realArticles = safeArticles
          .filter(a => a?.category?.toLowerCase() === cat.name?.toLowerCase())
          .map(a => ({ 
            id: a.id, 
            title: a.title, 
            img: (a as any).imageUrl || (a as any).img || FALLBACK_ARTICLES[0].img 
          }));

        // Rotate the fallback images so no two categories look the same!
        const rotatedFallbacks = [
          ...FALLBACK_ARTICLES.slice(index % FALLBACK_ARTICLES.length),
          ...FALLBACK_ARTICLES.slice(0, index % FALLBACK_ARTICLES.length)
        ];

        // Fill empty spots with the newly rotated fallbacks
        const displayArticles = [...realArticles, ...rotatedFallbacks].slice(0, 5);

        // Pick a layout style based on its order in the list
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
                    <Link to={`/article/${displayArticles[0].id}`} className="cs-hero-card">
                      <img src={displayArticles[0].img} alt="" className="cs-hero-img" />
                      <h3 className="cs-hero-title">{displayArticles[0].title}</h3>
                    </Link>
                  </div>
                  <div className="cs-sidebar-col">
                    {displayArticles.slice(1, 5).map((article, i) => (
                      <Link to={`/article/${article.id}`} key={article.id || i} className="cs-list-item">
                        <img src={article.img} alt="" className="cs-list-img" />
                        <h4 className="cs-list-title">{article.title}</h4>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {/* LAYOUT 3: 3-COLUMN GRID */}
              {layout === "grid-3" && (
                displayArticles.slice(0, 3).map((article, i) => (
                  <Link to={`/article/${article.id}`} key={article.id || i} className="cs-grid-card">
                    <img src={article.img} alt="" className="cs-grid-img" />
                    <h3 className="cs-grid-title">{article.title}</h3>
                  </Link>
                ))
              )}

            {/* LAYOUT 5: HERO REVERSED (List Left, Big Image Right) */}
              {layout === "hero-reversed" && (
                <>
                  <div className="cs-sidebar-col cs-sidebar-reversed">
                    {displayArticles.slice(1, 5).map((article, i) => (
                      <Link to={`/article/${article.id}`} key={article.id || i} className="cs-list-item">
                        <img src={article.img} alt="" className="cs-list-img" />
                        <h4 className="cs-list-title">{article.title}</h4>
                      </Link>
                    ))}
                  </div>
                  <div className="cs-hero-col cs-hero-reversed">
                    <Link to={`/article/${displayArticles[0].id}`} className="cs-hero-card">
                      <img src={displayArticles[0].img} alt="" className="cs-hero-img" />
                      <h3 className="cs-hero-title">{displayArticles[0].title}</h3>
                    </Link>
                  </div>
                </>
              )}

              {/* LAYOUT 4: 4-COLUMN GRID */}
              {layout === "grid-4" && (
                displayArticles.slice(0, 4).map((article, i) => (
                  <Link to={`/article/${article.id}`} key={article.id || i} className="cs-grid-card">
                    <img src={article.img} alt="" className="cs-grid-img" />
                    <h3 className="cs-grid-title-small">{article.title}</h3>
                  </Link>
                ))
              )}

              {/* LAYOUT 2: SPLIT + SIDEBAR */}
              {layout === "split-sidebar" && (
                <>
                  <div className="cs-split-col">
                    <Link to={`/article/${displayArticles[0].id}`} className="cs-split-main-card">
                      <img src={displayArticles[0].img} alt="" className="cs-split-main-img" />
                      <h3 className="cs-split-main-title">{displayArticles[0].title}</h3>
                    </Link>
                    <Link to={`/article/${displayArticles[1].id}`} className="cs-split-sub-card">
                      <img src={displayArticles[1].img} alt="" className="cs-list-img" />
                      <h4 className="cs-list-title">{displayArticles[1].title}</h4>
                    </Link>
                  </div>
                  <div className="cs-sidebar-col">
                    {displayArticles.slice(2, 5).map((article, i) => (
                      <Link to={`/article/${article.id}`} key={article.id || i} className="cs-list-item">
                        <img src={article.img} alt="" className="cs-list-img" />
                        <h4 className="cs-list-title">{article.title}</h4>
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