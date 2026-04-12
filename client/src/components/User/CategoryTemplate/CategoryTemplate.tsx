import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Clock, Eye, ChevronRight, Cloud, Sun, CloudRain,
  Calendar, MapPin, Thermometer, TrendingUp, ArrowRight,
} from "lucide-react";
import { useNews } from "../../Admin/NewsStore/NewsStore";
import UserNavbar from "../UserNavbar/UserNavbar";
import "./CategoryTemplate.css";

// ─── Static placeholder data ──────────────────────────────────────────────────

const STATIC_ARTICLES = [
  {
    id: 1001,
    title: "Champions League Final: Historic Night Under the Lights",
    subtitle: "An electrifying finale saw two European giants battle for continental glory in a packed stadium that will be remembered for decades.",
    category: "Sports", published: "2 hours ago", views: "34.2K",
    img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80",
  },
  {
    id: 1002,
    title: "Slam Dunk Contest Sets New Viewership Record",
    subtitle: "The annual contest drew the highest ratings in a decade as athletes defied gravity.",
    category: "Sports", published: "3 hours ago", views: "18.1K",
    img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80",
  },
  {
    id: 1003,
    title: "World Swimming Championships Deliver Stunning Upsets",
    subtitle: "Defending champions fell as rising stars claimed gold in dramatic fashion.",
    category: "Sports", published: "5 hours ago", views: "12.4K",
    img: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&q=80",
  },
  {
    id: 1004,
    title: "Clay Court Season Opens With Dramatic Five-Set Thriller",
    subtitle: "Rain delays and a comeback for the ages made it one of the most watched opens in years.",
    category: "Sports", published: "6 hours ago", views: "9.8K",
    img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80",
  },
  {
    id: 1005,
    title: "India Clinches Historic Test Series Win Against Australia 3-1",
    subtitle: "A thrilling final day in Sydney saw India seal their greatest overseas triumph.",
    category: "Sports", published: "3 hours ago", views: "22.3K",
    img: "https://images.unsplash.com/photo-1540747913346-19212a4e3b4a?w=600&q=80",
  },
  {
    id: 1006,
    title: "Formula 1 Season Opener Ends in Chaotic Multi-Car Crash",
    subtitle: "Safety cars and red flags dominated as teams scramble to understand new regulations.",
    category: "Sports", published: "4 hours ago", views: "15.6K",
    img: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&q=80",
  },
  {
    id: 1007,
    title: "Rugby World Cup Hosts Announce Record Ticket Sales",
    subtitle: "Organisers report a sell-out across all group stages as global interest surges.",
    category: "Sports", published: "7 hours ago", views: "8.2K",
    img: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
  },
  {
    id: 1008,
    title: "Olympic Marathon Route Revealed for Summer Games",
    subtitle: "Athletes will tackle a challenging coastal course with significant elevation in the final 10km.",
    category: "Sports", published: "8 hours ago", views: "6.9K",
    img: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80",
  },
  {
    id: 1009,
    title: "Badminton Super Series: Local Hero Stuns World Number One",
    subtitle: "An underdog story for the ages as a wildcard dispatched the reigning champion in straight sets.",
    category: "Sports", published: "9 hours ago", views: "5.4K",
    img: "https://images.unsplash.com/photo-1599391398131-cd12dfc6e0b9?w=600&q=80",
  },
];

const RECENT_ITEMS = [
  { id: 1, title: "KKR vs SRH IPL 2026 Date, Live Streaming Details", date: "April 2, 2026" },
  { id: 2, title: "Raipur Stadium IPL 2026 Schedule Confirmed by BCCI", date: "March 27, 2026" },
  { id: 3, title: "IPL 2026 Schedule: Phase Two Dates Officially Announced", date: "March 27, 2026" },
  { id: 4, title: "Neeraj Chopra Targets Back-to-Back Olympic Javelin Gold", date: "March 26, 2026" },
  { id: 5, title: "Virat Kohli Becomes Leading Run-Scorer in IPL History", date: "March 25, 2026" },
];

const FORECAST = [
  { day: "Fri", icon: <Sun size={13} />, hi: 36, lo: 29 },
  { day: "Sat", icon: <Cloud size={13} />, hi: 38, lo: 30 },
  { day: "Sun", icon: <CloudRain size={13} />, hi: 34, lo: 27 },
  { day: "Mon", icon: <Sun size={13} />, hi: 40, lo: 31 },
  { day: "Tue", icon: <Sun size={13} />, hi: 41, lo: 30 },
];

