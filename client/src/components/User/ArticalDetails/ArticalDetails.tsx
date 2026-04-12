import React from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import "./ArticalDetails.css"; // Make sure to create this CSS file for styling

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
              <button className="share-btn tw"><Twitter size={16} /></button>
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
    </div>
  );
};

export default ArticleDetail;