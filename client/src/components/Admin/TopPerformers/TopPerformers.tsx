import "./TopPerformers.css";
import { TrendingUp, Eye, Clock } from "lucide-react";

const data = [
  {
    rank: 1,
    title: "Breaking: Parliament Passes Historic Reform Bill",
    views: "234K",
    time: "4 min",
    growth: "+45%",
  },
  {
    rank: 2,
    title: "Stock Markets Surge: Best Day in 3 Years",
    views: "189K",
    time: "3 min",
    growth: "+32%",
  },
  {
    rank: 3,
    title: "Exclusive Interview: PM on Future Plans",
    views: "156K",
    time: "8 min",
    growth: "+28%",
  },
  {
    rank: 4,
    title: "Tech Innovation: Indian Startup Valued at $10B",
    views: "124K",
    time: "5 min",
    growth: "+22%",
  },
  
];

const TopPerformers = () => {
  return (
    <div className="top-performers">
      {/* HEADER */}
      <div className="tp-header">
        <div className="tp-title">
          <TrendingUp size={20} />
          <h3>Top Performers</h3>
        </div>
        <p>Highest performing articles today</p>
      </div>

      {/* LIST */}
      <div className="tp-list">
        {data.map((item) => (
          <div key={item.rank} className="tp-item">
            <div className="tp-left">
              <div className="tp-rank">{item.rank}</div>

              <div className="tp-content">
                <h4>{item.title}</h4>

                <div className="tp-meta">
                  <span>
                    <Eye size={14} /> {item.views}
                  </span>
                  <span>
                    <Clock size={14} /> {item.time}
                  </span>
                  <span className="tp-growth">
                    ↑ {item.growth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopPerformers;
