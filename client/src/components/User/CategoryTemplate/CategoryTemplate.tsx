import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Clock,
  Eye,
  ChevronRight,
  Cloud,
  Sun,
  CloudRain,
  Calendar,
  MapPin,
  Thermometer,
  ArrowRight
} from "lucide-react";
import { useCategories } from "../../../hooks/useCategories";

import "./CategoryTemplate.css";
import Advertisement from "../Advertisment/Advertisment";
import SubCategoryTemplate from "../SubCategoryTemplate/SubCategoryTemplate";
import { getCategoryNews } from "../../../api/user/categoryNews";
import {
  getWeather,
  getCityName,
  type WeatherData,
} from "../../../api/user/weather";
import Preloader from "../../Admin/Preloader/Preloder";

import { getRecentNews } from "../../../api/user/recentNews";
import { getAdvertisementPool, type Advertisement as AdType } from "../../../api/user/advertisementPool";


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

interface Article {
  id: string | number;
  title: string;
  subtitle: string;
  category: string;
  published: string;
  views: string;
  img: string;
}

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

function StackCard({ a }: CardProps) {
  return (
    <Link to={`/article/${a.id}`} className="ct-stack" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="ct-stack__imgwrap">
        <img src={a.img} alt={a.title} className="ct-stack__img" />
      </div>
      <div className="ct-stack__body">
        <span className="ct-badge">{a.category}</span>
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

function WeatherWidget({
  color,
  weather,
  loading,
  locationAllowed,
}: {
  color: string;
  weather: WeatherData | null;
  loading: boolean;
  locationAllowed: boolean;
}) {
  const getIcon = (icon: string) => {
    switch (icon) {
      case "sun":
        return <Sun size={14} />;

      case "rain":
        return <CloudRain size={14} />;

      case "storm":
        return <CloudRain size={14} />;

      default:
        return <Cloud size={14} />;
    }
  };

  if (loading) {
    return (
      <div
        className="ct-weather"
        style={{
          background: `linear-gradient(
            135deg,
            ${color} 0%,
            #1a1a2e 100%
          )`,
        }}
      >
        <div className="ct-weather__head">
          <div className="ct-weather__head-left">
            <Cloud size={16} />
            <span>Weather</span>
          </div>
        </div>

        <div className="ct-weather__main">
          <div>
            <div className="ct-weather__label">
              Loading weather...
            </div>
          </div>
        </div>
      </div>
    );
  }

if (!weather) {
  return (
    <div
      className="ct-weather"
      style={{
        background: `linear-gradient(
          135deg,
          ${color} 0%,
          #1a1a2e 100%
        )`,
      }}
    >
      <div className="ct-weather__head">
        <div className="ct-weather__head-left">
          <Cloud size={16} />
          <span>Weather</span>
        </div>

        <div className="ct-weather__head-right">
          <MapPin size={12} />
          <span>India</span>
        </div>
      </div>

      <div className="ct-weather__main">
        <div>
          <div className="ct-weather__label">
            Location not available
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div
      className="ct-weather"
      style={{
        background: `linear-gradient(
          135deg,
          ${color} 0%,
          #1a1a2e 100%
        )`,
      }}
    >
      {/* Header */}
      <div className="ct-weather__head">
        <div className="ct-weather__head-left">
          <Cloud size={16} />
          <span>Weather</span>
        </div>

        <div className="ct-weather__head-right">
          <MapPin size={12} />
          <span>
  {locationAllowed && weather
    ? weather.location
    : "India"}
</span>
        </div>
      </div>

      {/* Current Weather */}
      <div className="ct-weather__main">
        <Thermometer size={36} />

        <div>
          <div className="ct-weather__temp">
            {weather.temperature}
            <sup>°C</sup>
          </div>

          <div className="ct-weather__label">
            {weather.condition}
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="ct-weather__forecast">
        {weather.forecast.map((day) => (
          <div
            key={day.day}
            className="ct-weather__day"
          >
            <span className="ct-weather__dname">
              {day.day}
            </span>

            <span className="ct-weather__icon">
              {getIcon(day.icon)}
            </span>

            <div className="ct-weather__hilow">
              <span className="ct-weather__hi">
                {day.high}°
              </span>

              <span className="ct-weather__lo">
                {day.low}°
              </span>
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
        {DAYS.map((d, i) => <span key={`cal-day-${i}`}>{d}</span>)}
      </div>
      <div className="ct-cal__row ct-cal__row--body">
        {cells.map((c, i) => (
          <span
            key={`cal-cell-${i}`}
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
  const { categories } = useCategories();

  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const [categoryNews, setCategoryNews] = useState<any[]>([]);
  const [recentNews, setRecentNews] = useState<any[]>([]);  
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
const [weatherLoading, setWeatherLoading] = useState(true);
const [locationAllowed, setLocationAllowed] = useState(false);

  const [ads, setAds] = useState<{
    cards: AdType[];
    strips: AdType[];
  }>({
    cards: [],
    strips: [],
  });  

  const category = categories.find(
    (c) => c.slug === slug
  );
  
  const parentCategory = category?.parentId 
    ? categories.find((c) => c.id === category.parentId) ?? null
    : null;

  const color = "#e60000";

const fetchWeather = async () => {
  try {
    setWeatherLoading(true);

    // ------------------------------------
    // 1. Load Delhi weather immediately
    // ------------------------------------
    const delhiWeather = await getWeather(
      28.6139,
      77.2090,
      "Delhi"
    );

    setWeather(delhiWeather);

    // ------------------------------------
    // 2. Delhi weather is ready
    //    Page can continue loading
    // ------------------------------------
    setWeatherLoading(false);

    // ------------------------------------
    // 3. Try to get user's precise location
    //    This happens in background
    // ------------------------------------
    if (!navigator.geolocation) {
      setLocationAllowed(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setLocationAllowed(true);

          const { latitude, longitude } = position.coords;

          // Get actual city
          const city = await getCityName(
            latitude,
            longitude
          );

          // Get exact weather
          const preciseWeather = await getWeather(
            latitude,
            longitude,
            city
          );

          // Replace Delhi weather
          setWeather(preciseWeather);

        } catch (error) {
          console.error(
            "Precise weather error:",
            error
          );

          // Keep Delhi weather if precise location fails
        }
      },

      // User denied location
      () => {
        setLocationAllowed(false);

        // Keep Delhi weather
        // Do NOT set weather to null
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

  } catch (error) {
    console.error("Weather error:", error);

    setWeatherLoading(false);
  }
};

  useEffect(() => {
    fetchWeather();
    async function fetchNews() {
      try {
        setLoading(true);

        const data = await getCategoryNews(slug!);

        if (data.success) {
          setCategoryNews(data.news || []);
          const recent = await getRecentNews();

          if (recent.success) {
            setRecentNews(recent.news || []);
          }

          // Load advertisements
          const adResponse = await getAdvertisementPool({
            cards: 1,
            strips: 2,
          });

          // Safely set ads array to guarantee UI always renders
          setAds({
            cards: adResponse?.cards || [],
            strips: adResponse?.strips || []
          });
        }

      } catch (error) {
        console.error("Category news fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchNews();
    }

  }, [slug]);

  const source: Article[] = categoryNews.map((a: any) => ({
    id: a._id,
    title:  a.headline,
    subtitle: a.excerpt || "Read full article for more details.",
    category: a.categoryName || category?.name || "News",
    published: a.publishedAt
      ? new Date(a.publishedAt).toLocaleDateString()
      : "Recently",
    views: String(a.views || 0),
    img: a.featuredImage ,
  }));

  const hero = source[0];
  const stacks = source.slice(1, 5); 

  const allGrid = [...source].sort(() => Math.random() - 0.5);
  const grid = allGrid.slice(0, visible);

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

  if (loading) {
    return (
      <>
        <Preloader />
      </>
    );
  }

  return (
    <>
      <div className="ct-root" style={{ "--cat-color": color } as React.CSSProperties}>

        {/* ── TOP SECTION: Hero + Stacks LEFT | Recent News RIGHT ── */}
        <section className="ct-section ct-section--top">
          <div className="ct-wrap">
            <div className="ct-hero-layout">
              <div className="ct-hero-left">
                {hero && <HeroCard a={hero} color={color} />}
                <div className="ct-stacks">
                  {stacks.map((a) => <StackCard key={`stack-${a.id}`} a={a} color={color} />)}
                </div>
              </div>

              <aside className="ct-recent-panel">
                <div className="ct-panel-title">
                  Recent News
                  <div className="ct-panel-line" style={{ background: color }} />
                </div>
                <ul className="ct-recent-list">
  {recentNews.slice(0, 6).map((item, index) => (
    <li key={`recent-${item.id ?? item._id ?? index}`}>
      <Link
        to={`/article/${item.slug || item._id || item.id}`}
        className="ct-recent-item"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div className="ct-recent-icon">
          <ChevronRight size={14} style={{ color }} />
        </div>

        <div>
          <p className="ct-recent-title">
            {item.shortTitle || item.headline}
          </p>

          <span className="ct-recent-date">
            {item.publishedAt
              ? new Date(item.publishedAt).toLocaleDateString()
              : "Recently"}
          </span>
        </div>
      </Link>
    </li>
  ))}
</ul>
              </aside>
            </div>
          </div>
        </section>
        
        <Advertisement adData={ads.strips[0] ?? null} />

        {/* ── LATEST NEWS: Grid cards LEFT | Weather + Calendar RIGHT ── */}
        <section className="ct-section ct-section--gray">
          <div className="ct-wrap">
            <div className="ct-news-head">
              <h2 className="ct-news-title">Latest News</h2>
              <div className="ct-news-line" style={{ background: color }} />
            </div>

            <div className="ct-news-layout">

              <div className="ct-news-main">
                <div className="ct-grid">
                  {grid.map((a, i) => (
                    <GridCard
                      key={`grid-${a.id}-${i}`}
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
                <WeatherWidget color={color} weather={weather} loading={weatherLoading} locationAllowed={locationAllowed} />
                <CalendarWidget />
                <Advertisement
                  adData={ads.cards[0] ?? null}
                  variant="card"
                />
              </aside>

            </div>
          </div>
        </section>

        <Advertisement adData={ads.strips[1] ?? null} />

      </div>
    </>
  );
}