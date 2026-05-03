import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2, CheckCircle } from "lucide-react";
import "./AboutUsAdmin.css";

// ─── TYPES ─────────────────────────────────────────────────────────
export interface Stat {
  id: string;
  label: string;
  value: string;
  visible: boolean;
}

export interface AboutUsData {
  heroVisible: boolean;
  heroTag: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;

  missionVisible: boolean;
  missionTitle: string;
  missionBody: string;

  visionVisible: boolean;
  visionTitle: string;
  visionBody: string;

  valuesVisible: boolean;
  valuesTitle: string;
  values: { id: string; icon: string; title: string; body: string; visible: boolean }[];

  statsVisible: boolean;
  stats: Stat[];
}

// ─── DEFAULTS ──────────────────────────────────────────────────────
const DEFAULT_DATA: AboutUsData = {
  heroVisible: true,
  heroTag: "Our Story",
  heroTitle: "Journalism That Matters.",
  heroSubtitle:
    "Local Newz was born from a simple belief: every community deserves honest, timely, and fearless reporting.",
  heroImage:
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1920",

  missionVisible: true,
  missionTitle: "Our Mission",
  missionBody:
    "We are committed to delivering accurate, unbiased, and impactful journalism that empowers citizens to make informed decisions. From your neighbourhood to the nation, we cover the stories that shape your world.",

  visionVisible: true,
  visionTitle: "Our Vision",
  visionBody:
    "To be India's most trusted digital news platform — where truth is non-negotiable, every voice finds space, and journalism serves democracy.",

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

const uid = () => Math.random().toString(36).slice(2, 8);

// ─── COMPONENT ─────────────────────────────────────────────────────
const AboutUsAdmin: React.FC = () => {
  const [data, setData] = useState<AboutUsData>(DEFAULT_DATA);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"hero" | "mission" | "values" | "stats">("hero");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("localNewzAboutData");
      if (stored) setData(JSON.parse(stored));
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem("localNewzAboutData", JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (patch: Partial<AboutUsData>) => setData(d => ({ ...d, ...patch }));

  // stat helpers
  const addStat = () => set({ stats: [...data.stats, { id: uid(), label: "", value: "", visible: true }] });
  const removeStat = (id: string) => set({ stats: data.stats.filter(s => s.id !== id) });
  const patchStat = (id: string, patch: Partial<Stat>) =>
    set({ stats: data.stats.map(s => (s.id === id ? { ...s, ...patch } : s)) });

  // value helpers
  const patchValue = (id: string, patch: any) =>
    set({ values: data.values.map(v => (v.id === id ? { ...v, ...patch } : v)) });

  const tabs = [
    { key: "hero",    label: "Hero Banner" },
    { key: "mission", label: "Mission & Vision" },
    { key: "values",  label: "Values" },
    { key: "stats",   label: "Stats" },
  ];

  return (
    <div className="au-admin">

      {/* ── Header ── */}
      <div className="au-admin-header">
        <div>
          <h1 className="au-admin-title">About Us Manager</h1>
          <p className="au-admin-sub">Control every element of your About Us page.</p>
        </div>
        <button className={`au-save-btn ${saved ? "saved" : ""}`} onClick={save}>
          {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="au-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`au-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="au-panel">

        {/* ═══════════ HERO ═══════════ */}
        {activeTab === "hero" && (
          <div className="au-section">
            <div className="au-section-header">
              <h2>Hero Banner</h2>
              <label className="au-toggle">
                <input type="checkbox" checked={data.heroVisible} onChange={e => set({ heroVisible: e.target.checked })} />
                <span className="au-toggle-track" />
                <span className="au-toggle-label">{data.heroVisible ? "Visible" : "Hidden"}</span>
              </label>
            </div>

            <div className="au-grid-2">
              <div className="au-field">
                <label>Tag Line (small text above title)</label>
                <input value={data.heroTag} onChange={e => set({ heroTag: e.target.value })} placeholder="e.g. Our Story" />
              </div>
              <div className="au-field">
                <label>Hero Image URL</label>
                <input value={data.heroImage} onChange={e => set({ heroImage: e.target.value })} placeholder="https://..." />
              </div>
            </div>

            <div className="au-field">
              <label>Hero Title</label>
              <input value={data.heroTitle} onChange={e => set({ heroTitle: e.target.value })} placeholder="Bold headline" />
            </div>
            <div className="au-field">
              <label>Hero Subtitle</label>
              <textarea rows={3} value={data.heroSubtitle} onChange={e => set({ heroSubtitle: e.target.value })} />
            </div>

            {data.heroImage && (
              <div className="au-preview-img">
                <img src={data.heroImage} alt="hero preview" />
                <span className="au-preview-label">Preview</span>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ MISSION & VISION ═══════════ */}
        {activeTab === "mission" && (
          <div className="au-section">
            <div className="au-section-header">
              <h2>Mission</h2>
              <label className="au-toggle">
                <input type="checkbox" checked={data.missionVisible} onChange={e => set({ missionVisible: e.target.checked })} />
                <span className="au-toggle-track" />
                <span className="au-toggle-label">{data.missionVisible ? "Visible" : "Hidden"}</span>
              </label>
            </div>
            <div className="au-field">
              <label>Title</label>
              <input value={data.missionTitle} onChange={e => set({ missionTitle: e.target.value })} />
            </div>
            <div className="au-field">
              <label>Body</label>
              <textarea rows={4} value={data.missionBody} onChange={e => set({ missionBody: e.target.value })} />
            </div>

            <div className="au-divider" />

            <div className="au-section-header">
              <h2>Vision</h2>
              <label className="au-toggle">
                <input type="checkbox" checked={data.visionVisible} onChange={e => set({ visionVisible: e.target.checked })} />
                <span className="au-toggle-track" />
                <span className="au-toggle-label">{data.visionVisible ? "Visible" : "Hidden"}</span>
              </label>
            </div>
            <div className="au-field">
              <label>Title</label>
              <input value={data.visionTitle} onChange={e => set({ visionTitle: e.target.value })} />
            </div>
            <div className="au-field">
              <label>Body</label>
              <textarea rows={4} value={data.visionBody} onChange={e => set({ visionBody: e.target.value })} />
            </div>
          </div>
        )}

        {/* ═══════════ VALUES ═══════════ */}
        {activeTab === "values" && (
          <div className="au-section">
            <div className="au-section-header">
              <h2>Values Section</h2>
              <label className="au-toggle">
                <input type="checkbox" checked={data.valuesVisible} onChange={e => set({ valuesVisible: e.target.checked })} />
                <span className="au-toggle-track" />
                <span className="au-toggle-label">{data.valuesVisible ? "Visible" : "Hidden"}</span>
              </label>
            </div>
            <div className="au-field">
              <label>Section Title</label>
              <input value={data.valuesTitle} onChange={e => set({ valuesTitle: e.target.value })} />
            </div>

            <div className="au-cards-grid">
              {data.values.map(v => (
                <div className={`au-value-card ${!v.visible ? "dimmed" : ""}`} key={v.id}>
                  <div className="au-card-top">
                    <div className="au-field au-field-sm">
                      <label>Icon (emoji)</label>
                      <input value={v.icon} onChange={e => patchValue(v.id, { icon: e.target.value })} style={{ width: 60 }} />
                    </div>
                    <label className="au-toggle au-toggle-sm">
                      <input type="checkbox" checked={v.visible} onChange={e => patchValue(v.id, { visible: e.target.checked })} />
                      <span className="au-toggle-track" />
                    </label>
                  </div>
                  <div className="au-field">
                    <label>Title</label>
                    <input value={v.title} onChange={e => patchValue(v.id, { title: e.target.value })} />
                  </div>
                  <div className="au-field">
                    <label>Description</label>
                    <textarea rows={2} value={v.body} onChange={e => patchValue(v.id, { body: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ STATS ═══════════ */}
        {activeTab === "stats" && (
          <div className="au-section">
            <div className="au-section-header">
              <h2>Statistics</h2>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label className="au-toggle">
                  <input type="checkbox" checked={data.statsVisible} onChange={e => set({ statsVisible: e.target.checked })} />
                  <span className="au-toggle-track" />
                  <span className="au-toggle-label">{data.statsVisible ? "Visible" : "Hidden"}</span>
                </label>
                <button className="au-add-btn" onClick={addStat}><Plus size={14} /> Add Stat</button>
              </div>
            </div>

            <div className="au-stats-list">
              {data.stats.map(s => (
                <div className={`au-stat-row ${!s.visible ? "dimmed" : ""}`} key={s.id}>
                  <div className="au-field au-field-grow">
                    <label>Value</label>
                    <input value={s.value} onChange={e => patchStat(s.id, { value: e.target.value })} placeholder="e.g. 2.4M+" />
                  </div>
                  <div className="au-field au-field-grow">
                    <label>Label</label>
                    <input value={s.label} onChange={e => patchStat(s.id, { label: e.target.value })} placeholder="e.g. Monthly Readers" />
                  </div>
                  <div className="au-row-actions">
                    <label className="au-toggle au-toggle-sm">
                      <input type="checkbox" checked={s.visible} onChange={e => patchStat(s.id, { visible: e.target.checked })} />
                      <span className="au-toggle-track" />
                    </label>
                    <button className="au-del-btn" onClick={() => removeStat(s.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Floating Save ── */}
      <button className={`au-float-save ${saved ? "saved" : ""}`} onClick={save}>
        {saved ? <CheckCircle size={18} /> : <Save size={18} />}
      </button>

    </div>
  );
};

export default AboutUsAdmin;