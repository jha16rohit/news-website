import "./BreakingNewsPanel.css";
import { Zap, Clock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BreakingNewsPanel = () => {
  const navigate = useNavigate();

  const handleManageLive = () => {
    navigate("/admin/live");
  };

  return (
    <div className="breaking-panel">
      {/* HEADER */}
      <div className="breaking-header">
        <div className="breaking-title">
          <div className="breaking-icon">
            <Zap size={18} className="breaking-zap" />
          </div>
          <div>
            <h3>Breaking News</h3>
            <span>4 live alerts • Updated now</span>
          </div>
        </div>

        <button className="manage-btn" onClick={handleManageLive}>
          Manage Live Stories ↗
        </button>
      </div>

      {/* LIST */}
      <div className="breaking-list">
        {[1, 2, 3, 4].map((id) => (
          <div key={id} className="breaking-item">
            <div className="breaking-left">
              <span className="tag breaking">BREAKING</span>
              <span className="category">Business</span>

              <h4>
                Stock Markets Hit Record High: Sensex Crosses 85,000 Mark
              </h4>

              <div className="meta">
                <Clock size={14} />
                <span>42 min ago</span>
                <Eye size={14} />
                <span>89K views</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BreakingNewsPanel;
