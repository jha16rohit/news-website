import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Radio } from "lucide-react";
import "./LiveEventsPage.css";
import { fetchAdminNews } from "../../../api/news";
import Preloader from "../../Admin/Preloader/Preloder";
import { getLiveStatus } from "../../../utils/statusUtils";

interface LiveStory {
  _id: string;
  headline: string;
  category: string;
  categoryId?: { name: string; color: string } | string;
  statusType?: string;
  articleType?: string;
  views: number;
  publishedAt?: string;
  featuredImage?: string;
  liveUpdates: Array<{
    id: string;
    time: string;
    title: string;
    text: string;
    isBreaking?: boolean;
    isHighlight?: boolean;
    imageUrl?: string;
    imageCaption?: string;
    imageCredit?: string;
    tweetUrl?: string;
    poll?: {
      question: string;
      options: { label: string; votes: number }[];
      totalVotes?: number;
    };
    sourceUrl?: string;
    sourceLabel?: string;
    tags?: string[];
  }>;
}

const LiveEventsPage: React.FC = () => {
  const [liveStories, setLiveStories] = useState<LiveStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAdminNews({ articleType: "LIVE", status: "PUBLISHED", limit: 50 });
        if (data?.news) {
          setLiveStories(data.news);
        } else {
          setLiveStories([]);
        }
      } catch (err) {
        console.error("Failed to fetch live stories:", err);
        setError("Failed to load live coverage");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return <Preloader />;
  }

  if (error) {
    return (
      <div className="live-events-page">
        <div className="live-events-container">
          <div className="page-header">
            <div className="header-title-wrapper">
              <Radio size={32} className="pulsing-icon" />
              <h1>Live Coverage Directory</h1>
            </div>
            <p className="header-subtitle">Real-time updates, breaking news, and live streams happening right now.</p>
            <div className="header-underline"></div>
          </div>
          <div className="live-events-empty">
            <div className="empty-state">
              <Radio size={48} className="empty-icon" />
              <h2>Unable to Load Live Coverage</h2>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (liveStories.length === 0) {
    return (
      <div className="live-events-page">
        <div className="live-events-container">
          <div className="page-header">
            <div className="header-title-wrapper">
              <Radio size={32} className="pulsing-icon" />
              <h1>Live Coverage Directory</h1>
            </div>
            <p className="header-subtitle">Real-time updates, breaking news, and live streams happening right now.</p>
            <div className="header-underline"></div>
          </div>
          <div className="live-events-empty">
            <div className="empty-state">
              <Radio size={48} className="empty-icon" />
              <h2>No Live Coverage Right Now</h2>
              <p>Check back later for real-time updates on breaking stories.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-events-page">
      <div className="live-events-container">
        
        {/* Page Header */}
        <div className="page-header">
          <div className="header-title-wrapper">
            <Radio size={32} className="pulsing-icon" />
            <h1>Live Coverage Directory</h1>
          </div>
          <p className="header-subtitle">Real-time updates, breaking news, and live streams happening right now.</p>
          <div className="header-underline"></div>
        </div>

        {/* Live Events Grid */}
        <div className="live-events-grid">
          {liveStories.map((item) => {
            const categoryName = typeof item.categoryId === "object" ? item.categoryId?.name : item.category;
            const updateCount = item.liveUpdates?.length ?? 0;
            const lastUpdate = item.liveUpdates?.[0];
            const lastUpdateTime = lastUpdate ? lastUpdate.time : (item.publishedAt ? new Date(item.publishedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "Just now");
            // Cast to StatusArticle for type compatibility
            const status = getLiveStatus({
              articleType: item.articleType as "STANDARD" | "BREAKING" | "LIVE" | undefined,
              statusType: item.statusType,
            });

            return (
              <Link
                to={`/live/${item._id}`}
                className="live-grid-card text-decoration-none"
                key={item._id}
              >
                <div
                  className="card-image-wrapper"
                  style={{
                    backgroundImage: `url(${item.featuredImage || "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800"})`,
                  }}
                >
                  <div className="live-status-badge">
                    <span className="pulsing-dot"></span> {status}
                  </div>
                  <div className="card-overlay">
                    <span className="card-category">{categoryName || "News"}</span>
                    <h3 className="card-title">{item.headline}</h3>
                  </div>
                </div>
                <div className="card-footer">
                  <span className="updates-count">{updateCount} update{updateCount !== 1 ? "s" : ""}</span>
                  <span className="update-time">{lastUpdateTime}</span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default LiveEventsPage;