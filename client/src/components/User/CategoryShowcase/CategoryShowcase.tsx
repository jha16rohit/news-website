import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { useNews } from "../../Admin/NewsStore/NewsStore";
import "./CategoryShowcase.css";

// 10 Professional fallback articles
const FALLBACK_ARTICLES = [
  { id: 901, title: "Waiting for new articles to be published in this category...", subtitle: "Our editorial team is currently gathering the latest information and deep-dive analysis on this topic.", img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80", time: "10 mins ago" },
  { id: 902, title: "Stay tuned for more updates and breaking news coverage.", subtitle: "We provide real-time updates and comprehensive breakdowns of the stories that matter most to you.", img: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&q=80", time: "1 hour ago" },
  { id: 903, title: "Our reporters are gathering the latest information right now.", subtitle: "On the ground and in the studio, our network ensures you get the most accurate and timely news.", img: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&q=80", time: "3 hours ago" },
  { id: 904, title: "Check back later for deep dives and analytical pieces.", subtitle: "Beyond the headlines, we explore the intricate details and long-term impacts of global events.", img: "https://images.unsplash.com/photo-1526470608115-b77826f047df?w=400&q=80", time: "5 hours ago" },
  { id: 905, title: "Explore our other sections while we update this feed.", subtitle: "From Politics to Technology, discover a wide range of award-winning journalism across our platform.", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80", time: "7 hours ago" },
  { id: 906, title: "Global markets react to recent economic shifts and policies.", subtitle: "Investors are closely monitoring the situation as new regulatory frameworks begin to take effect.", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80", time: "8 hours ago" },
  { id: 907, title: "New technological advancements announced today.", subtitle: "Industry leaders unveil next-generation solutions that promise to reshape the digital landscape.", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80", time: "12 hours ago" },
  { id: 908, title: "Exclusive interview with industry leaders on future trends.", subtitle: "A candid conversation about the challenges and opportunities facing the sector in the coming decade.", img: "https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=400&q=80", time: "14 hours ago" },
  { id: 909, title: "Analysis: What the latest policy changes mean for you.", subtitle: "Breaking down the complex legal jargon into understandable takeaways for everyday citizens.", img: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&q=80", time: "1 day ago" },
  { id: 910, title: "Breaking down the week's biggest headlines and stories.", subtitle: "A comprehensive review of the events that shaped the news cycle over the past seven days.", img: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&q=80", time: "1 day ago" },
];

const slugOf = (text: string) => text ? text.toLowerCase().replace(/\s+/g, "-") : "";

const LAYOUT_STYLES = ["hero-sidebar", "grid-3", "hero-reversed", "grid-4", "split-sidebar"];

const CategoryShowcase: React.FC = () => {


  const { categories, articles } = useNews() || {};
  const safeCategories = categories || [];
  const safeArticles = articles || [];

  const showcaseCategories = safeCategories.filter(c => c.inShowcase && c.enabled);

  if (showcaseCategories.length === 0) return null; 

  return (
    <div className="cs-wrapper">
      {showcaseCategories.map((cat, index) => {
        const realArticles = safeArticles
          .filter(a => a?.category?.toLowerCase() === cat.name?.toLowerCase())
          .map(a => ({ 
            id: a.id, 
            title: a.title, 
            subtitle: (a as any).subtitle || "Read the full story to discover more details about this breaking news event.",
            img: (a as any).imageUrl || (a as any).img || FALLBACK_ARTICLES[0].img,
            category: a.category,
            time: (a as any).publishedAt || (a as any).published || "Just now" 
          }));

        const rotatedFallbacks = [
          ...FALLBACK_ARTICLES.slice(index % FALLBACK_ARTICLES.length),
          ...FALLBACK_ARTICLES.slice(0, index % FALLBACK_ARTICLES.length)
        ].map(fb => ({ ...fb, category: cat.name }));

        const displayArticles = [...realArticles, ...rotatedFallbacks].slice(0, 10);
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
                    <Link to={`/article/${displayArticles[0].id}`} className="cs-dark-card">
                      
                      <div className="cs-img-wrap">
                        <img src={displayArticles[0].img} alt="" />
                      </div>
                      <div className="cs-card-body">
                        <span className="cs-card-badge">{displayArticles[0].category}</span>
                        <h3 className="cs-card-title">{displayArticles[0].title}</h3>
                        <p className="cs-card-sub">{displayArticles[0].subtitle}</p>
                        <div className="cs-card-time"><Clock size={14}/> {displayArticles[0].time}</div>
                      </div>
                    </Link>
                  </div>
                  <div className="cs-sidebar-col">
                    {displayArticles.slice(1, 5).map((article, i) => (
                      <Link to={`/article/${article.id}`} key={article.id || i} className="cs-list-item">
                        
                        <img src={article.img} alt="" className="cs-list-img" />
                        <div className="cs-list-content">
                          <span className="cs-list-cat">{article.category}</span>
                          <h4 className="cs-list-title">{article.title}</h4>
                          <div className="cs-card-time"><Clock size={14}/> {article.time}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {/* LAYOUT 3: 3-COLUMN GRID */}
              {layout === "grid-3" && (
                displayArticles.slice(0, 6).map((article, i) => (
                  <Link to={`/article/${article.id}`} key={article.id || i} className="cs-dark-card">
                    
                    <div className="cs-img-wrap">
                      <img src={article.img} alt="" />
                    </div>
                    <div className="cs-card-body">
                      <span className="cs-card-badge">{article.category}</span>
                      <h3 className="cs-card-title">{article.title}</h3>
                      <p className="cs-card-sub">{article.subtitle}</p>
                      <div className="cs-card-time"><Clock size={14}/> {article.time}</div>
                    </div>
                  </Link>
                ))
              )}

              {/* LAYOUT 5: HERO REVERSED */}
              {layout === "hero-reversed" && (
                <>
                  <div className="cs-sidebar-col cs-sidebar-reversed">
                    {displayArticles.slice(1, 5).map((article, i) => (
                      <Link to={`/article/${article.id}`} key={article.id || i} className="cs-list-item">
                        
                        <img src={article.img} alt="" className="cs-list-img" />
                        <div className="cs-list-content">
                          <span className="cs-list-cat">{article.category}</span>
                          <h4 className="cs-list-title">{article.title}</h4>
                          <div className="cs-card-time"><Clock size={14}/> {article.time}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="cs-hero-col cs-hero-reversed">
                    <Link to={`/article/${displayArticles[0].id}`} className="cs-dark-card">
                      
                      <div className="cs-img-wrap">
                        <img src={displayArticles[0].img} alt="" />
                      </div>
                      <div className="cs-card-body">
                        <span className="cs-card-badge">{displayArticles[0].category}</span>
                        <h3 className="cs-card-title">{displayArticles[0].title}</h3>
                        <p className="cs-card-sub">{displayArticles[0].subtitle}</p>
                        <div className="cs-card-time"><Clock size={14}/> {displayArticles[0].time}</div>
                      </div>
                    </Link>
                  </div>
                </>
              )}

              {/* LAYOUT 4: 4-COLUMN GRID */}
              {layout === "grid-4" && (
                displayArticles.slice(0, 8).map((article, i) => (
                  <Link to={`/article/${article.id}`} key={article.id || i} className="cs-dark-card">
                    
                    <div className="cs-img-wrap">
                      <img src={article.img} alt="" />
                    </div>
                    <div className="cs-card-body">
                      <span className="cs-card-badge">{article.category}</span>
                      <h3 className="cs-card-title cs-grid-title-small">{article.title}</h3>
                      <p className="cs-card-sub">{article.subtitle}</p>
                      <div className="cs-card-time"><Clock size={14}/> {article.time}</div>
                    </div>
                  </Link>
                ))
              )}

              {/* LAYOUT 2: SPLIT + SIDEBAR */}
              {layout === "split-sidebar" && (
                <>
                  <div className="cs-split-col">
                    <Link to={`/article/${displayArticles[0].id}`} className="cs-dark-card">
                     
                      <div className="cs-img-wrap">
                        <img src={displayArticles[0].img} alt="" />
                      </div>
                      <div className="cs-card-body">
                        <span className="cs-card-badge">{displayArticles[0].category}</span>
                        <h3 className="cs-card-title">{displayArticles[0].title}</h3>
                        <p className="cs-card-sub">{displayArticles[0].subtitle}</p>
                        <div className="cs-card-time"><Clock size={14}/> {displayArticles[0].time}</div>
                      </div>
                    </Link>
                  </div>
                  <div className="cs-sidebar-col">
                    {displayArticles.slice(2, 6).map((article, i) => (
                      <Link to={`/article/${article.id}`} key={article.id || i} className="cs-list-item">
                       
                        <img src={article.img} alt="" className="cs-list-img" />
                        <div className="cs-list-content">
                          <span className="cs-list-cat">{article.category}</span>
                          <h4 className="cs-list-title">{article.title}</h4>
                          <div className="cs-card-time"><Clock size={14}/> {article.time}</div>
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