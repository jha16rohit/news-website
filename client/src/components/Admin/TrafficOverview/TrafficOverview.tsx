import { useState, useEffect, useCallback } from "react";
import "./TrafficOverview.css";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { RefreshCw, AlertCircle } from "lucide-react";
import { fetchTrafficChart } from "../../../api/analytics";

// ── Types ──────────────────────────────────────────────────────────────────
interface ChartPoint {
  time:     string;
  views:    number;
  visitors: number;
}

interface RawChartPoint {
  label:          string;   // "6 AM" / "Mon" / "Jan 1" depending on range
  views:          number;
  uniqueVisitors: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function normalize(raw: RawChartPoint): ChartPoint {
  return {
    time:     raw.label,
    views:    raw.views ?? 0,
    visitors: raw.uniqueVisitors ?? 0,
  };
}

function yFormatter(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${Math.round(value / 1_000)}K`;
  return String(value);
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="traffic-tooltip">
      <p className="traffic-tooltip-label">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === "views" ? "Views" : "Visitors"}: {yFormatter(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Skeleton ───────────────────────────────────────────────────────────────
const ChartSkeleton = () => (
  <div className="chart-skeleton">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="chart-skeleton-bar"
        style={{ height: `${30 + Math.random() * 55}%` }}
      />
    ))}
  </div>
);

// ── Range options ──────────────────────────────────────────────────────────
const RANGES = [
  { label: "Today",   value: 1  },
  { label: "7 days",  value: 7  },
  { label: "30 days", value: 30 },
];

// ── Component ──────────────────────────────────────────────────────────────
const TrafficOverview = () => {
  const [data,    setData]    = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [range,   setRange]   = useState(1);

  const load = useCallback(async (r: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTrafficChart(r);
      // Support { chart: [...] } or a bare array
      const raw: RawChartPoint[] = Array.isArray(res) ? res : (res.chart ?? res.data ?? []);
      setData(raw.map(normalize));
    } catch {
      setError("Could not load traffic data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  // Auto-refresh every 60 s when on Today view
  useEffect(() => {
    if (range !== 1) return;
    const id = setInterval(() => load(1), 60_000);
    return () => clearInterval(id);
  }, [range, load]);

  return (
    <div className="traffic-card">
      {/* HEADER */}
      <div className="traffic-header">
        <div>
          <h3>Traffic Overview</h3>
          <p>Page views and unique visitors</p>
        </div>

        <div className="traffic-header-right">
          {/* RANGE TABS */}
          <div className="traffic-range-tabs">
            {RANGES.map((r) => (
              <button
                key={r.value}
                className={`traffic-range-btn${range === r.value ? " traffic-range-btn--active" : ""}`}
                onClick={() => setRange(r.value)}
                disabled={loading}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* REFRESH */}
          <button
            className="traffic-refresh-btn"
            onClick={() => load(range)}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "tp-spinning" : ""} />
          </button>

          {/* LEGEND */}
          <div className="legend">
            <span className="views-dot">Views</span>
            <span className="visitors-dot">Visitors</span>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="chart-wrapper">
        {error ? (
          <div className="traffic-error">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => load(range)}>Retry</button>
          </div>
        ) : loading ? (
          <ChartSkeleton />
        ) : data.length === 0 ? (
          <p className="traffic-empty">No traffic data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tickFormatter={yFormatter} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#viewsGradient)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#22c55e"
                strokeWidth={2.5}
                fill="url(#visitorsGradient)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TrafficOverview;