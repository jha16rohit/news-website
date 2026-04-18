import React from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin,Instagram} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import "./ArticalDetails.css"; 
import Advertisement from "../Advertisment/Advertisment";

const ArticleDetail: React.FC = () => {
  // We will use this ID later to fetch the real article from your backend!
  const { articleId } = useParams();

  // Mock data for the article
  const article = {
    title: "Parliament Passes Historic Budget Bill: What It Means For India's Economy",
    category: "Politics",
    author: "Aditi Sharma",
    date: "March 2, 2026",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&q=80&w=1200",
    
    // 👇 NEW LOGIC: Admin controls for Live Updates 👇
    isLive: true, // Change this to false to see the widget disappear!
    liveUpdates: [
      { time: "12:45 PM", text: "PM addresses the nation on education reform passage" },
      { time: "12:30 PM", text: "Opposition parties react to the bill — mixed responses" },
      { time: "12:15 PM", text: "Bill passed with 356 votes in favor, 98 against" },
      { time: "12:00 PM", text: "Final round of voting begins in Parliament" },
      { time: "11:45 AM", text: "Heated debate continues on digital literacy provisions" },
    ],

    content: `
      In a landmark session, the Indian Parliament has passed the most ambitious budget bill in recent history, promising sweeping reforms across healthcare, education, and infrastructure sectors. 

      The bill, which saw weeks of intense debate, was finally approved with a significant majority. Financial analysts are already predicting a positive market response, citing the heavy emphasis on digital infrastructure and renewable energy initiatives.

      "This is a budget for the future," stated the Finance Minister during the closing remarks. "We are laying the foundation for a resilient, self-reliant economy that can weather global uncertainties."

      Key highlights of the budget include a 15% increase in healthcare spending, massive tax incentives for electric vehicle manufacturers, and a nationwide rollout of high-speed rural internet projects. Critics, however, have raised concerns about the fiscal deficit, urging the government to maintain strict checks on public spending.
    `
  };

  return (
    <div className="article-page">
      <div className="article-container">
        
        {/* Main Reading Area */}
        <main className="article-main">
          {/* Breadcrumb Navigation */}
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="divider">/</span>
            <Link to={`/category/${article.category.toLowerCase()}`}>{article.category}</Link>
            <span className="divider">/</span>
            <span className="current">{article.title}</span>
          </div>

          <span className="article-badge">{article.category}</span>
          <h1 className="article-headline">{article.title}</h1>

          {/* Meta Info & Social Share */}
          <div className="article-meta-bar">
            <div className="meta-info">
              <span className="meta-item"><User size={16} /> {article.author}</span>
              <span className="meta-item"><Calendar size={16} /> {article.date}</span>
              <span className="meta-item"><Clock size={16} /> {article.readTime}</span>
            </div>
            
            <div className="social-share">
              <span className="share-text"><Share2 size={16} /> Share:</span>
              <button className="share-btn fb"><Facebook size={16} /></button>
              <button className="share-btn ig"><Instagram size={16} /></button>
              <button className="share-btn tw"><FaXTwitter size={16} /></button>
              <button className="share-btn in"><Linkedin size={16} /></button>
            </div>
          </div>

          <img src={article.imageUrl} alt={article.title} className="article-hero-image" />

          {/* Article Text */}
          <div className="article-body">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            
            <blockquote className="article-quote">
              "This is a budget for the future. We are laying the foundation for a resilient, self-reliant economy that can weather global uncertainties."
            </blockquote>
            
            <p>
              Moving forward, the implementation phase will be closely watched by international investors and local markets alike. The true test of this historic bill will be its execution over the next fiscal year.
            </p>
          </div>
        </main>

        {/* Right Sidebar for Related Content */}
        <aside className="article-sidebar">
          
          {/* 👇 THE CONDITIONAL LIVE UPDATES WIDGET 👇 */}
          {article.isLive && article.liveUpdates && article.liveUpdates.length > 0 && (
            <div className="sidebar-widget live-widget">
              <div className="live-header">
                <span className="live-pulse-dot"></span>
                <h3 className="widget-title">LIVE UPDATES</h3>
              </div>
              <div className="widget-underline"></div>
              
              <div className="live-updates-list">
                {article.liveUpdates.map((update, index) => (
                  <div key={index} className="live-update-item">
                    <span className="live-time">{update.time}</span>
                    <p className="live-text">{update.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related News Widget */}
          <div className="sidebar-widget">
            <h3 className="widget-title">Related News</h3>
            <div className="widget-underline"></div>
            
            <div className="related-item">
              <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=200" alt="Market" className="related-img" />
              <div className="related-info">
                <h4>Sensex Surges 800 Points After Budget Announcement</h4>
                <span>2 hours ago</span>
              </div>
            </div>
            
            <div className="related-item">
              <img src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=200" alt="Tech" className="related-img" />
              <div className="related-info">
                <h4>Tech Sector Welcomes New AI Infrastructure Fund</h4>
                <span>4 hours ago</span>
              </div>
            </div>
          </div>
        </aside>

      </div>
      <Advertisement />
    </div>
  );
};

export default ArticleDetail;