// ─── Calendar helper ──────────────────────────────────────────────────────────

function buildCalendar() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: { day: number; cur: boolean }[] = [];
  for (let i = offset - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, cur: true });
  const rem = 42 - cells.length;
  for (let i = 1; i <= rem; i++) cells.push({ day: i, cur: false });
  return {
    cells, today,
    label: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Article = typeof STATIC_ARTICLES[0];

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroCard({ a, color }: { a: Article; color: string }) {
  return (
    <div className="ct-hero">
      <img src={a.img} alt={a.title} className="ct-hero__img" />
      <div className="ct-hero__overlay">
        <span className="ct-badge" style={{ background: color }}>{a.category}</span>
        <h2 className="ct-hero__title">{a.title}</h2>
        <p className="ct-hero__sub">{a.subtitle}</p>
        <div className="ct-meta"><Clock size={12} /><span>{a.published}</span></div>
      </div>
    </div>
  );
}

function StackCard({ a, color }: { a: Article; color: string }) {
  return (
    <div className="ct-stack">
      <img src={a.img} alt={a.title} className="ct-stack__img" />
      <div className="ct-stack__body">
        <span className="ct-badge ct-badge--sm" style={{ background: color }}>{a.category}</span>
        <p className="ct-stack__title">{a.title}</p>
        <div className="ct-meta"><Clock size={11} /><span>{a.published}</span></div>
      </div>
    </div>
  );
}

function GridCard({ a, color, delay = 0 }: { a: Article; color: string; delay?: number }) {
  return (
    <div className="ct-gcard" style={{ animationDelay: `${delay}ms` }}>
      <div className="ct-gcard__imgwrap">
        <img src={a.img} alt={a.title} className="ct-gcard__img" />
        <span className="ct-badge ct-badge--sm" style={{ background: color }}>{a.category}</span>
      </div>
      <div className="ct-gcard__body">
        <h4 className="ct-gcard__title">{a.title}</h4>
        <p className="ct-gcard__sub">{a.subtitle}</p>
        <div className="ct-meta">
          <Clock size={11} /><span>{a.published}</span>
          <Eye size={11} /><span>{a.views}</span>
        </div>
        <button className="ct-read-more" style={{ color }}>
          Read More <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

function WeatherWidget({ color }: { color: string }) {
  return (
    <div className="ct-weather" style={{ background: color }}>
      <div className="ct-weather__head">
        <Cloud size={13} /><span>Weather</span>
        <MapPin size={11} /><span>India</span>
      </div>
      <div className="ct-weather__main">
        <Thermometer size={28} />
        <div>
          <div className="ct-weather__temp">27<sup>°C</sup></div>
          <div className="ct-weather__label">Clear Sky</div>
        </div>
      </div>
      <div className="ct-weather__forecast">
        {FORECAST.map((f) => (
          <div key={f.day} className="ct-weather__day">
            <span className="ct-weather__dname">{f.day}</span>
            <span className="ct-weather__icon">{f.icon}</span>
            <span className="ct-weather__hi">{f.hi}°</span>
            <span className="ct-weather__lo">{f.lo}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarWidget() {
  const { cells, today, label } = buildCalendar();
  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="ct-cal">
      <div className="ct-cal__head"><Calendar size={13} /><span>{label}</span></div>
      <div className="ct-cal__row ct-cal__row--hdr">
        {DAYS.map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="ct-cal__row ct-cal__row--body">
        {cells.map((c, i) => (
          <span
            key={i}
            className={[
              "ct-cal__cell",
              !c.cur ? "ct-cal__cell--dim" : "",
              c.cur && c.day === today ? "ct-cal__cell--today" : "",
            ].filter(Boolean).join(" ")}
          >
            {c.day}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 6;
const LOAD_MORE_COUNT = 3;

export default function CategoryTemplate() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, articles: storeArticles } = useNews();

  // 6 visible initially, becomes 9 after Show More
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [expanded, setExpanded] = useState(false);

  const category = categories.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === slug
  );

  const color = category?.color ?? "#e63946";

  // Prefer real store articles, fall back to static
  const storeFiltered = storeArticles.filter(
    (a) => a.category.toLowerCase() === (category?.name ?? "").toLowerCase()
  );
  const source: Article[] = storeFiltered.length > 0
    ? storeFiltered.map((a) => ({ ...a, img: "" }))
    : STATIC_ARTICLES;

  // Layout split: hero[0], stacks[1-3], grid[4-12]
  const hero    = source[0];
  const stacks  = source.slice(1, 4);
  const allGrid = source.slice(4); // up to 9 grid articles from STATIC (indices 4-12)
  const grid    = allGrid.slice(0, visible);

  // Show More is only available once (6 → 9), after that show "View All"
  const canShowMore = !expanded && visible < allGrid.length;

  function handleShowMore() {
    setVisible((v) => Math.min(v + LOAD_MORE_COUNT, allGrid.length));
    setExpanded(true);
  }

  if (!category) {
    return (
      <>
        <UserNavbar />
        <div className="ct-notfound">
          <TrendingUp size={40} />
          <h2>Category not found</h2>
          <Link to="/">Return to Home</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <UserNavbar />
      <div className="ct-root">

        {/* ── Hero Section ─────────────────────────────── */}
        <section className="ct-section">
          <div className="ct-wrap">
            <div className="ct-hero-layout">

              {/* Left: large hero + 3 stacked */}
              <div className="ct-hero-left">
                {hero && <HeroCard a={hero} color={color} />}
                <div className="ct-stacks">
                  {stacks.map((a) => <StackCard key={a.id} a={a} color={color} />)}
                </div>
              </div>

              {/* Right: Recent News panel */}
              <aside className="ct-recent-panel">
                <div className="ct-panel-title">
                  Recent News
                  <div className="ct-panel-line" style={{ background: color }} />
                </div>
                <ul className="ct-recent-list">
                  {RECENT_ITEMS.map((item) => (
                    <li key={item.id} className="ct-recent-item">
                      <ChevronRight size={13} style={{ color, flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p className="ct-recent-title">{item.title}</p>
                        <span className="ct-recent-date">{item.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Latest News Section ──────────────────────── */}
        <section className="ct-section ct-section--gray">
          <div className="ct-wrap">

            <div className="ct-news-head">
              <h2 className="ct-news-title">Latest News</h2>
              <div className="ct-news-line" style={{ background: color }} />
            </div>

            <div className="ct-news-layout">

              {/* Sticky sidebar: weather + calendar */}
              <aside className="ct-news-sidebar">
                <WeatherWidget color={color} />
                <CalendarWidget />
              </aside>

              {/* Grid + actions */}
              <div className="ct-news-main">
                <div className="ct-grid">
                  {grid.map((a, i) => (
                    <GridCard
                      key={a.id}
                      a={a}
                      color={color}
                      // Only animate the newly revealed 3 cards
                      delay={i >= INITIAL_VISIBLE ? (i - INITIAL_VISIBLE) * 80 : 0}
                    />
                  ))}
                </div>

                <div className="ct-actions">
                  {canShowMore && (
                    <button
                      className="ct-btn-solid"
                      style={{ background: color }}
                      onClick={handleShowMore}
                    >
                      Show More
                    </button>
                  )}
                  <button
                    className="ct-btn-outline"
                    style={{ borderColor: color, color }}
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Advertisement ─────────────────────────────── */}
        <section className="ct-section">
          <div className="ct-wrap">
            <div className="ct-ad">
              <span className="ct-ad-label">Advertisement</span>
              <div className="ct-ad-banner" />
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────── */}
        <footer className="ct-footer">
          <div className="ct-footer-inner">
            <div className="ct-footer-brand">
              <div className="ct-footer-logo">LocalNewz</div>
              <p>India's trusted source for breaking news, in-depth analysis, and comprehensive coverage of events that matter to you.</p>
            </div>
            <div className="ct-footer-col">
              <h5>Categories</h5>
              {categories.filter((c) => c.enabled).map((c) => (
                <Link key={c.id} to={`/category/${c.name.toLowerCase().replace(/\s+/g, "-")}`}>{c.name}</Link>
              ))}
            </div>
            <div className="ct-footer-col">
              <h5>Quick Links</h5>
              <Link to="/">Recent News</Link>
              <Link to="/">Trending</Link>
              <Link to="/Topic">Topic</Link>
              <Link to="/live-events">Live Coverage</Link>
              <Link to="/">Videos</Link>
              <Link to="/">Photo Gallery</Link>
            </div>
            <div className="ct-footer-col">
              <h5>Company</h5>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
          <div className="ct-footer-copy">
            © {new Date().getFullYear()} LocalNewz. All rights reserved. Made with love in India.
          </div>
        </footer>

      </div>
    </>
  );
}