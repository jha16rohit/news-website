import "./AdminDashboard.css";
// import BreakingNewsPanel from "../BreakingNewsPanel/BreakingNewsPanel";
// import QuickActions from "../QuickActions/QuickActions";
import { useState, useEffect, useCallback } from "react";
import TrafficOverview from "../TrafficOverview/TrafficOverview";
import TopPerformers from "../TopPerformers/TopPerformers";
import RecentArticles from "../RecentArticles/RecentArticles";
import { FileText, Clock, Zap, Eye, TrendingUp, Users } from "lucide-react";
import { fetchKPIs } from "../../../api/analytics";

// ── Types ──────────────────────────────────────────────────────────────────
interface KPIs {
  publishedToday:       number;
  publishedGrowth:      number;
  pendingReview:         number;
  pendingReviewGrowth:  number;
  breakingLive:          number;
  viewsToday:            number;
  viewsGrowthPct:        number;
  trending:              number;
  trendingGrowth:        number;
  activeReaders:         number;
  activeReadersGrowth:  number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDelta(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${formatCompact(Math.abs(n))}`;
}

const AdminDashboard = () => {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchKPIs(1);
      setKpis(data);
    } catch {
      setKpis(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening in your newsroom today.</p>
        </div>
        <span className="last-updated">Last updated: <strong>{loading ? "…" : "just now"}</strong></span>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <StatCard
          icon={<FileText />}
          value={loading || !kpis ? "—" : String(kpis.publishedToday)}
          label="Published Today"
          growth={!loading && kpis ? formatDelta(kpis.publishedGrowth) : undefined}
          negative={!!kpis && kpis.publishedGrowth < 0}
        />
        <StatCard
          icon={<Clock />}
          value={loading || !kpis ? "—" : String(kpis.pendingReview)}
          label="Pending Review"
          growth={!loading && kpis ? formatDelta(kpis.pendingReviewGrowth) : undefined}
          negative={!!kpis && kpis.pendingReviewGrowth < 0}
        />
        <StatCard
          icon={<Zap />}
          value={loading || !kpis ? "—" : String(kpis.breakingLive)}
          label="Breaking News"
          live={!!kpis && kpis.breakingLive > 0}
        />
        <StatCard
          icon={<Eye />}
          value={loading || !kpis ? "—" : formatCompact(kpis.viewsToday)}
          label="Total Views Today"
          growth={!loading && kpis ? `${kpis.viewsGrowthPct >= 0 ? "+" : ""}${kpis.viewsGrowthPct}%` : undefined}
          negative={!!kpis && kpis.viewsGrowthPct < 0}
        />
        <StatCard
          icon={<TrendingUp />}
          value={loading || !kpis ? "—" : String(kpis.trending)}
          label="Trending Articles"
          growth={!loading && kpis ? formatDelta(kpis.trendingGrowth) : undefined}
          negative={!!kpis && kpis.trendingGrowth < 0}
        />
        <StatCard
          icon={<Users />}
          value={loading || !kpis ? "—" : formatCompact(kpis.activeReaders)}
          label="Active Readers"
          growth={!loading && kpis ? formatDelta(kpis.activeReadersGrowth) : undefined}
          negative={!!kpis && kpis.activeReadersGrowth < 0}
        />
      </div>

      {/* BREAKING + QUICK ACTIONS */}
      {/* <div className="dashboard-grid">
        <BreakingNewsPanel />
        <QuickActions />
      </div> */}

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