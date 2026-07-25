// src/pages/admin/Analytics.tsx
// Fully wired to live backend APIs + Socket.IO real-time visitor count.
// Drop-in replacement for the existing Analytics.tsx.

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { io, Socket } from "socket.io-client";
import "./Analytics.css";
import {
  fetchKPIs,
  fetchTrafficChart,
  fetchTrafficSources,
  fetchTopArticles,
  getExportUrl,
} from "../../../api/analytics";

// ─── Types ────────────────────────────────────────────────────
interface KPI {
  value:     number;
  formatted: string;
  pct:       string | null;
}

interface KPIData {
  totalViews:        KPI;
  uniqueVisitors:    KPI;
  articlesPublished: KPI;
  avgReadTime:       KPI;
}

interface ChartRow   { label: string; views: number; uniqueVisitors: number; }
interface Source     { label: string; key: string; pct: number; color: string; icon: string; }
interface Article    {
  rank: number; newsId: string; title: string;
  published: string | null; category: string;
  views: number; viewsFmt: string;
  engagement: string; trend: string; trendUp: boolean;
}

const RANGE_OPTIONS = [
  { label: "Last 7 days",  value: 7  },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

const SOCKET_URL = "http://localhost:5001";

// ─── Number formatter ─────────────────────────────────────────
const aaFmt = (v: number) =>
  v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M"
  : v >= 1000    ? Math.round(v / 1000) + "K"
  : String(v);

// ─── Custom Tooltip ───────────────────────────────────────────
const AaCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
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

// ─── SVG Icons ────────────────────────────────────────────────
const AaEyeIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const AaUsersIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const AaFileIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const AaClockIcon  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const AaGlobeIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const AaSearchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const AaShareIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const AaOtherIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
const AaTrendUpIcon= () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const AaExportIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const AaChartLineIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const AaPulseIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const AaWifiIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;

// ─── Skeleton loader ──────────────────────────────────────────
const Skeleton = ({ w = "100%", h = 28 }: { w?: string; h?: number }) => (
  <div style={{
    width: w, height: h, borderRadius: 6,
    background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
    backgroundSize: "200% 100%",
    animation: "aa-skeleton-shimmer 1.4s infinite",
  }} />
);

// ─── Main Component ───────────────────────────────────────────
const Analytics: React.FC = () => {
  const [range,        setRange]       = useState(7);
  const [dropOpen,     setDropOpen]    = useState(false);
  const [liveVisitors, setLiveVisitors] = useState<number | null>(null);

  // Data states
  const [kpis,         setKpis]        = useState<KPIData | null>(null);
  const [chart,        setChart]       = useState<ChartRow[]>([]);
  const [sources,      setSources]     = useState<Source[]>([]);
  const [articles,     setArticles]    = useState<Article[]>([]);
  const [totalSessions,setTotalSessions] = useState(0);

  // Loading / error
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const dropRef   = useRef<HTMLDivElement>(null);

  // ── Socket.IO for live visitors ─────────────────────────────
  useEffect(() => {
    const sock = io(SOCKET_URL, {
      withCredentials: true,
      query: { visitorId: "admin-" + Math.random().toString(36).slice(2) },
    });
    socketRef.current = sock;
    sock.on("live:visitors", (data: { count: number }) => setLiveVisitors(data.count));
    return () => { sock.disconnect(); };
  }, []);

  // ── Close dropdown on outside click ────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch all data when range changes ───────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiData, chartData, sourceData, articleData] = await Promise.all([
        fetchKPIs(range),
        fetchTrafficChart(range),
        fetchTrafficSources(range),
        fetchTopArticles(range, 10),
      ]);
      setKpis(kpiData);
      setChart(chartData.chart ?? []);
      setSources(Array.isArray(sourceData.sources) ? sourceData.sources : []);
      setTotalSessions(sourceData.total ?? 0);
      setArticles(articleData.articles ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Export ──────────────────────────────────────────────────
  const handleExport = () => {
    window.open(getExportUrl(range), "_blank");
  };

  // ── Render helpers ──────────────────────────────────────────
  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label ?? "Last 7 days";

  const pctColor = (pct: string | null) =>
    pct === null ? "#888" : Number(pct) >= 0 ? "#16a34a" : "#dc2626";

  const pctArrow = (pct: string | null) =>
    pct === null ? "" : Number(pct) >= 0 ? "↑" : "↓";

  const sourceIcon = (icon: string) => {
    if (icon === "globe")  return <AaGlobeIcon />;
    if (icon === "search") return <AaSearchIcon />;
    if (icon === "share")  return <AaShareIcon />;
    return <AaOtherIcon />;
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="aa-page">

      {/* ── SHIMMER KEYFRAME (injected once) ── */}
      <style>{`
        @keyframes aa-skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="aa-header">
        <div className="aa-header-left">
          <h1 className="aa-page-title">Analytics</h1>
          <p className="aa-live-badge">
            <span className="aa-live-dot" />
            {liveVisitors !== null
              ? <><AaWifiIcon /> <strong>{liveVisitors}</strong> live now — Updated just now</>
              : "Live — Connecting…"}
          </p>
        </div>

        <div className="aa-header-actions">
          {/* Range dropdown */}
          <div className="aa-dropdown" ref={dropRef}>
            <div className="aa-dropdown-selected" onClick={() => setDropOpen(!dropOpen)}>
              {rangeLabel}
              <span className={`aa-arrow ${dropOpen ? "aa-rotate" : ""}`}>▼</span>
            </div>
            {dropOpen && (
              <div className="aa-dropdown-menu">
                {RANGE_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className={`aa-dropdown-item ${range === opt.value ? "aa-selected" : ""}`}
                    onClick={() => { setRange(opt.value); setDropOpen(false); }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="aa-btn-export" onClick={handleExport} disabled={loading}>
            <AaExportIcon /> Export
          </button>
        </div>
      </div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "12px 16px", color: "#dc2626", fontSize: 14, marginBottom: 18,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>⚠ {error}</span>
          <button
            onClick={loadAll}
            style={{ background: "none", border: "1px solid #dc2626", borderRadius: 6,
              color: "#dc2626", padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── KPI CARDS ── */}
      <div className="aa-stat-grid">
        {/* Total Page Views */}
        <div className="aa-stat-card">
          <div className="aa-stat-top">
            <span className="aa-stat-label">TOTAL PAGE VIEWS</span>
            <span className="aa-stat-icon aa-stat-icon--blue"><AaEyeIcon /></span>
          </div>
          {loading ? <Skeleton h={32} /> : <p className="aa-stat-value">{kpis?.totalViews?.formatted ?? "—"}</p>}
          {loading ? <Skeleton w="60%" h={16} /> : (
            <p className="aa-stat-change" style={{ color: pctColor(kpis?.totalViews?.pct ?? null) }}>
              {pctArrow(kpis?.totalViews?.pct ?? null)} {kpis?.totalViews?.pct ? kpis.totalViews.pct + "%" : "No previous data"}
            </p>
          )}
        </div>

        {/* Unique Visitors */}
        <div className="aa-stat-card">
          <div className="aa-stat-top">
            <span className="aa-stat-label">UNIQUE VISITORS</span>
            <span className="aa-stat-icon aa-stat-icon--green"><AaUsersIcon /></span>
          </div>
          {loading ? <Skeleton h={32} /> : <p className="aa-stat-value">{kpis?.uniqueVisitors?.formatted ?? "—"}</p>}
          {loading ? <Skeleton w="60%" h={16} /> : (
            <p className="aa-stat-change" style={{ color: pctColor(kpis?.uniqueVisitors?.pct ?? null) }}>
              {pctArrow(kpis?.uniqueVisitors?.pct ?? null)} {kpis?.uniqueVisitors?.pct ? kpis.uniqueVisitors.pct + "%" : "No previous data"}
            </p>
          )}
        </div>

        {/* Articles Published */}
        <div className="aa-stat-card">
          <div className="aa-stat-top">
            <span className="aa-stat-label">ARTICLES PUBLISHED</span>
            <span className="aa-stat-icon aa-stat-icon--purple"><AaFileIcon /></span>
          </div>
          {loading ? <Skeleton h={32} /> : <p className="aa-stat-value">{kpis?.articlesPublished?.formatted ?? "—"}</p>}
          {loading ? <Skeleton w="60%" h={16} /> : (
            <p className="aa-stat-change" style={{ color: "#888" }}>in selected period</p>
          )}
        </div>

        {/* Avg Read Time */}
        <div className="aa-stat-card">
          <div className="aa-stat-top">
            <span className="aa-stat-label">AVG. READ TIME</span>
            <span className="aa-stat-icon aa-stat-icon--amber"><AaClockIcon /></span>
          </div>
          {loading ? <Skeleton h={32} /> : <p className="aa-stat-value">{kpis?.avgReadTime?.formatted ?? "—"}</p>}
          {loading ? <Skeleton w="60%" h={16} /> : (
            <p className="aa-stat-change" style={{ color: pctColor(kpis?.avgReadTime?.pct ?? null) }}>
              {pctArrow(kpis?.avgReadTime?.pct ?? null)} {kpis?.avgReadTime?.pct ? kpis.avgReadTime.pct + "%" : "No previous data"}
            </p>
          )}
        </div>
      </div>

      {/* ── TRAFFIC CHART ── */}
      <div className="aa-chart-card">
        <div className="aa-chart-header">
          <h2 className="aa-chart-title">Traffic Overview</h2>
          <p className="aa-chart-subtitle">Page views and unique visitors over time</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 220, padding: "0 8px" }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} w={`${100 / 7}%`} h={60 + Math.random() * 120} />
            ))}
          </div>
        ) : chart.length === 0 ? (
          <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 14 }}>
            No data for this period yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={aaFmt} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<AaCustomTooltip />} />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
              <Area type="monotone" dataKey="views"          name="Views"    stroke="#3b82f6" strokeWidth={2} fill="url(#aaViewsGrad)"    dot={false} />
              <Area type="monotone" dataKey="uniqueVisitors" name="Visitors" stroke="#22c55e" strokeWidth={2} fill="url(#aaVisitorsGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── BOTTOM GRID ── */}
      <div className="aa-bottom-grid">

        {/* Top Articles */}
        <div className="aa-table-card">
          <div className="aa-table-card-header">
            <span className="aa-table-card-icon"><AaChartLineIcon /></span>
            <h2 className="aa-table-card-title">Top Performing Articles</h2>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={22} />)}
            </div>
          ) : articles.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
              No article data yet for this period.
            </p>
          ) : (
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
                {articles.map((a) => (
                  <tr key={a.newsId} className="aa-article-row">
                    <td>
                      <div className="aa-td-article">
                        <span className="aa-article-rank">{a.rank}</span>
                        <span className="aa-article-title-text">{a.title}</span>
                      </div>
                    </td>
                    <td className="aa-td-right aa-td-views">{a.viewsFmt}</td>
                    <td className="aa-td-right aa-td-muted">{formatDate(a.published)}</td>
                    <td className="aa-td-right aa-td-muted">{a.engagement}</td>
                    <td className="aa-td-right">
                      <span className={`aa-trend-badge ${a.trendUp ? "aa-trend-up" : "aa-trend-down"}`}>
                        <AaTrendUpIcon /> {a.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="aa-sources-card">
          <div className="aa-table-card-header">
            <span className="aa-table-card-icon"><AaPulseIcon /></span>
            <h2 className="aa-table-card-title">Traffic Sources</h2>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} h={40} />)}
            </div>
          ) : sources.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
              No source data yet.
            </p>
          ) : (
            <>
              <div className="aa-sources-list">
                {sources.map((s) => (
                  <div key={s.key} className="aa-source-item">
                    <div className="aa-source-row">
                      <span className="aa-source-icon-wrap">{sourceIcon(s.icon)}</span>
                      <span className="aa-source-label">{s.label}</span>
                      <span className="aa-source-pct">{s.pct}%</span>
                    </div>
                    <div className="aa-source-bar-bg">
                      <div className="aa-source-bar-fill" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="aa-sources-footer">
                <span className="aa-sources-footer-label">Total sessions</span>
                <span className="aa-sources-footer-value">{aaFmt(totalSessions)}</span>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Analytics;