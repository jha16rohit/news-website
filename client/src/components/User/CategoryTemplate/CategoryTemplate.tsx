import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Clock, Eye, ChevronRight, Cloud, Sun, CloudRain,
  Calendar, MapPin, Thermometer, TrendingUp, ArrowRight
} from "lucide-react";
import { useNews } from "../../Admin/NewsStore/NewsStore";
import UserNavbar from "../UserNavbar/UserNavbar";
import "./CategoryTemplate.css";
import Advertisement from "../Advertisment/Advertisment";
import UserFooter from "../UserFooter/UserFooter";
import SubCategoryTemplate from "../SubCategoryTemplate/SubCategoryTemplate";

// ─── Static placeholder data ──────────────────────────────────────────────────
const STATIC_ARTICLES = [
  { id: 1001, title: "Champions League Final: Historic Night Under the Lights", subtitle: "An electrifying finale saw two European giants battle for continental glory in a packed stadium that will be remembered for decades.", category: "Sports", published: "2 hours ago", views: "34.2K", img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80" },
  { id: 1002, title: "Slam Dunk Contest Sets New Viewership Record", subtitle: "The annual contest drew the highest ratings in a decade as athletes defied gravity.", category: "Sports", published: "3 hours ago", views: "18.1K", img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80" },
  { id: 1003, title: "World Swimming Championships Deliver Stunning Upsets", subtitle: "Defending champions fell as rising stars claimed gold in dramatic fashion.", category: "Sports", published: "5 hours ago", views: "12.4K", img: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&q=80" },
  { id: 1004, title: "Clay Court Season Opens With Dramatic Five-Set Thriller", subtitle: "Rain delays and a comeback for the ages made it one of the most watched opens in years.", category: "Sports", published: "6 hours ago", views: "9.8K", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80" },
  { id: 1005, title: "India Clinches Historic Test Series Win Against Australia 3-1", subtitle: "A thrilling final day in Sydney saw India seal their greatest overseas triumph.", category: "Sports", published: "3 hours ago", views: "22.3K", img: "https://images.unsplash.com/photo-1540747913346-19212a4e3b4a?w=600&q=80" },
  { id: 1006, title: "Formula 1 Season Opener Ends in Chaotic Multi-Car Crash", subtitle: "Safety cars and red flags dominated as teams scramble to understand new regulations.", category: "Sports", published: "4 hours ago", views: "15.6K", img: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&q=80" },
  { id: 1007, title: "Rugby World Cup Hosts Announce Record Ticket Sales", subtitle: "Organisers report a sell-out across all group stages as global interest surges.", category: "Sports", published: "7 hours ago", views: "8.2K", img: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80" },
  { id: 1008, title: "Olympic Marathon Route Revealed for Summer Games", subtitle: "Athletes will tackle a challenging coastal course with significant elevation in the final 10km.", category: "Sports", published: "8 hours ago", views: "6.9K", img: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80" },
  { id: 1009, title: "Badminton Super Series: Local Hero Stuns World Number One", subtitle: "An underdog story for the ages as a wildcard dispatched the reigning champion in straight sets.", category: "Sports", published: "9 hours ago", views: "5.4K", img: "https://images.unsplash.com/photo-1599391398131-cd12dfc6e0b9?w=600&q=80" },
  { id: 1010, title: "Tennis Legend Announces Retirement After Glorious Career", subtitle: "Fans around the world bid farewell to a player who defined an era with grace and unparalleled skill.", category: "Sports", published: "10 hours ago", views: "20.1K", img: "https://images.unsplash.com/photo-1508264165352-258a9bfc09c4?w=600&q=80" },
  { id: 1011, title: "NBA Finals MVP Delivers Emotional Speech Amidst Championship Glory", subtitle: "Tears and triumph as the star player reflects on the journey to the title and thanks fans worldwide.", category: "Sports", published: "11 hours ago", views: "25.3K", img: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80" },
];

const RECENT_ITEMS = [
  { id: 1, title: "KKR vs SRH IPL 2026 Date, Live Streaming Details", date: "April 2, 2026" },
  { id: 2, title: "Raipur Stadium IPL 2026 Schedule Confirmed by BCCI", date: "March 27, 2026" },
  { id: 3, title: "IPL 2026 Schedule: Phase Two Dates Officially Announced", date: "March 27, 2026" },
  { id: 4, title: "Neeraj Chopra Targets Back-to-Back Olympic Javelin Gold", date: "March 26, 2026" },
  { id: 5, title: "Virat Kohli Becomes Leading Run-Scorer in IPL History", date: "March 25, 2026" },
];

const FORECAST = [
  { day: "Fri", icon: <Sun size={14} />, hi: 36, lo: 29 },
  { day: "Sat", icon: <Cloud size={14} />, hi: 38, lo: 30 },
  { day: "Sun", icon: <CloudRain size={14} />, hi: 34, lo: 27 },
  { day: "Mon", icon: <Sun size={14} />, hi: 40, lo: 31 },
  { day: "Tue", icon: <Sun size={14} />, hi: 41, lo: 30 },
];

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
  return { cells, today, label: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }) };
}

type Article = typeof STATIC_ARTICLES[0];

interface CardProps {
  a: Article;
  color: string;
  delay?: number;
}

function HeroCard({ a, color }: CardProps) {
  return (
    <Link to={`/article/${a.id}`} className="ct-hero" style={{ textDecoration: "none", color: "inherit" }}>
      <img src={a.img} alt={a.title} className="ct-hero__img" />
      <div className="ct-hero__overlay">
        <span className="ct-badge" style={{ background: color }}>{a.category}</span>
        <h2 className="ct-hero__title">{a.title}</h2>
        <p className="ct-hero__sub">{a.subtitle}</p>
        <div className="ct-meta"><Clock size={14} /><span>{a.published}</span></div>
      </div>
    </Link>
  );
}

function StackCard({ a, color }: CardProps) {
  return (
    <Link to={`/article/${a.id}`} className="ct-stack" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="ct-stack__imgwrap">
        <img src={a.img} alt={a.title} className="ct-stack__img" />
      </div>
      <div className="ct-stack__body">
        <span className="ct-badge ct-badge--text" style={{ color: color }}>{a.category}</span>
        <p className="ct-stack__title">{a.title}</p>
        <div className="ct-meta"><Clock size={12} /><span>{a.published}</span></div>
      </div>
    </Link>
  );
}

function GridCard({ a, color, delay = 0 }: CardProps) {
  return (
    <Link to={`/article/${a.id}`} className="ct-gcard" style={{ animationDelay: `${delay}ms`, textDecoration: "none", color: "inherit", display: "flex" }}>
      <div className="ct-gcard__imgwrap">
        <img src={a.img} alt={a.title} className="ct-gcard__img" />
        <span className="ct-badge ct-badge--sm" style={{ background: color }}>{a.category}</span>
      </div>
      <div className="ct-gcard__body">
        <h4 className="ct-gcard__title">{a.title}</h4>
        <p className="ct-gcard__sub">{a.subtitle}</p>
        <div className="ct-meta-row">
          <div className="ct-meta">
            <Clock size={12} /><span>{a.published}</span>
            <Eye size={12} style={{marginLeft: '8px'}} /><span>{a.views}</span>
          </div>
          <span className="ct-read-more" style={{ color }}>
            Read More <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function WeatherWidget({ color }: { color: string }) {
  return (
    <div className="ct-weather" style={{ background: `linear-gradient(135deg, ${color} 0%, #1a1a2e 100%)` }}>
      <div className="ct-weather__head">
        <div className="ct-weather__head-left"><Cloud size={16} /><span>Weather</span></div>
        <div className="ct-weather__head-right"><MapPin size={12} /><span>India</span></div>
      </div>
      <div className="ct-weather__main">
        <Thermometer size={36} />
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
            <div className="ct-weather__hilow">
              <span className="ct-weather__hi">{f.hi}°</span>
              <span className="ct-weather__lo">{f.lo}°</span>
            </div>
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
      <div className="ct-cal__head"><Calendar size={15} /><span>{label}</span></div>
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

const INITIAL_VISIBLE = 6;
const LOAD_MORE_COUNT = 3;

export default function CategoryTemplate() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, articles: storeArticles } = useNews();

  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const category = categories.find((c) => c.name.toLowerCase().replace(/\s+/g, "-") === slug);
  
  const parentCategory = category?.parentId 
    ? categories.find((c) => c.id === category.parentId) ?? null
    : null;

  const color = "#e60000";

  const storeFiltered = storeArticles.filter((a) => a.category.toLowerCase() === (category?.name ?? "").toLowerCase());
  
  const source: Article[] = storeFiltered.length > 0 
    ? storeFiltered.map((a) => ({ ...a, img: "" })) 
    : STATIC_ARTICLES.map((a) => ({ ...a, category: category?.name || "News" }));

  const hero    = source[0];
  const stacks  = source.slice(1, 4);
  const allGrid = source.slice(4);
  const grid    = allGrid.slice(0, visible);
  
  const canShowMore = visible < allGrid.length;
  const canShowLess = visible > INITIAL_VISIBLE;

  if (category && category.parentId) {
    return <SubCategoryTemplate category={category} parentCategory={parentCategory} color={color} />;
  }

  function handleShowMore() {
    setVisible((v) => Math.min(v + LOAD_MORE_COUNT, allGrid.length));
  }

  function handleShowLess() {
    setVisible(INITIAL_VISIBLE);
  }

  if (!category) {
    return (
      <>
        <UserNavbar />
        <div className="ct-notfound">
          <TrendingUp size={48} color="#ccc" />
          <h2>Category not found</h2>
          <Link to="/">Return to Home</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <UserNavbar />
      <div className="ct-root" style={{ "--cat-color": color } as React.CSSProperties}>

        {/* ── TOP SECTION: Hero + Stacks LEFT | Recent News RIGHT ── */}
        <section className="ct-section ct-section--top">
          <div className="ct-wrap">
            <div className="ct-hero-layout">
              <div className="ct-hero-left">
                {hero && <HeroCard a={hero} color={color} />}
                <div className="ct-stacks">
                  {stacks.map((a) => <StackCard key={a.id} a={a} color={color} />)}
                </div>
              </div>

              <aside className="ct-recent-panel">
                <div className="ct-panel-title">
                  Recent News
                  <div className="ct-panel-line" style={{ background: color }} />
                </div>
                <ul className="ct-recent-list">
                  {RECENT_ITEMS.map((item) => (
                    <li key={item.id} className="ct-recent-item">
                      <div className="ct-recent-icon"><ChevronRight size={14} style={{ color }} /></div>
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

        {/* ── LATEST NEWS: Grid cards LEFT | Weather + Calendar RIGHT ── */}
        <section className="ct-section ct-section--gray">
          <div className="ct-wrap">
            <div className="ct-news-head">
              <h2 className="ct-news-title">Latest News</h2>
              <div className="ct-news-line" style={{ background: color }} />
            </div>

            {/* KEY FIX: ct-news-main comes FIRST in DOM = LEFT side
                        ct-news-sidebar comes SECOND in DOM = RIGHT side */}
            <div className="ct-news-layout">

              <div className="ct-news-main">
                <div className="ct-grid">
                  {grid.map((a, i) => (
                    <GridCard
                      key={a.id}
                      a={a}
                      color={color}
                      delay={i >= INITIAL_VISIBLE ? (i - INITIAL_VISIBLE) * 80 : 0}
                    />
                  ))}
                </div>

                <div className="ct-actions">
                  {canShowMore && (
                    <button className="ct-btn-solid" style={{ background: color }} onClick={handleShowMore}>
                      Show More
                    </button>
                  )}
                  {canShowLess && (
                    <button className="ct-btn-outline" style={{ borderColor: color, color }} onClick={handleShowLess}>
                      Show Less
                    </button>
                  )}
                </div>
              </div>

              <aside className="ct-news-sidebar">
                <WeatherWidget color={color} />
                <CalendarWidget />
              </aside>

            </div>
          </div>
        </section>

        <Advertisement page={slug || "home"} />
        <UserFooter />

      </div>
    </>
  );
}