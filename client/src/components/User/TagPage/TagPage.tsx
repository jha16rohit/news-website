import React, { useRef, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, ChevronLeft, ChevronRight, Hash, ChevronDown } from "lucide-react";
import "./TagPage.css";

// --- DUMMY DATA ---
const MOCK_TAGS = [
  { id: "1", name: "Budget 2026", slug: "budget-2026" },
  { id: "2", name: "Election Results", slug: "election-results" },
  { id: "3", name: "IPL Live", slug: "ipl-live" },
  { id: "4", name: "Stock Market", slug: "stock-market" },
  { id: "5", name: "Tech Trends", slug: "tech-trends" },
  { id: "6", name: "Local News", slug: "local-news" },
  { id: "7", name: "Global Affairs", slug: "global-affairs" },
  { id: "8", name: "Health & Wellness", slug: "health-wellness" },
  { id: "9", name: "Startups", slug: "startups" },
  { id: "10", name: "Bollywood Updates", slug: "bollywood-updates" },
  { id: "11", name: "Space Missions", slug: "space-missions" },
  { id: "12", name: "AI Revolution", slug: "ai-revolution" }
];

// Diverse dummy images
const imgs = [
  "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=800&q=80",
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80",
  "https://images.unsplash.com/photo-1532375810709-75b1d005e578?w=800&q=80",
  "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80"
];

// Helper to generate dynamic mock articles based on the tag name
const generateMockArticles = (tagName: string) => {
  const isBudget = tagName.toLowerCase().includes("budget");
  const isGlobal = tagName.toLowerCase().includes("global");

  return Array.from({ length: 8 }).map((_, i) => {
    
    // 👇 FIX: The category badge will now ALWAYS display the active Tag Name 👇
    const category = tagName.toUpperCase();

    // Dynamic Titles based on what tag you clicked
    let title = "";
    let excerpt = "";

    if (isBudget) {
      title = i % 2 === 0 
        ? `Parliament Passes Historic ${tagName} Bill: What It Means For India's Economy` 
        : `How the New Tax Slabs in ${tagName} Affect the Middle Class`;
      excerpt = `A complete breakdown of the new financial policies, tax slabs, and what they mean for the average citizen in the coming fiscal year.`;
    } else if (isGlobal) {
      title = i % 2 === 0 
        ? `US and China Hold Trade Talks in Geneva, Agree to Ease Tariffs`
        : `UN Passes Resolution for Immediate Ceasefire Amidst Global Tensions`;
      excerpt = `In a major step towards easing tensions, world leaders have agreed to new terms while continuing international negotiations.`;
    } else {
      title = `Key Developments in ${tagName}: What You Need to Know Today`;
      excerpt = `Experts weigh in on the latest trends and updates surrounding ${tagName}, predicting massive shifts in the coming weeks.`;
    }

    return {
      id: 100 + i,
      category: category,
      title: title,
      time: `${i + 2} hours ago`,
      img: imgs[i % imgs.length],
      excerpt: excerpt
    };
  });
};

