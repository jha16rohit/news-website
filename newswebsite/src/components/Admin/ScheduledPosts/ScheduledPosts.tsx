import React, { useState } from "react";
import "./ScheduledPosts.css";
import {
  Clock,
  Calendar,
  AlertCircle,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

/* ================= DATA ================= */
const scheduledArticles = [
  {
    id: 1,
    title: "Budget 2024: Complete Analysis and Impact Assessment",
    category: "Politics",
    author: "Rahul Sharma",
    scheduledDate: "2026-02-11T18:00:00",
    status: "Ready",
    statusType: "ready",
    image: "/api/placeholder/80/80",
  },
  {
    id: 2,
    title: "Exclusive Interview: Tech CEO on AI Future",
    category: "Technology",
    author: "Priya Patel",
    scheduledDate: "2026-02-11T20:00:00",
    status: "Ready",
    statusType: "ready",
    image: "/api/placeholder/80/80",
  },
  {
    id: 3,
    title: "Weekend Sports Roundup: All You Need to Know",
    category: "Sports",
    author: "Vikram Singh",
    scheduledDate: "2026-02-12T09:00:00",
    status: "Pending Review",
    statusType: "pending",
    image: "/api/placeholder/80/80",
  },
  {
    id: 4,
    title: "New Movie Reviews: Must-Watch Releases This Week",
    category: "Entertainment",
    author: "Anjali Mehta",
    scheduledDate: "2026-02-12T12:00:00",
    status: "Ready",
    statusType: "ready",
    image: "/api/placeholder/80/80",
  },
  {
    id: 5,
    title: "Market Analysis: Q1 2026 Trends",
    category: "Business",
    author: "Amit Kumar",
    scheduledDate: "2026-02-15T10:00:00",
    status: "Ready",
    statusType: "ready",
    image: "/api/placeholder/80/80",
  },
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ScheduledPosts: React.FC = () => {
  const today = new Date();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  const currentMonth = `${months[currentMonthIndex]} ${currentYear}`;

  // Calculate days in current month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the first day of the month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonthIndex, currentYear);
  const startDay = getFirstDayOfMonth(currentMonthIndex, currentYear);

  // Check if a date has scheduled posts
  const hasScheduledPosts = (day: number) => {
    return scheduledArticles.some(article => {
      const articleDate = new Date(article.scheduledDate);
      return (
        articleDate.getDate() === day &&
        articleDate.getMonth() === currentMonthIndex &&
        articleDate.getFullYear() === currentYear
      );
    });
  };

  // Check if a date is today
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonthIndex === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // Format scheduled date for display
  const formatScheduledDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;
    
    return `${months[date.getMonth()]} ${date.getDate()}, ${timeStr}`;
  };

  // Get articles for selected date
  const getArticlesForDate = (day: number, month: number, year: number) => {
    return scheduledArticles.filter(article => {
      const articleDate = new Date(article.scheduledDate);
      return (
        articleDate.getDate() === day &&
        articleDate.getMonth() === month &&
        articleDate.getFullYear() === year
      );
    }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  };

  // Get today's upcoming posts
  const getTodaysPosts = () => {
    return scheduledArticles.filter(article => {
      const articleDate = new Date(article.scheduledDate);
      return articleDate.toDateString() === today.toDateString();
    }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  };

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(day);
  };

  // When navigating months, reset selected date if it doesn't exist in new month
  const handlePrevMonthWithReset = () => {
    handlePrevMonth();
    // Reset to day 1 if current selected date doesn't exist in previous month
    const prevMonth = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
    const prevMonthDays = getDaysInMonth(prevMonth, prevYear);
    if (selectedDate > prevMonthDays) {
      setSelectedDate(1);
    }
  };

  const handleNextMonthWithReset = () => {
    handleNextMonth();
    // Reset to day 1 if current selected date doesn't exist in next month
    const nextMonth = currentMonthIndex === 11 ? 0 : currentMonthIndex + 1;
    const nextYear = currentMonthIndex === 11 ? currentYear + 1 : currentYear;
    const nextMonthDays = getDaysInMonth(nextMonth, nextYear);
    if (selectedDate > nextMonthDays) {
      setSelectedDate(1);
    }
  };

  const todaysPosts = getTodaysPosts();
  const selectedDatePosts = getArticlesForDate(selectedDate, currentMonthIndex, currentYear);
  
  // Check if selected date is today
  const isSelectedDateToday = 
    selectedDate === today.getDate() &&
    currentMonthIndex === today.getMonth() &&
    currentYear === today.getFullYear();

  // Format selected date for display
  const getSelectedDateLabel = () => {
    if (isSelectedDateToday) return "Today";
    
    const selected = new Date(currentYear, currentMonthIndex, selectedDate);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (selected.toDateString() === yesterday.toDateString()) return "Yesterday";
    if (selected.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return `${months[currentMonthIndex]} ${selectedDate}, ${currentYear}`;
  };

  return (
    <div className="sp-container">
      {/* HEADER */}
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Scheduled Posts</h1>
          <p className="sp-subtitle">Manage and schedule your upcoming publications</p>
        </div>
        <button className="sp-schedule-btn">
          <Clock size={18} /> Schedule New
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="sp-stats-grid">
        <div className="sp-stat-card">
          <div className="sp-stat-icon sp-icon-gray">
            <Clock size={24} />
          </div>
          <div className="sp-stat-content">
            <div className="sp-stat-number">{scheduledArticles.length}</div>
            <div className="sp-stat-label">Total Scheduled</div>
          </div>
        </div>

        <div className="sp-stat-card">
          <div className="sp-stat-icon sp-icon-green">
            <Calendar size={24} />
          </div>
          <div className="sp-stat-content">
            <div className="sp-stat-number">{todaysPosts.length}</div>
            <div className="sp-stat-label">Today</div>
          </div>
        </div>

        <div className="sp-stat-card">
          <div className="sp-stat-icon sp-icon-orange">
            <AlertCircle size={24} />
          </div>
          <div className="sp-stat-content">
            <div className="sp-stat-number">
              {scheduledArticles.filter(a => a.statusType === 'pending').length}
            </div>
            <div className="sp-stat-label">Needs Review</div>
          </div>
        </div>

        <div className="sp-stat-card">
          <div className="sp-stat-icon sp-icon-purple">
            <List size={24} />
          </div>
          <div className="sp-stat-content">
            <div className="sp-stat-number">
              {scheduledArticles.filter(article => {
                const articleDate = new Date(article.scheduledDate);
                const weekFromNow = new Date(today);
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return articleDate >= today && articleDate <= weekFromNow;
              }).length}
            </div>
            <div className="sp-stat-label">This Week</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="sp-content">
        {/* CALENDAR SECTION */}
        <div className="sp-calendar-section">
          <div className="sp-calendar-card">
            <div className="sp-calendar-header">
              <Calendar size={20} />
              <h2>Calendar</h2>
            </div>

            <div className="sp-calendar-widget">
              <div className="sp-calendar-nav">
                <button className="sp-nav-btn" onClick={handlePrevMonthWithReset}>
                  <ChevronLeft size={18} />
                </button>
                <span className="sp-current-month">{currentMonth}</span>
                <button className="sp-nav-btn" onClick={handleNextMonthWithReset}>
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="sp-calendar-grid">
                <div className="sp-calendar-weekdays">
                  <div className="sp-weekday">Su</div>
                  <div className="sp-weekday">Mo</div>
                  <div className="sp-weekday">Tu</div>
                  <div className="sp-weekday">We</div>
                  <div className="sp-weekday">Th</div>
                  <div className="sp-weekday">Fr</div>
                  <div className="sp-weekday">Sa</div>
                </div>

                <div className="sp-calendar-days">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="sp-calendar-day sp-day-empty"></div>
                  ))}
                  
                  {/* Actual days of the month */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                    <div
                      key={day}
                      className={`sp-calendar-day ${
                        day === selectedDate ? "sp-day-selected" : ""
                      } ${isToday(day) ? "sp-day-today" : ""} ${
                        hasScheduledPosts(day) ? "sp-day-has-posts" : ""
                      }`}
                      onClick={() => handleDateClick(day)}
                    >
                      {day}
                      {hasScheduledPosts(day) && (
                        <div className="sp-day-indicator"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sp-upcoming-section">
              <h3 className="sp-upcoming-title">
                {selectedDatePosts.length > 0 
                  ? `Scheduled for ${getSelectedDateLabel()}` 
                  : `No posts scheduled for ${getSelectedDateLabel()}`}
              </h3>
              {selectedDatePosts.map((post, index) => {
                const postTime = new Date(post.scheduledDate).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
                return (
                  <div key={index} className="sp-upcoming-item">
                    <div className={`sp-upcoming-dot sp-dot-${post.statusType === 'ready' ? 'green' : 'orange'}`}></div>
                    <div className="sp-upcoming-text">
                      <span className="sp-upcoming-time">{postTime}</span> - {post.title.substring(0, 30)}...
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SCHEDULED ARTICLES SECTION */}
        <div className="sp-articles-section">
          <div className="sp-articles-card">
            <div className="sp-articles-header">
              <List size={20} />
              <h2>Scheduled Articles</h2>
            </div>

            <div className="sp-articles-list">
              {scheduledArticles.map((article) => (
                <div key={article.id} className="sp-article-item">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="sp-article-thumbnail"
                  />

                  <div className="sp-article-info">
                    <h3 className="sp-article-title">{article.title}</h3>
                    <div className="sp-article-meta">
                      <span className="sp-article-category">{article.category}</span>
                      <span className="sp-meta-divider">•</span>
                      <span className="sp-article-author">{article.author}</span>
                    </div>
                  </div>

                  <div className="sp-article-schedule">
                    <div className="sp-schedule-time">{formatScheduledDate(article.scheduledDate)}</div>
                    <span
                      className={`sp-schedule-status sp-status-${article.statusType}`}
                    >
                      {article.status}
                    </span>
                  </div>

                  <div className="sp-article-actions">
                    <button className="sp-action-btn" title="Preview">
                      <Eye size={18} />
                    </button>
                    <button className="sp-action-btn" title="Edit">
                      <Edit size={18} />
                    </button>
                    <button className="sp-action-btn sp-action-danger" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledPosts;