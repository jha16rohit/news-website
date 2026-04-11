import "./TrafficOverview.css";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { time: "6 AM", views: 15000, visitors: 12000 },
  { time: "8 AM", views: 45000, visitors: 35000 },
  { time: "10 AM", views: 80000, visitors: 55000 },
  { time: "12 PM", views: 120000, visitors: 85000 },
  { time: "2 PM", views: 95000, visitors: 70000 },
  { time: "4 PM", views: 110000, visitors: 80000 },
  { time: "6 PM", views: 140000, visitors: 100000 },
  { time: "8 PM", views: 180000, visitors: 125000 },
  { time: "10 PM", views: 135000, visitors: 95000 },
  { time: "Now", views: 100000, visitors: 75000 },
];

const TrafficOverview = () => {
  return (
    <div className="traffic-card">
      {/* HEADER */}
      <div className="traffic-header">
        <div>
          <h3>Traffic Overview</h3>
          <p>Today's page views and unique visitors</p>
        </div>

        <div className="legend">
          <span className="views-dot">Views</span>
          <span className="visitors-dot">Visitors</span>
        </div>
      </div>

      {/* CHART */}
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>

              <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />

            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis
              stroke="#6b7280"
              tickFormatter={(value) => `${value / 1000}K`}
            />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="views"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#viewsGradient)"
            />

            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#visitorsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrafficOverview;
