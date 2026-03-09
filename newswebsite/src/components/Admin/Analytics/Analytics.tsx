import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./Analytics.css";

// ── Traffic chart data ──
const aaTrafficData = [
  { date: "Feb 7",  views: 265000, visitors: 72000 },
  { date: "Feb 8",  views: 295000, visitors: 85000 },
  { date: "Feb 9",  views: 310000, visitors: 91000 },
  { date: "Feb 10", views: 330000, visitors: 98000 },
  { date: "Feb 11", views: 360000, visitors: 108000 },
  { date: "Feb 12", views: 415000, visitors: 128000 },
  { date: "Feb 13", views: 455000, visitors: 148000 },
];

// ── Top articles ──
const aaArticles = [
  { rank: 1, title: "Major Policy Reform Announced by Government",   views: "245.8K", published: "Feb 12, 2026", engagement: "78%", trend: "+15%", up: true  },
  { rank: 2, title: "Stock Market Hits Record High This Quarter",     views: "189.4K", published: "Feb 11, 2026", engagement: "65%", trend: "+8%",  up: true  },
  { rank: 3, title: "Championship Finals: Complete Highlights",       views: "156.9K", published: "Feb 10, 2026", engagement: "82%", trend: "-3%",  up: false },
  { rank: 4, title: "New Smartphone Launch Breaks Pre-Order Records", views: "134.6K", published: "Feb 9, 2026",  engagement: "71%", trend: "+12%", up: true  },
  { rank: 5, title: "Celebrity Engagement Announcement Goes Viral",   views: "98.7K",  published: "Feb 8, 2026",  engagement: "89%", trend: "+22%", up: true  },
];

// ── Traffic sources ──
const aaSources = [
  { label: "Direct",        icon: "globe",  pct: 42, color: "#3b82f6" },
  { label: "Google Search", icon: "search", pct: 35, color: "#22c55e" },
  { label: "Social Media",  icon: "share",  pct: 23, color: "#a855f7" },
];

// ── Number formatter ──
const aaFmt = (v: number) =>
  v >= 1_000_000
    ? (v / 1_000_000).toFixed(1) + "M"
    : v >= 1000
    ? Math.round(v / 1000) + "K"
    : String(v);

