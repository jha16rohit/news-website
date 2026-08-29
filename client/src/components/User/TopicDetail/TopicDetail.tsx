import React, { useState, useEffect } from "react";
import "./TopicDetail.css";
import { ChevronRight, ChevronDown, Instagram, Facebook, Clock } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { Link, useParams } from "react-router-dom";
import Advertisement from "../Advertisment/Advertisment";

import { getTopicProfiles } from "../../../api/user/topicProfile";

import Preloader from "../../Admin/Preloader/Preloder";

import { getTopicNews } from "../../../api/user/topicNews";
import {
  getAdvertisementPool,
  type Advertisement as AdType,
} from "../../../api/user/advertisementPool";

interface Profile {
  _id: string;
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



const TopicDetail: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [topic, setTopic] = useState<Profile | null>(null);
  const [relatedNews,setRelatedNews] =  useState<any[]>([]);
  const [ads, setAds] = useState<{
  cards: AdType[];
  strips: AdType[];
}>({
  cards: [],
  strips: [],
});
  
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {

  const fetchTopic = async () => {

    try {

      setLoading(true);

      const response =
        await getTopicProfiles();

      const foundTopic =
        response.find(
          (t: Profile) =>
            t.slug === slug
        );

      setTopic(
        foundTopic || null
      );
      const newsResponse =
  await getTopicNews(
    slug!
  );

setRelatedNews(
  newsResponse.news || []
);

const adResponse =
    await getAdvertisementPool({
        cards: 0,
        strips: 1,
    });

setAds(adResponse);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  };

  fetchTopic();

}, [slug]);

  const [loading, setLoading] = useState(true);

 

  if (loading) {
  return (
    <div>
      <Preloader />
    </div>
  );
}

 if (!topic) {
  return (
    <div>
      Topic not found
    </div>
  );
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
              
              {/* 👇 The Image Box (Now set up to float) 👇 */}
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

              {/* 👇 The Text Content (No longer trapped in a column!) 👇 */}
              <h3 className="topic-detail-label">{topic.caption}</h3>
              
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
        <Advertisement
    adData={ads.strips[0] ?? null}
/>
      </div>
      
      {/* Related News Section */}
      <div className="topic-detail-container topic-detail-related-section">
        <div className="topic-detail-related-header">
          <h2>Related News</h2>
          
        </div>

        <div className="topic-detail-related-list">
          {relatedNews.map((news) => (
            <Link to={`/news/${news.slug}`}key={news.id} className="topic-detail-news-card text-decoration-none">
              <div className="topic-detail-news-img-wrap">
                {news.isLive && <span className="topic-detail-live-badge">LIVE</span>}
                <img src={news.featuredImage} alt={news.headline} />
              </div>
              <div className="topic-detail-news-content">
                <h3 className="topic-detail-news-title">{news.headline}</h3>
                <p className="topic-detail-news-desc">{news.excerpt}</p>
                <div className="topic-detail-news-meta">
                  <span className="topic-detail-news-cat">{news.category}</span>
                  <span className="topic-detail-divider">|</span>
                  <span>{news.author}</span>
                  <span className="topic-detail-divider">|</span>
                  <span className="topic-detail-time"><Clock size={12} /> {new Date(
  news.createdAt
).toLocaleDateString()}</span>
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