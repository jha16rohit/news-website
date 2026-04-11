import "./AdminDashboard.css";
import BreakingNewsPanel from "../BreakingNewsPanel/BreakingNewsPanel";
import QuickActions from "../QuickActions/QuickActions";
import TrafficOverview from "../TrafficOverview/TrafficOverview";
import TopPerformers from "../TopPerformers/TopPerformers";
import RecentArticles from "../RecentArticles/RecentArticles";
import { FileText, Clock, Zap, Eye, TrendingUp, Users } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening in your newsroom today.</p>
        </div>
        <span className="last-updated">Last updated: <strong>2 minutes ago</strong></span>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <StatCard icon={<FileText />} value="47"   label="Published Today"   growth="+12"  />
        <StatCard icon={<Clock />}    value="18"   label="Pending Review"    growth="-3"   negative />
        <StatCard icon={<Zap />}      value="3"    label="Breaking News"     live />
        <StatCard icon={<Eye />}      value="2.4M" label="Total Views Today" growth="+18%" />
        <StatCard icon={<TrendingUp />} value="12" label="Trending Articles" growth="+5"   />
        <StatCard icon={<Users />}    value="45.2K" label="Active Readers"   growth="+2.1K" />
      </div>

      {/* BREAKING + QUICK ACTIONS */}
      <div className="dashboard-grid">
        <BreakingNewsPanel />
        <QuickActions />
      </div>

      {/* TRAFFIC + TOP PERFORMERS */}
      <div className="dashboard-row">
        <div className="dashboard-main"><TrafficOverview /></div>
        <div className="dashboard-side"><TopPerformers /></div>
      </div>

      {/* RECENT ARTICLES */}
      <RecentArticles />

    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  growth?: string;
  negative?: boolean;
  live?: boolean;
}

const StatCard = ({ icon, value, label, growth, negative, live }: StatCardProps) => (
  <div className="stat-card">
    <div className="stat-top">
      <div className="stat-icon">{icon}</div>
      {growth && (
        <span className={`growth ${negative ? "down" : "up"}`}>
          {negative ? "↓" : "↑"} {growth}
        </span>
      )}
      {live && (
        <span className="live-pill">
          <span className="live-dot" /> Live
        </span>
      )}
    </div>
    <h2>{value}</h2>
    <p>{label}</p>
  </div>
);

export default AdminDashboard;