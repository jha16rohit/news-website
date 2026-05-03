import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, Home, ChevronRight, ArrowRight } from "lucide-react";
import { useNews } from "../../Admin/NewsStore/NewsStore";
import type { Category } from "../../Admin/NewsStore/NewsStore";
import UserNavbar from "../UserNavbar/UserNavbar";
import Advertisement from "../Advertisment/Advertisment";
import UserFooter from "../UserFooter/UserFooter";
import "./SubCategoryTemplate.css";

// ─── Static placeholder data ───
const STATIC_ARTICLES = [
  { id: 1001, title: "Champions League Final: Historic Night", subtitle: "An electrifying finale saw two European giants battle.", category: "News", published: "2 hours ago", views: "34.2K", img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80" },
  { id: 1002, title: "Slam Dunk Contest Sets Record", subtitle: "The annual contest drew the highest ratings in a decade.", category: "News", published: "3 hours ago", views: "18.1K", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80" },
  { id: 1003, title: "World Swimming Championships Upsets", subtitle: "Defending champions fell as rising stars claimed gold.", category: "News", published: "5 hours ago", views: "12.4K", img: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&q=80" },
  { id: 1004, title: "Clay Court Season Opens With Thriller", subtitle: "Rain delays and a comeback for the ages.", category: "News", published: "6 hours ago", views: "9.8K", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80" },
  { id: 1005, title: "India Clinches Historic Test Series", subtitle: "A thrilling final day saw India seal their triumph.", category: "News", published: "3 hours ago", views: "22.3K", img: "https://images.unsplash.com/photo-1540747913346-19212a4e3b4a?w=600&q=80" },
  { id: 1006, title: "Formula 1 Season Ends in Crash", subtitle: "Safety cars and red flags dominated the track.", category: "News", published: "4 hours ago", views: "15.6K", img: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&q=80" },
];

interface SubCategoryProps {
  category: Category;
  parentCategory: Category | null;
  color: string;
}

const INITIAL_VISIBLE = 8;
const LOAD_MORE_COUNT = 4;

export default function SubCategoryTemplate({ category, parentCategory, color }: SubCategoryProps) {
  const { articles: storeArticles } = useNews();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  // Filter articles
  const storeFiltered = storeArticles.filter((a) => a.category.toLowerCase() === category.name.toLowerCase());
  
  const source = storeFiltered.length > 0 
    ? storeFiltered.map((a) => ({ ...a, img: "" })) 
    : STATIC_ARTICLES.map((a) => ({ ...a, category: category.name }));

  const gridArticles = source.slice(0, visible);
  
  const canShowMore = visible < source.length;
  const canShowLess = visible > INITIAL_VISIBLE;

  return (
    <>
      <UserNavbar />
      
      <div className="sct-root" style={{ "--cat-color": color } as React.CSSProperties}>
        
        {/* ── BREADCRUMB & HEADER SECTION ── */}
        <div className="sct-header-banner">
          <div className="sct-wrap">
            <div className="sct-breadcrumb">
              <Link to="/"><Home size={14} /> Home</Link>
              <ChevronRight size={14} />
              {parentCategory && (
                <>
                  <Link to={`/category/${parentCategory.name.toLowerCase().replace(/\s+/g, "-")}`}>
                    {parentCategory.name}
                  </Link>
                  <ChevronRight size={14} />
                </>
              )}
              <span className="sct-breadcrumb-current">{category.name}</span>
            </div>
            
            <div className="sct-title-wrapper">
              <div className="sct-title-accent" style={{ backgroundColor: color }} />
            </div>
          </div>
        </div>

        {/* ── FOCUSED NEWS GRID ── */}
        <section className="sct-section">
          <div className="sct-wrap">
            
            <div className="sct-grid">
              {gridArticles.map((a, i) => (
                <Link 
                  to={`/article/${a.id}`} 
                  key={a.id} 
                  className="sct-card" 
                  style={{ animationDelay: `${i * 50}ms`, textDecoration: "none", color: "inherit" }}
                >
                  <div className="sct-card-imgwrap">
                    <img src={a.img} alt={a.title} className="sct-card-img" />
                    <span className="sct-badge" style={{ backgroundColor: color }}>{a.category}</span>
                  </div>
                  <div className="sct-card-body">
                    <h3 className="sct-card-title">{a.title}</h3>
                    <p className="sct-card-sub">{a.subtitle}</p>
                    <div className="sct-card-footer">
                      <div className="sct-meta">
                        <Clock size={12} /><span>{a.published}</span>
                        <Eye size={12} style={{marginLeft: '8px'}} /><span>{a.views}</span>
                      </div>
                      <span className="sct-read-btn" style={{ color }}>
                        Read <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="sct-actions">
              {canShowMore && (
                <button className="sct-btn-solid" style={{ backgroundColor: color }} onClick={() => setVisible(v => Math.min(v + LOAD_MORE_COUNT, source.length))}>
                  Load More News
                </button>
              )}
              {canShowLess && (
                <button className="sct-btn-outline" style={{ borderColor: color, color }} onClick={() => setVisible(INITIAL_VISIBLE)}>
                  Show Less
                </button>
              )}
            </div>

          </div>
        </section>

        <Advertisement page={category.name.toLowerCase().replace(/\s+/g, "-")}/>
        <UserFooter />
      </div>
    </>
  );
}