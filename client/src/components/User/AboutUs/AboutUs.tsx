import React, { useState, useEffect, useRef } from "react";
import "./AboutUs.css";

interface AboutUsData {
  heroVisible: boolean; heroTag: string; heroTitle: string; heroSubtitle: string; heroImage: string;
  missionVisible: boolean; missionTitle: string; missionBody: string;
  visionVisible: boolean; visionTitle: string; visionBody: string;
  valuesVisible: boolean; valuesTitle: string;
  values: { id: string; icon: string; title: string; body: string; visible: boolean }[];
  statsVisible: boolean;
  stats: { id: string; label: string; value: string; visible: boolean }[];
}

const DEFAULT_DATA: AboutUsData = {
  heroVisible: true,
  heroTag: "Our Story",
  heroTitle: "Journalism That Matters.",
  heroSubtitle: "Local Newz was born from a simple belief: every community deserves honest, timely, and fearless reporting.",
  heroImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1920",
  missionVisible: true,
  missionTitle: "Our Mission",
  missionBody: "We are committed to delivering accurate, unbiased, and impactful journalism that empowers citizens to make informed decisions. From your neighbourhood to the nation, we cover the stories that shape your world.",
  visionVisible: true,
  visionTitle: "Our Vision",
  visionBody: "To be India's most trusted digital news platform — where truth is non-negotiable, every voice finds space, and journalism serves democracy.",
  valuesVisible: true,
  valuesTitle: "What We Stand For",
  values: [
    { id: "v1", icon: "🎯", title: "Accuracy First", body: "Every fact is verified. Every claim is sourced. We never rush truth.", visible: true },
    { id: "v2", icon: "🛡️", title: "Independence", body: "No political or corporate allegiance. Our only loyalty is to the public.", visible: true },
    { id: "v3", icon: "🌍", title: "Inclusivity", body: "We represent every community, language, and perspective equally.", visible: true },
    { id: "v4", icon: "⚡", title: "Speed & Depth", body: "Breaking news fast, with the context that makes it meaningful.", visible: true },
  ],
  statsVisible: true,
  stats: [
    { id: "s1", label: "Monthly Readers", value: "2.4M+", visible: true },
    { id: "s2", label: "Stories Published", value: "18,000+", visible: true },
    { id: "s3", label: "Cities Covered", value: "340+", visible: true },
    { id: "s4", label: "Years of Trust", value: "5+", visible: true },
  ],
};

// ─── ANIMATED COUNTER ──────────────────────────────────────────────
const Counter: React.FC<{ value: string }> = ({ value }) => {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const observed = useRef(false);

  useEffect(() => {
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
    const suffix = value.replace(/[0-9.]/g, "");
    if (isNaN(numeric)) { setDisplay(value); return; }

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !observed.current) {
        observed.current = true;
        let start = 0;
        const steps = 60;
        const step = numeric / steps;
        const interval = setInterval(() => {
          start += step;
          if (start >= numeric) { setDisplay(value); clearInterval(interval); }
          else { setDisplay(Math.floor(start).toLocaleString() + suffix); }
        }, 20);
      }
    }, { threshold: 0.5 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{display}</span>;
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────
const AboutUs: React.FC = () => {
  const [data, setData] = useState<AboutUsData>(DEFAULT_DATA);

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem("localNewzAboutData");
        if (stored) setData(JSON.parse(stored));
      } catch {}
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const visibleValues = data.values.filter(v => v.visible);
  const visibleStats = data.stats.filter(s => s.visible);

  return (
    <main className="au-page">

      {/* ══════════ HERO ══════════ */}
      {data.heroVisible && (
        <section
          className="au-hero"
          style={data.heroImage ? { backgroundImage: `url(${data.heroImage})` } : {}}
        >
          <div className="au-hero-overlay" />
          <div className="au-hero-content">
            <div className="au-hero-tag">
              <span className="au-dot" />
              {data.heroTag}
            </div>
            <h1 className="au-hero-title">{data.heroTitle}</h1>
            <p className="au-hero-sub">{data.heroSubtitle}</p>
            <div className="au-hero-line" />
          </div>
        </section>
      )}

      {/* ══════════ STATS BAND ══════════ */}
      {data.statsVisible && visibleStats.length > 0 && (
        <section className="au-stats-band">
          <div className="au-container">
            <div className="au-stats-row">
              {visibleStats.map((s) => (
                <div className="au-stat-item" key={s.id}>
                  <span className="au-stat-value"><Counter value={s.value} /></span>
                  <span className="au-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ MISSION + VISION ══════════ */}
      {(data.missionVisible || data.visionVisible) && (
        <section className="au-mv-section">
          <div className="au-container">
            <div className="au-mv-grid">
              {data.missionVisible && (
                <div className="au-mv-card au-mission">
                  <div className="au-mv-icon">📰</div>
                  <h2 className="au-mv-title">{data.missionTitle}</h2>
                  <p className="au-mv-body">{data.missionBody}</p>
                </div>
              )}
              {data.visionVisible && (
                <div className="au-mv-card au-vision">
                  <div className="au-mv-icon">🔭</div>
                  <h2 className="au-mv-title">{data.visionTitle}</h2>
                  <p className="au-mv-body">{data.visionBody}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ VALUES ══════════ */}
      {data.valuesVisible && visibleValues.length > 0 && (
        <section className="au-values-section">
          <div className="au-container">
            <div className="au-section-label">
              <span className="au-label-line" />
              <span className="au-label-text">Core Principles</span>
              <span className="au-label-line" />
            </div>
            <h2 className="au-section-title">{data.valuesTitle}</h2>
            <div className="au-values-grid">
              {visibleValues.map((v, i) => (
                <div className="au-value-item" key={v.id} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="au-value-icon">{v.icon}</div>
                  <h3 className="au-value-title">{v.title}</h3>
                  <p className="au-value-body">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  );
};

export default AboutUs;