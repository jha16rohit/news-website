import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./UserInsights.css";

/* ------------------------------------------------------------------ */
/*  Dummy data                                                         */
/* ------------------------------------------------------------------ */

const monthlyData = [
  { label: "Jan", users: 120 },
  { label: "Feb", users: 165 },
  { label: "Mar", users: 200 },
  { label: "Apr", users: 260 },
  { label: "May", users: 340 },
  { label: "Jun", users: 390 },
  { label: "Jul", users: 450 },
  { label: "Aug", users: 410 },
  { label: "Sep", users: 470 },
  { label: "Oct", users: 505 },
  { label: "Nov", users: 540 },
  { label: "Dec", users: 590 },
];

const yearlyData = [
  { label: "2020", users: 1200 },
  { label: "2021", users: 2400 },
  { label: "2022", users: 4100 },
  { label: "2023", users: 6800 },
  { label: "2024", users: 9500 },
  { label: "2025", users: 12458 },
];

const growthRateStats = [
  { key: "highest", label: "Highest Growth Month", primary: "July", secondary: "+22%" },
  { key: "lowest", label: "Lowest Growth Month", primary: "February", secondary: "+3%" },
  { key: "average", label: "Average Monthly Growth", primary: "12.4%", secondary: "" },
  { key: "current", label: "Current Growth", primary: "+16%", secondary: "" },
];

const adRequestSummary = [
  { key: "pending", label: "Pending", value: 18, color: "var(--uid-color-warning)" },
  { key: "approved", label: "Approved", value: 95, color: "var(--uid-color-success)" },
  { key: "rejected", label: "Rejected", value: 13, color: "var(--uid-color-danger)" },
  { key: "total", label: "Total", value: 126, color: "var(--uid-color-primary)" },
];

const adPieData = [
  { name: "Approved", value: 95, color: "var(--uid-color-success)" },
  { name: "Pending", value: 18, color: "var(--uid-color-warning)" },
  { name: "Rejected", value: 13, color: "var(--uid-color-danger)" },
];

const loginHeatmapData = [
  {
    key: "morning",
    label: "Morning",
    range: "6 AM - 12 PM",
    logins: 2145,
    icon: "sun",
  },
  {
    key: "afternoon",
    label: "Afternoon",
    range: "12 PM - 5 PM",
    logins: 3210,
    icon: "cloud-sun",
  },
  {
    key: "evening",
    label: "Evening",
    range: "5 PM - 10 PM",
    logins: 5478,
    icon: "sunset",
  },
  {
    key: "night",
    label: "Night",
    range: "10 PM - 6 AM",
    logins: 1126,
    icon: "moon",
  },
];

const totalLogins = loginHeatmapData.reduce((sum, item) => sum + item.logins, 0);
const peakLoginKey = loginHeatmapData.reduce((max, item) =>
  item.logins > max.logins ? item : max
).key;

const engagementStats = [
  {
    key: "logins",
    label: "Average Login Per User",
    value: "6.2",
    description: "Average logins per user each month",
    icon: "login",
  },
  {
    key: "session",
    label: "Average Session Duration",
    value: "12 Minutes",
    description: "Average time spent per session",
    icon: "clock",
  },
  {
    key: "articles",
    label: "Average Articles Read",
    value: "14",
    description: "Articles read per active user",
    icon: "article",
  },
];

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG, no external icon library required)              */
/* ------------------------------------------------------------------ */

type IconProps = { className?: string };

const IconUsers: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c0-3.6 2.9-6.3 6.5-6.3s6.5 2.7 6.5 6.3" />
    <circle cx="17" cy="8.5" r="2.6" />
    <path d="M15.7 13.9c2.9.4 4.8 2.7 4.8 6.1" />
  </svg>
);

const IconActive: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 12h4l2.2 6L13 4l2 8h6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconGrowth: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconNewUser: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="10" cy="8" r="3.5" />
    <path d="M2.8 20c0-3.9 3.2-6.8 7.2-6.8" strokeLinecap="round" />
    <path d="M18 8v6M15 11h6" strokeLinecap="round" />
  </svg>
);

const IconAd: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="12" rx="2" />
    <path d="M7 20h10M9 17v3M15 17v3" strokeLinecap="round" />
    <path d="M6.5 13.5l3-3 2.5 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconReturning: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 12a9 9 0 1 1 3 6.7" strokeLinecap="round" />
    <path d="M3 17v-4h4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSun: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="4" />
    <path
      d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"
      strokeLinecap="round"
    />
  </svg>
);

