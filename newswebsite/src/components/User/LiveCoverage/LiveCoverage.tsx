import React, { useRef, useState, useEffect } from "react";
import { Radio, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom"; 
import "./LiveCoverage.css";

const LiveCoverage: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0); 

  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const liveData = [
    {
      id: 1,
      category: "POLITICS",
      title: "Parliament Session Live: Budget Bill Debate Continues",
      updates: "245 updates",
      time: "2 min ago",
      imgUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 2,
      category: "SPORTS",
      title: "India vs Australia 4th Test — Day 3",
      updates: "132 updates",
      time: "Just now",
      imgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 3,
      category: "BUSINESS",
      title: "Stock Market Live: Sensex & Nifty Tracker",
      updates: "89 updates",
      time: "5 min ago",
      imgUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 4,
      category: "TECHNOLOGY",
      title: "Global Tech Summit 2026: Keynote Address",
      updates: "42 updates",
      time: "12 min ago",
      imgUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 5,
      category: "WORLD",
      title: "UN Climate Council Emergency Meeting",
      updates: "18 updates",
      time: "15 min ago",
      imgUrl: "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 6,
      category: "HEALTH",
      title: "Ministry of Health Press Conference on New Guidelines",
      updates: "56 updates",
      time: "22 min ago",
      imgUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 7,
      category: "ENTERTAINMENT",
      title: "Live from the Red Carpet: Filmfare Awards 2026",
      updates: "304 updates",
      time: "Just now",
      imgUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 8,
      category: "SCIENCE",
      title: "ISRO Mars Mission Launch Control - Countdown",
      updates: "110 updates",
      time: "2 min ago",
      imgUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 9,
      category: "CRIME",
      title: "High Court Begins Hearing on Major Cyber Fraud Case",
      updates: "14 updates",
      time: "28 min ago",
      imgUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
    },
    {
      id: 10,
      category: "EDUCATION",
      title: "National Board Announces Sweeping Curriculum Changes",
      updates: "67 updates",
      time: "1 hr ago",
      imgUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800",
    }
  ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      
      const maxScrollLeft = scrollWidth - clientWidth;
      setScrollProgress(maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0);
    }
  };

  useEffect(() => {
    handleScroll(); 
  }, []);

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    if (scrollRef.current) {
      dragScrollLeft.current = scrollRef.current.scrollLeft;
    }
    document.body.style.userSelect = "none"; 
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current || !trackRef.current) return;

      const deltaX = e.clientX - dragStartX.current;
      const trackWidth = trackRef.current.clientWidth;
      const thumbWidth = trackWidth * 0.15; 
      
      const trackScrollableWidth = trackWidth - thumbWidth;
      const containerScrollableWidth = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      
      if (trackScrollableWidth > 0) {
        const ratio = containerScrollableWidth / trackScrollableWidth;
        scrollRef.current.scrollLeft = dragScrollLeft.current + (deltaX * ratio);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = ""; 
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 474; 
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="live-coverage-section">
      <div className="live-coverage-container">
        
        <div className="live-header">
          <div className="live-title-wrapper">
            <Radio size={24} className="live-icon" />
            <h2>Live Coverage</h2>
          </div>
          <Link to="/live-events" className="view-all-link text-decoration-none">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="live-cards-wrapper" ref={scrollRef} onScroll={handleScroll}>
          {liveData.map((item) => (
            
            <Link 
              to={`/live/${item.id}`} 
              className="live-card text-decoration-none" 
              key={item.id}
            >
              <div className="live-card-image" style={{ backgroundImage: `url(${item.imgUrl})` }}>
                {/* 👇 Renamed class from live-badge to coverage-badge */}
                <div className="coverage-badge">
                  <span className="live-dot"></span> LIVE
                </div>
                <div className="live-card-overlay">
                  <span className="live-card-category">{item.category}</span>
                  <h3 className="live-card-title">{item.title}</h3>
                </div>
              </div>
              <div className="live-card-footer">
                <span className="updates-count">{item.updates}</span>
                <span className="update-time">{item.time}</span>
              </div>
            </Link>

          ))}
        </div>

        <div className="live-scroll-controls">
          <button 
            className={`scroll-arrow ${!canScrollLeft ? 'disabled' : ''}`} 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            &#9664;
          </button>
          
          <div className="scroll-track" ref={trackRef}>
            <div 
              className={`scroll-thumb ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleThumbMouseDown}
              style={{ 
                left: `${scrollProgress * 85}%` 
              }}
            ></div>
          </div>

          <button 
            className={`scroll-arrow ${!canScrollRight ? 'disabled' : ''}`} 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            &#9654;
          </button>
        </div>

      </div>
    </section>
  );
};

export default LiveCoverage;