const TagPage: React.FC = () => {
  const { tagSlug } = useParams<{ tagSlug: string }>();
  const tagsScrollRef = useRef<HTMLDivElement>(null);
  
  const [visibleCount, setVisibleCount] = useState(4);

  // Format the slug back into a readable tag title
  const currentTagSlug = tagSlug || "budget-2026";
  const displayTag = currentTagSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); 

  // Reset pagination and scroll on mount/tag change
  useEffect(() => {
    setVisibleCount(4); 

    if (tagsScrollRef.current) {
      const activeElement = tagsScrollRef.current.querySelector('.active');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentTagSlug]);

  const scrollTags = (direction: 'left' | 'right') => {
    if (tagsScrollRef.current) {
      const scrollAmount = 250;
      tagsScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Generate fake articles perfectly tailored to the tag you clicked!
  const mockArticles = generateMockArticles(displayTag);
  const visibleArticles = mockArticles.slice(0, visibleCount);
  
  // Sidebar uses the last few articles for variety
  const sidebarTrending = mockArticles.slice(4, 6);
  const sidebarRecent = mockArticles.slice(5, 8);

  const handleViewMore = () => {
    setVisibleCount(prev => prev + 4); 
  };

  return (
    <div className="tp-editorial-wrapper">
      
      {/* MAIN LAYOUT CONTAINER */}
      <div className="tp-main-container">
        
        {/* ================= TRENDING TAGS TOP BAR ================= */}
        <div className="trending-tags-container">
          <button className="tag-scroll-btn left" onClick={() => scrollTags('left')}>
            <ChevronLeft size={20} />
          </button>
          
          <div className="tags-scroll-wrapper" ref={tagsScrollRef}>
            {MOCK_TAGS.map((tag) => (
              <Link 
                to={`/tag/${tag.slug}`} 
                key={tag.id} 
                className={`tag-pill text-decoration-none ${tag.slug === currentTagSlug ? 'active' : ''}`}
              >
                {tag.name}
              </Link>
            ))}
          </div>

          <button className="tag-scroll-btn right" onClick={() => scrollTags('right')}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Header Section */}
        <div className="tp-page-header">
          <h1 className="tp-page-title">{displayTag}</h1>
          <p className="tp-page-subtitle">Stay updated with the latest news, geopolitical developments, and global trends related to <strong>{displayTag}</strong>.</p>
        </div>

        {mockArticles.length > 0 ? (
          <div className="tp-two-column-layout">
            
            {/* LEFT COLUMN: Main Feed */}
            <div className="tp-main-feed-wrapper">
              <div className="tp-main-feed">
                {visibleArticles.map((article) => (
                  <Link to={`/article/${article.id}`} key={article.id} className="tp-wide-card text-decoration-none">
                    <div className="tp-wide-img-wrap">
                      <img src={article.img} alt={article.title} />
                    </div>
                    <div className="tp-wide-content">
                      <span className="tp-wide-category">{article.category}</span>
                      <h2 className="tp-wide-title">{article.title}</h2>
                      <p className="tp-wide-excerpt">{article.excerpt}</p>
                      <div className="tp-wide-time"><Clock size={14} /> {article.time}</div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* VIEW MORE BUTTON */}
              {visibleCount < mockArticles.length && (
                <div className="tp-view-more-container">
                  <button className="tp-view-more-btn" onClick={handleViewMore}>
                    View More<ChevronDown size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Sidebar */}
            <div className="tp-sidebar">
              
              {/* Sidebar Block 1: Trending */}
              <div className="tp-sidebar-block">
                <div className="tp-sidebar-header">
                  <h3>Trending in {displayTag}</h3>
                </div>
                <div className="tp-sidebar-list">
                  {sidebarTrending.map((article) => (
                    <Link to={`/article/${article.id}`} key={`trend-${article.id}`} className="tp-side-card text-decoration-none">
                      <img src={article.img} alt={article.title} className="tp-side-img" />
                      <div className="tp-side-content">
                        <h4 className="tp-side-title">{article.title}</h4>
                        <span className="tp-side-time">
                          <Clock size={12} className="tp-side-clock" /> {article.time}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sidebar Block 2: Recent */}
              <div className="tp-sidebar-block">
                <div className="tp-sidebar-header">
                  <h3>Recent Articles</h3>
                </div>
                <div className="tp-sidebar-list">
                  {sidebarRecent.map((article) => (
                    <Link to={`/article/${article.id}`} key={`recent-${article.id}`} className="tp-side-card text-decoration-none">
                      <img src={article.img} alt={article.title} className="tp-side-img" />
                      <div className="tp-side-content">
                        <h4 className="tp-side-title">{article.title}</h4>
                        <span className="tp-side-time">
                          <Clock size={12} className="tp-side-clock" /> {article.time}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="tp-empty-state">
            <Hash size={48} className="empty-hash" />
            <h2>No Articles Found</h2>
            <p>We're tracking the wires, but there are no stories tagged with <strong>#{displayTag}</strong> yet.</p>
            <Link to="/" className="tp-home-btn">Return to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagPage;