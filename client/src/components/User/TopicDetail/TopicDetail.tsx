import React, { useState, useEffect } from "react";
import "./TopicDetail.css";
import { ChevronRight, ChevronDown, Instagram, Facebook, Clock } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { Link, useParams } from "react-router-dom";
import Advertisement from "../Advertisment/Advertisment";

interface Profile {
  id: number;
  name: string;
  slug: string;
  caption: string;
  description: string;
  fullDetails?: string; 
  instagram: string;
  facebook: string;
  twitter: string;
  imageUrl?: string;
}

const relatedNews = [
  {
    id: 1,
    title: "'Dhurandhar' Box Office Collection Day 5: Film Crosses ₹200 Crore Mark",
    desc: "The political drama continues its dream run at the box office, crossing the ₹200 crore mark in just five days of release.",
    category: "Entertainment",
    author: "Entertainment Desk",
    time: "about 1 year ago",
    img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400",
    isLive: true
  },
  {
    id: 2,
    title: "India's GDP Growth Rate Hits 7.5% in Q1, Surpassing Expectations",
    desc: "India's economy shows robust recovery with a 7.5% growth rate in the first quarter, driven by strong consumer spending and industrial output.",
    category: "Business",
    author: "Business Desk",
    time: "about 1 day ago",
    img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=400",
    isLive: true
  }
];

const TopicDetail: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [topic, setTopic] = useState<Profile | null>(null);
  
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const raw = localStorage.getItem("topic_profiles");
    if (raw) {
      const allTopics: Profile[] = JSON.parse(raw);
      const foundTopic = allTopics.find(t => t.id.toString() === id);
      setTopic(foundTopic || null);
    }
  }, [id]);

  if (!topic) {
    return <div style={{ padding: "100px", textAlign: "center", fontSize: "20px" }}>Topic not found.</div>;
  }

  return (
    <div className="topic-detail-wrapper">
      
      <div className="topic-detail-container">
        <nav className="topic-detail-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/Topic">Topic</Link>
          <ChevronRight size={14} />
          <span className="topic-detail-current">{topic.name.toUpperCase()}</span>
        </nav>
        
        <h1 className="topic-detail-main-title">{topic.name}</h1>
      </div>

      <div className="topic-detail-container topic-detail-grid">
        <div className="topic-detail-left">
          
          <div className="topic-detail-info-card">
            <div className="topic-detail-info-body">
              
              <div className="topic-detail-left-column">
                <div className="topic-detail-img-box">
                  {topic.imageUrl ? (
                    <img src={topic.imageUrl} alt={topic.name} />
                  ) : (
                    <div style={{ height: "320px", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                      No Image Found
                    </div>
                  )}
                  <div className="topic-detail-img-caption">
                    {topic.name} - {topic.caption}
                  </div>
                </div>
              </div>

              <div className="topic-detail-text-box">
                <h3 className="topic-detail-label">{topic.caption}</h3>
                
                {/* 👇 UPGRADED: Smart text box that preserves paragraphs and truncates! */}
                <div className={`topic-detail-bio ${isExpanded ? "expanded" : "collapsed"}`}>
                  {topic.description}
                  {topic.fullDetails && `\n\n${topic.fullDetails}`}
                </div>

                <button 
                  className="topic-detail-read-more" 
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? "Show Less" : "Read More"} 
                  <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                </button>
              </div>
            </div>

            <div className="topic-detail-social-footer">
              <span className="social-text">Follow updates on {topic.name}</span>
              <div className="topic-detail-social-icons">
                {topic.instagram && <button onClick={() => window.open(topic.instagram)}><Instagram size={16} /></button>}
                {topic.facebook && <button onClick={() => window.open(topic.facebook)}><Facebook size={16} /></button>}
                {topic.twitter && <button onClick={() => window.open(topic.twitter)}><FaXTwitter size={16} /></button>}
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Permanent Ad Section */}
      <div className="topic-detail-ad-fullwidth">
        <Advertisement />
      </div>
      
      {/* Related News Section */}
      <div className="topic-detail-container topic-detail-related-section">
        <div className="topic-detail-related-header">
          <h2>Related News</h2>
          <span>{relatedNews.length} articles</span>
        </div>

        <div className="topic-detail-related-list">
          {relatedNews.map((news) => (
            <Link to={`/article/${news.id}`} key={news.id} className="topic-detail-news-card text-decoration-none">
              <div className="topic-detail-news-img-wrap">
                {news.isLive && <span className="topic-detail-live-badge">LIVE</span>}
                <img src={news.img} alt={news.title} />
              </div>
              <div className="topic-detail-news-content">
                <h3 className="topic-detail-news-title">{news.title}</h3>
                <p className="topic-detail-news-desc">{news.desc}</p>
                <div className="topic-detail-news-meta">
                  <span className="topic-detail-news-cat">{news.category}</span>
                  <span className="topic-detail-divider">|</span>
                  <span>{news.author}</span>
                  <span className="topic-detail-divider">|</span>
                  <span className="topic-detail-time"><Clock size={12} /> {news.time}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default TopicDetail;