const IconCloudSun: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="8" cy="8" r="2.6" />
    <path d="M8 3.2V2M4 5l-.9-.9M12 5l.9-.9M3.4 8H2" strokeLinecap="round" />
    <path d="M6.5 20h11a3.8 3.8 0 0 0 .5-7.6 5 5 0 0 0-9.6-1.5A4.3 4.3 0 0 0 6.5 20Z" />
  </svg>
);

const IconSunset: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 18h18M6 18a6 6 0 0 1 12 0" strokeLinecap="round" />
    <path d="M12 7v4M8.5 8.5l1.8 1.8M15.5 8.5l-1.8 1.8" strokeLinecap="round" />
    <path d="M2.5 21h19" strokeLinecap="round" />
  </svg>
);

const IconMoon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
  </svg>
);

const IconLogin: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M11 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" strokeLinecap="round" />
    <path d="M15 16l4-4-4-4M19 12H9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconClock: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArticle: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
  </svg>
);

const IconArrowUp: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const heatmapIconMap: Record<string, React.FC<IconProps>> = {
  sun: IconSun,
  "cloud-sun": IconCloudSun,
  sunset: IconSunset,
  moon: IconMoon,
};

const engagementIconMap: Record<string, React.FC<IconProps>> = {
  login: IconLogin,
  clock: IconClock,
  article: IconArticle,
};

/* ------------------------------------------------------------------ */
/*  Sub components                                                     */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: string;
  bottomText: string;
  icon: React.ReactNode;
  trendPositive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, bottomText, icon, trendPositive }) => (
  <div className="uid-stat-card">
    <div className="uid-stat-card__top">
      <span className="uid-stat-card__title">{title}</span>
      <span className="uid-stat-card__icon">{icon}</span>
    </div>
    <div className="uid-stat-card__value">{value}</div>
    <div className={`uid-stat-card__bottom ${trendPositive ? "uid-stat-card__bottom--positive" : ""}`}>
      {trendPositive && <IconArrowUp className="uid-stat-card__trend-icon" />}
      <span>{bottomText}</span>
    </div>
  </div>
);

const CustomChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="uid-chart-tooltip">
      <p className="uid-chart-tooltip__label">{label}</p>
      <p className="uid-chart-tooltip__value">{payload[0].value.toLocaleString()} users</p>
    </div>
  );
};

const CustomPieTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="uid-chart-tooltip">
      <p className="uid-chart-tooltip__label">{item.name}</p>
      <p className="uid-chart-tooltip__value">{item.value} requests</p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const UserInsights: React.FC = () => {
  const [graphMode, setGraphMode] = useState<"monthly" | "yearly">("monthly");

  const chartData = graphMode === "monthly" ? monthlyData : yearlyData;

  const pieDataWithPercent = useMemo(() => {
    const total = adPieData.reduce((sum, d) => sum + d.value, 0);
    return adPieData.map((d) => ({
      ...d,
      percent: Math.round((d.value / total) * 100),
    }));
  }, []);

  return (
    <div className="uid-dashboard">
      {/* ---------------------------------------------------------- */}
      {/* 1. Statistic Cards                                         */}
      {/* ---------------------------------------------------------- */}
      <section className="uid-section" aria-label="Statistics overview">
        <div className="uid-stats-grid">
          <StatCard
            title="Total Users"
            value="12,458"
            bottomText="+245 this month"
            icon={<IconUsers className="uid-icon" />}
            trendPositive
          />
          <StatCard
            title="Active Users"
            value="8,936"
            bottomText="72% Active"
            icon={<IconActive className="uid-icon" />}
          />
          <StatCard
            title="Growth Rate"
            value="+12.4%"
            bottomText="Compared to last month"
            icon={<IconGrowth className="uid-icon" />}
            trendPositive
          />
          <StatCard
            title="New Users"
            value="354"
            bottomText="Joined this month"
            icon={<IconNewUser className="uid-icon" />}
          />
          <StatCard
            title="Advertisement Requests"
            value="126"
            bottomText="18 Pending"
            icon={<IconAd className="uid-icon" />}
          />
          <StatCard
            title="Returning Users"
            value="68%"
            bottomText="Logged in multiple times"
            icon={<IconReturning className="uid-icon" />}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 2. User Growth Graph                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="uid-section" aria-label="User growth">
        <div className="uid-panel uid-graph-panel">
          <div className="uid-panel-header">
            <div>
              <h2 className="uid-panel-title">User Growth</h2>
              <p className="uid-panel-subtitle">Monthly and yearly user registration trend</p>
            </div>
            <div className="uid-toggle-group" role="tablist" aria-label="Graph range">
              <button
                type="button"
                role="tab"
                aria-selected={graphMode === "monthly"}
                className={`uid-toggle-btn ${graphMode === "monthly" ? "uid-toggle-btn--active" : ""}`}
                onClick={() => setGraphMode("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={graphMode === "yearly"}
                className={`uid-toggle-btn ${graphMode === "yearly" ? "uid-toggle-btn--active" : ""}`}
                onClick={() => setGraphMode("yearly")}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="uid-graph-container">
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="uidGrowthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--uid-color-primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--uid-color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--uid-color-border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--uid-color-text-muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--uid-color-border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--uid-color-text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: "var(--uid-color-primary)", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="var(--uid-color-primary)"
                  strokeWidth={3}
                  fill="url(#uidGrowthFill)"
                  activeDot={{ r: 6, fill: "var(--uid-color-primary)", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 3. Growth Rate Section                                     */}
      {/* ---------------------------------------------------------- */}
      <section className="uid-section" aria-label="Growth rate summary">
        <div className="uid-growth-rate-grid">
          {growthRateStats.map((stat) => (
            <div className="uid-growth-rate-card" key={stat.key}>
              <span className="uid-growth-rate-card__label">{stat.label}</span>
              <span className="uid-growth-rate-card__primary">{stat.primary}</span>
              {stat.secondary && (
                <span className="uid-growth-rate-card__secondary">{stat.secondary}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 4. Advertisement Request Analytics                         */}
      {/* ---------------------------------------------------------- */}
      <section className="uid-section" aria-label="Advertisement request analytics">
        <div className="uid-panel">
          <div className="uid-panel-header">
            <div>
              <h2 className="uid-panel-title">Advertisement Requests</h2>
              <p className="uid-panel-subtitle">Status breakdown of all submitted requests</p>
            </div>
          </div>

          <div className="uid-ad-summary-grid">
            {adRequestSummary.map((item) => (
              <div className="uid-ad-summary-card" key={item.key}>
                <span
                  className="uid-ad-summary-card__dot"
                  style={{ backgroundColor: item.color }}
                />
                <span className="uid-ad-summary-card__value">{item.value}</span>
                <span className="uid-ad-summary-card__label">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="uid-ad-pie-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieDataWithPercent}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={100}
                  paddingAngle={3}
                  label={({ percent }: any) => `${percent}%`}
                  labelLine={false}
                >
                  {pieDataWithPercent.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="var(--uid-color-surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="uid-pie-legend">
              {pieDataWithPercent.map((entry) => (
                <li className="uid-pie-legend__item" key={entry.name}>
                  <span className="uid-pie-legend__dot" style={{ backgroundColor: entry.color }} />
                  <span className="uid-pie-legend__label">{entry.name}</span>
                  <span className="uid-pie-legend__value">{entry.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 5. Login Activity Heatmap                                  */}
      {/* ---------------------------------------------------------- */}
      <section className="uid-section" aria-label="Login activity">
        <div className="uid-panel">
          <div className="uid-panel-header">
            <div>
              <h2 className="uid-panel-title">Login Activity</h2>
              <p className="uid-panel-subtitle">Most active login periods</p>
            </div>
          </div>

          <div className="uid-heatmap-grid">
            {loginHeatmapData.map((item) => {
              const HeatIcon = heatmapIconMap[item.icon];
              const percent = Math.round((item.logins / totalLogins) * 100);
              const isPeak = item.key === peakLoginKey;
              return (
                <div
                  className={`uid-heatmap-box ${isPeak ? "uid-heatmap-box--peak" : ""}`}
                  key={item.key}
                >
                  <span className="uid-heatmap-box__icon">
                    <HeatIcon className="uid-icon" />
                  </span>
                  <span className="uid-heatmap-box__title">{item.label}</span>
                  <span className="uid-heatmap-box__range">{item.range}</span>
                  <span className="uid-heatmap-box__count">{item.logins.toLocaleString()} Logins</span>
                  <span className="uid-heatmap-box__percent">{percent}% of total</span>
                  {isPeak && <span className="uid-heatmap-box__badge">Peak</span>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* 6. Engagement Analytics                                    */}
      {/* ---------------------------------------------------------- */}
      <section className="uid-section" aria-label="User engagement">
        <div className="uid-panel-header uid-panel-header--standalone">
          <div>
            <h2 className="uid-panel-title">User Engagement</h2>
          </div>
        </div>
        <div className="uid-engagement-grid">
          {engagementStats.map((item) => {
            const EngIcon = engagementIconMap[item.icon];
            return (
              <div className="uid-engagement-card" key={item.key}>
                <span className="uid-engagement-card__icon">
                  <EngIcon className="uid-icon" />
                </span>
                <span className="uid-engagement-card__value">{item.value}</span>
                <span className="uid-engagement-card__label">{item.label}</span>
                <span className="uid-engagement-card__description">{item.description}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default UserInsights;