import React, {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, Home, ChevronRight, ArrowRight } from "lucide-react";
import type { Category } from "../../../types/category";
import { getCategoryNews } from "../../../api/user/categoryNews";
import UserNavbar from "../UserNavbar/UserNavbar";
import Advertisement from "../Advertisment/Advertisment";
import UserFooter from "../UserFooter/UserFooter";
import "./SubCategoryTemplate.css";
import Preloader from "../../Admin/Preloader/Preloder";

interface SubCategoryProps {
  category: Category;
  parentCategory: Category | null;
  color: string;
}

const INITIAL_VISIBLE = 8;
const LOAD_MORE_COUNT = 4;

export default function SubCategoryTemplate({ category, parentCategory, color }: SubCategoryProps) {
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const [news, setNews] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);

        const data =
          await getCategoryNews(
            category.slug
          );

        if (data.success) {
          setNews(data.news || []);
        }

      } catch (error) {
        console.error(error);

      } finally {
        setLoading(false);
      }
    }

    fetchNews();

  }, [category.slug]);

const source = news.map((a: any) => ({
  id: a._id,

  title:
    a.shortTitle ||
    a.headline,

  subtitle:
    a.excerpt ||
    "Read full article.",

  category:
    a.categoryName ||
    category.name,

  published:
    a.publishedAt
      ? new Date(
          a.publishedAt
        ).toLocaleDateString()
      : "Recently",

  views: String(
    a.views || 0
  ),

  img:
    a.featuredImage ||
    "https://via.placeholder.com/600x400",
}));


  const gridArticles = source.slice(0, visible);
  
  const canShowMore = visible < source.length;
  const canShowLess = visible > INITIAL_VISIBLE;

if (loading) {
  return(
   <>
  <UserNavbar />
  <Preloader />
  </>
  );
}

if (!loading && source.length === 0) {
  return (
    <>
      <UserNavbar />
      <div className="sct-notfound">
        No news found
      </div>
    </>
  );
}

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
                  <Link to={`/category/${parentCategory.slug}`}>
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

        <Advertisement page={category.slug} />
        <UserFooter />
      </div>
    </>
  );
}