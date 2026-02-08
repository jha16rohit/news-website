import "./BreakingNewsPanel.css";
import { Zap, MoreHorizontal, Clock, Eye } from "lucide-react";

const BreakingNewsPanel = () => {
  return (
    <div className="breaking-panel">
      {/* HEADER */}
      <div className="breaking-header">
        <div className="breaking-title">
          <div className="breaking-icon">
            <Zap size={18} className="breaking-zap"/>
          </div>
          <div>
            <h3>Breaking News</h3>
            <span>3 live stories • Updated 2 min ago</span>
          </div>
        </div>

        <button className="manage-btn">
          Manage Live Stories ↗
        </button>
      </div>

      {/* LIST */}
      <div className="breaking-list">
        <BreakingItem
          tag="LIVE"
          category="Politics"
          title="Parliament Session: Key Budget Amendments Passed After 12-Hour Debate"
          time="15 min ago"
          views="145K views"
          highlight
        />

        <BreakingItem
          tag="UPDATING"
          category="Business"
          title="Stock Markets Hit Record High: Sensex Crosses 85,000 Mark"
          time="42 min ago"
          views="89K views"
        />

        <BreakingItem
          tag="DEVELOPING"
          category="Weather"
          title="Major Weather Alert: Cyclone Warning Issued for Coastal Regions"
          time="1 hr ago"
          views="234K views"
        />
        <BreakingItem
            tag="ALERT"
            category="National"
            title="Government Issues Nationwide Advisory Following Security Review"
            time="5 min ago"
            views="52K views"
        />

      </div>
    </div>
  );
};

interface ItemProps {
  tag: string;
  category: string;
  title: string;
  time: string;
  views: string;
  highlight?: boolean;
}

const BreakingItem = ({
  tag,
  category,
  title,
  time,
  views,
  highlight,
}: ItemProps) => {
  return (
    <div className={`breaking-item ${highlight ? "highlight" : ""}`}>
      <div className="breaking-left">
        <span className={`tag ${tag.toLowerCase()}`}>{tag}</span>
        <span className="category">{category}</span>

        <h4>{title}</h4>

        <div className="meta">
          <Clock size={14} />
          <span>{time}</span>
          <Eye size={14} />
          <span>{views}</span>
        </div>
      </div>

      <MoreHorizontal className="more-icon" />
    </div>
  );
};

export default BreakingNewsPanel;
