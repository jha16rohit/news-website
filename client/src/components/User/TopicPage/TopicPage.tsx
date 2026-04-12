import React, { useState, useEffect } from "react";
import "./TopicPage.css";
import { Link } from "react-router-dom";
import { User, Facebook, Instagram } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";

interface Profile {
  id: number;
  name: string;
  slug: string;
  caption: string;
  description: string;
  instagram: string;
  facebook: string;
  twitter: string;
  imageUrl?: string;
}

const TopicPage: React.FC = () => {
  const [topics, setTopics] = useState<Profile[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    const loadTopics = () => {
      const raw = localStorage.getItem("topic_profiles");
      if (raw) {
        setTopics(JSON.parse(raw));
      }
    };

    loadTopics();
    window.addEventListener("storage", loadTopics);
    return () => window.removeEventListener("storage", loadTopics);
  }, []);

  const handleShowMore = () => {
    setVisibleCount((prevCount) => prevCount + 4);
  };

  return (
    <div className="topic-page-wrapper">
      <main className="topic-main-content">
        <div className="topic-container">

          <div className="topic-header-section">
            <h1 className="topic-page-heading">Topics</h1>
            <p className="topic-page-subheading">Follow your favorite people, trends, and categories.</p>
          </div>

          <div className="topic-grid">
            {topics.slice(0, visibleCount).map((topic) => (

              <Link to={`/topic/${topic.id}`} key={topic.id} className="topic-card text-decoration-none">

                {/* 1. Full Width Image at Top */}
                <div className="topic-card-image-wrapper">
                  {topic.imageUrl ? (
                    <img src={topic.imageUrl} alt={topic.name} className="topic-card-image" />
                  ) : (
                    <div className="topic-card-no-image">
                      <User size={40} color="#94a3b8" />
                    </div>
                  )}
                </div>

                <div className="topic-card-body">

                  {/* 3. Title (Topic Name) */}
                  <h2 className="topic-card-title">{topic.name}</h2>

                  {/* 2. Red Highlighted Caption (Badge) */}
                  {topic.caption && (
                    <span className="topic-card-badge">{topic.caption}</span>
                  )}



                  {/* 4. Description with "..." truncation */}
                  <p className="topic-card-desc">{topic.description}</p>
                </div>

                {/* 5. Social Links Footer */}
                <div className="topic-card-footer">
                  {topic.facebook && <button className="topic-social-btn" onClick={(e) => { e.preventDefault(); window.open(topic.facebook); }}><Facebook size={16} /></button>}
                  {topic.twitter && <button className="topic-social-btn" onClick={(e) => { e.preventDefault(); window.open(topic.twitter); }}><FaXTwitter size={16} /></button>}
                  {topic.instagram && <button className="topic-social-btn" onClick={(e) => { e.preventDefault(); window.open(topic.instagram); }}><Instagram size={16} /></button>}
                </div>

              </Link>
            ))}

            {topics.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#64748b" }}>
                No topics available yet. Create some in the Admin panel!
              </div>
            )}
          </div>

          {visibleCount < topics.length && (
            <div className="topic-action-row">
              <button className="topic-show-more-btn" onClick={handleShowMore}>
                Show More
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default TopicPage;