// ── Custom Tooltip ──
const AaCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="aa-chart-tooltip">
        <p className="aa-chart-tooltip-label">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, margin: "2px 0", fontSize: 12 }}>
            {p.name}: {aaFmt(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Icons ──
const AaEyeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const AaUsersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const AaFileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const AaClockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const AaGlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const AaSearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const AaShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const AaTrendUpIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const AaExportIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const AaChartLineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);
const AaPulseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

// ── Main Component ──
const Analytics: React.FC = () => {
  const [aaRange, setAaRange] = useState("Last 7 days");
  const [aaOpen, setAaOpen] = useState(false); 

  return (
    <div className="aa-page">

      {/* Page Header */}
      <div className="aa-header">
        <div className="aa-header-left">
          <h1 className="aa-page-title">Analytics</h1>
          <p className="aa-live-badge">
            <span className="aa-live-dot" />
            Live — Updated just now
          </p>
        </div>
        <div className="aa-header-actions">
         <div className="aa-dropdown">
  <div
    className="aa-dropdown-selected"
    onClick={() => setAaOpen(!aaOpen)}
  >
    {aaRange}
    <span className={`aa-arrow ${aaOpen ? "aa-rotate" : ""}`}>▼</span>
  </div>

  {aaOpen && (
    <div className="aa-dropdown-menu">
      {["Last 7 days", "Last 30 days", "Last 90 days"].map((item) => (
        <div
          key={item}
          className={`aa-dropdown-item ${
            aaRange === item ? "aa-selected" : ""
          }`}
          onClick={() => {
            setAaRange(item);
            setAaOpen(false);
          }}
        >
          {item}
        </div>
      ))}
    </div>
  )}
</div>

          <button className="aa-btn-export">
            <AaExportIcon /> Export
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="aa-stat-grid">
        <div className="aa-stat-card">
          <div className="aa-stat-top">
            <span className="aa-stat-label">TOTAL PAGE VIEWS</span>
            <span className="aa-stat-icon aa-stat-icon--blue"><AaEyeIcon /></span>
          </div>
          <p className="aa-stat-value">2.46M</p>
          <p className="aa-stat-change aa-change-up">↑ +12.5%</p>
        </div>
        <div className="aa-stat-card">
          <div className="aa-stat-top">
            <span className="aa-stat-label">UNIQUE VISITORS</span>
            <span className="aa-stat-icon aa-stat-icon--green"><AaUsersIcon /></span>
          </div>
          <p className="aa-stat-value">834K</p>
          <p className="aa-stat-change aa-change-up">↑ +8.3%</p>
        </div>
        <div className="aa-stat-card">
          <div className="aa-stat-top">
            <span className="aa-stat-label">ARTICLES PUBLISHED</span>
            <span className="aa-stat-icon aa-stat-icon--purple"><AaFileIcon /></span>
          </div>
          <p className="aa-stat-value">142</p>
          <p className="aa-stat-change aa-change-up">↑ +6</p>
        </div>
        <div className="aa-stat-card">
          <div className="aa-stat-top">
            <span className="aa-stat-label">AVG. READ TIME</span>
            <span className="aa-stat-icon aa-stat-icon--amber"><AaClockIcon /></span>
          </div>
          <p className="aa-stat-value">3m 24s</p>
          <p className="aa-stat-change aa-change-down">↓ -2.1%</p>
        </div>
      </div>

      {/* Traffic Overview Chart */}
      <div className="aa-chart-card">
        <div className="aa-chart-header">
          <div>
            <h2 className="aa-chart-title">Traffic Overview</h2>
            <p className="aa-chart-subtitle">Page views and unique visitors over time</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={aaTrafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="aaViewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="aaVisitorsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={aaFmt} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<AaCustomTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
            <Area type="monotone" dataKey="views"    name="Views"    stroke="#3b82f6" strokeWidth={2} fill="url(#aaViewsGrad)"    dot={false} />
            <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#22c55e" strokeWidth={2} fill="url(#aaVisitorsGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row */}
      <div className="aa-bottom-grid">

        {/* Top Articles Table */}
        <div className="aa-table-card">
          <div className="aa-table-card-header">
            <span className="aa-table-card-icon"><AaChartLineIcon /></span>
            <h2 className="aa-table-card-title">Top Performing Articles</h2>
          </div>
          <table className="aa-articles-table">
            <thead>
              <tr>
                <th className="aa-th-article">ARTICLE</th>
                <th className="aa-th-right">VIEWS</th>
                <th className="aa-th-right">PUBLISHED</th>
                <th className="aa-th-right">ENGAGEMENT</th>
                <th className="aa-th-right">TREND</th>
              </tr>
            </thead>
            <tbody>
              {aaArticles.map((a) => (
                <tr key={a.rank} className="aa-article-row">
                  <td className="aa-td-article">
                    <span className="aa-article-rank">{a.rank}</span>
                    <span className="aa-article-title-text">{a.title}</span>
                  </td>
                  <td className="aa-td-right aa-td-views">{a.views}</td>
                  <td className="aa-td-right aa-td-muted">{a.published}</td>
                  <td className="aa-td-right aa-td-muted">{a.engagement}</td>
                  <td className="aa-td-right">
                    <span className={`aa-trend-badge ${a.up ? "aa-trend-up" : "aa-trend-down"}`}>
                      <AaTrendUpIcon /> {a.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Traffic Sources */}
        <div className="aa-sources-card">
          <div className="aa-table-card-header">
            <span className="aa-table-card-icon"><AaPulseIcon /></span>
            <h2 className="aa-table-card-title">Traffic Sources</h2>
          </div>
          <div className="aa-sources-list">
            {aaSources.map((s) => (
              <div key={s.label} className="aa-source-item">
                <div className="aa-source-row">
                  <span className="aa-source-icon-wrap">
                    {s.icon === "globe"  && <AaGlobeIcon />}
                    {s.icon === "search" && <AaSearchIcon />}
                    {s.icon === "share"  && <AaShareIcon />}
                  </span>
                  <span className="aa-source-label">{s.label}</span>
                  <span className="aa-source-pct">{s.pct}%</span>
                </div>
                <div className="aa-source-bar-bg">
                  <div
                    className="aa-source-bar-fill"
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="aa-sources-footer">
            <span className="aa-sources-footer-label">Total sessions</span>
            <span className="aa-sources-footer-value">1.24M</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;