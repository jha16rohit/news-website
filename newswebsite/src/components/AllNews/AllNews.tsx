import React, { useState, useRef, useEffect } from "react";
import "./AllNews.css";
import { Search, Plus, ChevronDown, Check } from "lucide-react";

/* -------------------- DROPDOWN DATA -------------------- */
const statusOptions = [
  "All Status",
  "Published",
  "Draft",
  "Scheduled",
  "Breaking",
];

const categoryOptions = [
  "All Categories",
  "Politics",
  "Business",
  "Technology",
  "Sports",
  "Entertainment",
];

const AllNews: React.FC = () => {
  /* -------------------- FILTER STATE -------------------- */
  const [status, setStatus] = useState("Published");
  const [category, setCategory] = useState("All Categories");

  const [statusOpen, setStatusOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  /* -------------------- OUTSIDE CLICK -------------------- */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
      if (
        categoryRef.current &&
        !categoryRef.current.contains(e.target as Node)
      ) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="all-news-container">
      {/* ================= HEADER ================= */}
      <div className="all-news-header">
        <div>
          <h1>All News</h1>
          <p>Manage all articles, stories, and content across your newsroom</p>
        </div>

        <button className="add-news-btn">
          <Plus size={18} />
          Add News
        </button>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="filters-card">
        {/* SEARCH */}
        <div className="search-box reduced">
          <Search size={18} />
          <input placeholder="Search articles by headline, author, or category..." />
        </div>

        {/* RIGHT FILTERS */}
        <div className="right-filters">
          {/* STATUS DROPDOWN */}
          <div className="dropdown" ref={statusRef}>
            <button
              className="dropdown-trigger"
              onClick={() => setStatusOpen(!statusOpen)}
            >
              {status}
              <ChevronDown size={16} />
            </button>

            {statusOpen && (
              <div className="dropdown-menu">
                {statusOptions.map((item) => (
                  <div
                    key={item}
                    className="dropdown-item"
                    onClick={() => {
                      setStatus(item);
                      setStatusOpen(false);
                    }}
                  >
                    <div className="item-left">
                      {status === item && <Check size={16} />}
                      <span>{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CATEGORY DROPDOWN */}
          <div className="dropdown" ref={categoryRef}>
            <button
              className="dropdown-trigger"
              onClick={() => setCategoryOpen(!categoryOpen)}
            >
              {category}
              <ChevronDown size={16} />
            </button>

            {categoryOpen && (
              <div className="dropdown-menu">
                {categoryOptions.map((item) => (
                  <div
                    key={item}
                    className="dropdown-item"
                    onClick={() => {
                      setCategory(item);
                      setCategoryOpen(false);
                    }}
                  >
                    <div className="item-left">
                      {category === item && <Check size={16} />}
                      <span>{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="news-table-wrapper">
        <table className="news-table">
          <thead>
            <tr className="table-head">
              <th><input type="checkbox" /></th>
              <th>Article <span className="sort">↑↓</span></th>
              <th>Category</th>
              <th>Author</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Published</th>
              <th>Views</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {/* -------- ROW 1 -------- */}
            <tr className="news-row breaking-left">
              <td><input type="checkbox" /></td>

              <td>
                <div className="article-cell">
                  <div className="article-tags">
                    <span className="tag breaking">Breaking</span>
                    <span>📌</span>
                    <span>⭐</span>
                  </div>
                  <div className="article-title">
                    Parliament Session: Key Budget Amendments Passed...
                  </div>
                  <div className="article-subtitle">
                    Budget Amendments Passed
                  </div>
                </div>
              </td>

              <td className="muted">Politics</td>

              <td>
                <div className="author-cell">
                  <div className="avatar">PS</div>
                  <div>
                    <div className="author-name">Priya</div>
                    <div className="author-name">Sharma</div>
                  </div>
                </div>
              </td>

              <td>
                <span className="status-pill breaking">⚡ Breaking</span>
              </td>

              <td>
                <span className="priority-pill high">High</span>
              </td>

              <td className="muted">15 min<br />ago</td>
              <td className="views">145K</td>
              <td className="actions">⋯</td>
            </tr>

            {/* -------- ROW 2 -------- */}
            <tr className="news-row">
              <td><input type="checkbox" /></td>

              <td>
                <div className="article-cell">
                  <span className="star">⭐</span>
                  <div className="article-title">
                    Stock Markets Hit Record High: Sensex Crosses 85,000...
                  </div>
                  <div className="article-subtitle">
                    Sensex Crosses 85K
                  </div>
                </div>
              </td>

              <td className="muted">Business</td>

              <td>
                <div className="author-cell">
                  <div className="avatar">RV</div>
                  <div>
                    <div className="author-name">Rahul</div>
                    <div className="author-name">Verma</div>
                  </div>
                </div>
              </td>

              <td>
                <span className="status-pill published">Published</span>
              </td>

              <td>
                <span className="priority-pill high">High</span>
              </td>

              <td className="muted">42 min<br />ago</td>
              <td className="views">89K</td>
              <td className="actions">⋯</td>
            </tr>

            {/* -------- ROW 3 -------- */}
            <tr className="news-row">
              <td><input type="checkbox" /></td>

              <td>
                <div className="article-cell">
                  <span className="tag exclusive">Exclusive</span>
                  <div className="article-title">
                    Exclusive: Inside the Tech Startup That's Revolutionizing...
                  </div>
                  <div className="article-subtitle">
                    Healthcare Tech Revolution
                  </div>
                </div>
              </td>

              <td className="muted">Technology</td>

              <td>
                <div className="author-cell">
                  <div className="avatar">NG</div>
                  <div>
                    <div className="author-name">Neha</div>
                    <div className="author-name">Gupta</div>
                  </div>
                </div>
              </td>

              <td>
                <span className="status-pill published">Published</span>
              </td>

              <td>
                <span className="priority-pill medium">Medium</span>
              </td>

              <td className="muted">1 hr<br />ago</td>
              <td className="views">56K</td>
              <td className="actions">⋯</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllNews;
