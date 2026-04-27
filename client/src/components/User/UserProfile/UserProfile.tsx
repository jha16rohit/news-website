import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Bookmark, History, BarChart2, Settings, Edit2, Eye, 
  Heart, Share2, Clock, X, User, Mail, Phone, Image as ImageIcon 
} from "lucide-react";
import "./UserProfile.css";
import { useNews } from "../../Admin/NewsStore/NewsStore";

const ALL_MOCK_ARTICLES = [
  { id: 1, category: "POLITICS", title: "Parliament Passes Historic Budget Bill...", time: "2 hours ago", img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80" },
  { id: 2, category: "SPORTS", title: "India Clinches Historic Test Series Win Against Australia 3-1", time: "3 hours ago", img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80" },
  { id: 3, category: "BUSINESS", title: "Sensex Surges 800 Points as FIIs Pour Record Capital", time: "4 hours ago", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80" },
  { id: 4, category: "TECHNOLOGY", title: "AI Revolution: How Indian Tech Giants Are Leading...", time: "5 hours ago", img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80" },
  { id: 5, category: "ENTERTAINMENT", title: "Bollywood's New Wave: Independent Cinema", time: "6 hours ago", img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80" },
  { id: 6, category: "POLITICS", title: "PM Modi At G20 Summit: Key Trade Deals...", time: "7 hours ago", img: "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=600&q=80" },
  { id: 7, category: "HEALTH", title: "Indian Scientists Develop Breakthrough Vaccine", time: "8 hours ago", img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80" },
  { id: 8, category: "SCIENCE", title: "ISRO Announces Ambitious Mars Sample Return", time: "1 day ago", img: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80" },
  { id: 9, category: "BUSINESS", title: "Indian Startups Raise Record $15 Billion", time: "1 day ago", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80" },
  { id: 901, category: "NEWS", title: "Waiting for new articles to be published...", time: "10 mins ago", img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80" },
  { id: 902, category: "NEWS", title: "Stay tuned for more updates and breaking news.", time: "1 hour ago", img: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&q=80" },
  { id: 1001, category: "SPORTS", title: "Champions League Final: Historic Night", time: "2 hours ago", img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80" },
];

const HISTORY_ARTICLES = [
  { id: 4, category: "SPORTS", title: "India Clinches Historic Test Series Win Against Australia 3-1", time: "3 hours ago", read: "4 min read", img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&q=80" },
  { id: 5, category: "BUSINESS", title: "Sensex Surges 800 Points as FIIs Pour Record Capital", time: "4 hours ago", read: "5 min read", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&q=80" },
];

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { articles } = useNews() || { articles: [] }; 
  
  const [activeTab, setActiveTab] = useState<"saved" | "history" | "analytics" | "settings">("saved");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Added profilePic to the main user state
  const [user, setUser] = useState({
    name: "Mobile User",
    email: "user@example.com",
    phone: "+91 00000 00000",
    initials: "MU",
    profilePic: null as string | null
  });

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editProfilePic, setEditProfilePic] = useState<string | null>(null);
  const [savedArticleIds, setSavedArticleIds] = useState<number[]>([]);

  // Reference for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("localNewzUser");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setEditName(parsed.name || "");
      setEditEmail(parsed.email || "");
      setEditPhone(parsed.phone || "");
      setEditProfilePic(parsed.profilePic || null);
    } else {
      navigate("/");
    }

    const loadSavedArticles = () => {
      const saved = JSON.parse(localStorage.getItem("localNewzSavedArticles") || "[]");
      setSavedArticleIds(saved);
    };

    loadSavedArticles();
    
    window.addEventListener("localNewzSavedUpdate", loadSavedArticles);
    return () => window.removeEventListener("localNewzSavedUpdate", loadSavedArticles);
  }, [navigate]);

  // 👇 Handles the actual image file selection and preview
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfilePic(reader.result as string); // Sets the base64 image data
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const words = editName.trim().split(" ");
    let newInitials = "U";
    if (words.length > 1) {
      newInitials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
    } else if (words[0].length > 0) {
      newInitials = words[0].substring(0, 2).toUpperCase();
    }

    const updatedUser = {
      name: editName,
      email: editEmail,
      phone: editPhone,
      initials: newInitials,
      profilePic: editProfilePic // Save the picture!
    };

    setUser(updatedUser);
    localStorage.setItem("localNewzUser", JSON.stringify(updatedUser));
    setIsEditModalOpen(false);

    window.dispatchEvent(new Event("storage")); 
  };

  const allPossibleArticles = [
    ...articles, 
    ...ALL_MOCK_ARTICLES.filter(mockArticle => !articles.some(realArticle => realArticle.id === mockArticle.id))
  ];
  
  const displaySavedArticles = allPossibleArticles.filter(article => savedArticleIds.includes(article.id));

  return (
    <>
      <div className="up-page-wrapper">
        <div className="up-container">
          
          {/* ================= HEADER SECTION ================= */}
          <div className="up-header-banner">
            <div className="up-header-top">
              <div className="up-user-info">
                {/* Dynamically show profile picture OR initials */}
                <div className="up-avatar">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                  ) : (
                    user.initials
                  )}
                </div>
                <div className="up-user-details">
                  <h1>{user.name}</h1>
                  <div className="up-contact-info">
                    <span><Mail size={14}/> {user.email}</span>
                    <span><Phone size={14}/> {user.phone}</span>
                  </div>
                </div>
              </div>
              <button className="up-edit-btn" onClick={() => {
                setEditName(user.name);
                setEditEmail(user.email);
                setEditPhone(user.phone);
                setEditProfilePic(user.profilePic);
                setIsEditModalOpen(true);
              }}>
                <Edit2 size={16} /> Edit Profile
              </button>
            </div>

            <div className="up-stats-grid">
              <div className="up-stat-card">
                <Eye size={20} className="up-stat-icon" />
                <div className="up-stat-data">
                  <h3>142</h3>
                  <p>Articles read</p>
                </div>
              </div>
              <div className="up-stat-card">
                <Bookmark size={20} className="up-stat-icon" />
                <div className="up-stat-data">
                  <h3>{savedArticleIds.length}</h3>
                  <p>Saved</p>
                </div>
              </div>
              <div className="up-stat-card">
                <Heart size={20} className="up-stat-icon" />
                <div className="up-stat-data">
                  <h3>38</h3>
                  <p>Liked</p>
                </div>
              </div>
              <div className="up-stat-card">
                <Share2 size={20} className="up-stat-icon" />
                <div className="up-stat-data">
                  <h3>746</h3>
                  <p>Shared</p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= TABS NAVIGATION ================= */}
          <div className="up-tabs-wrapper">
            <button className={`up-tab ${activeTab === "saved" ? "active" : ""}`} onClick={() => setActiveTab("saved")}>
              <Bookmark size={18} /> Saved
            </button>
            <button className={`up-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
              <History size={18} /> History
            </button>
            <button className={`up-tab ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
              <BarChart2 size={18} /> Analytics
            </button>
            <button className={`up-tab ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
              <Settings size={18} /> Settings
            </button>
          </div>

          {/* ================= TAB CONTENT ================= */}
          <div className="up-content-area">
            
            {/* SAVED TAB */}
            {activeTab === "saved" && (
              <div className="up-tab-pane fade-in">
                <div className="up-section-head">
                  <h2>Saved Articles</h2>
                  <p>Your reading list, ready when you are.</p>
                </div>
                
                {displaySavedArticles.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                    <Bookmark size={48} style={{ opacity: 0.3, margin: "0 auto 15px", display: "block" }} />
                    <h3 style={{ color: "#ffffff", fontSize: "20px", marginBottom: "8px" }}>No articles saved yet</h3>
                    <p>Click the bookmark icon on any article to save it for later.</p>
                    <Link to="/" style={{ color: "#e60000", textDecoration: "none", fontWeight: "bold", marginTop: "20px", display: "inline-block" }}>Explore News</Link>
                  </div>
                ) : (
                  <div className="up-saved-grid">
                    {displaySavedArticles.map(article => (
                      <Link to={`/article/${article.id}`} key={article.id} className="up-saved-card">
                        <div className="up-saved-img-wrap">
                          <img src={(article as any).imageUrl || (article as any).img || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80"} alt={article.title} />
                        </div>
                        <div className="up-saved-body">
                          <span className="up-badge">{article.category}</span>
                          <h4>{article.title}</h4>
                          <div className="up-card-meta">
                            <span><Clock size={12}/> {(article as any).publishedAt || (article as any).time || "Recently"}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <div className="up-tab-pane fade-in">
                <div className="up-section-head">
                  <h2>Reading History</h2>
                  <p>Your recently viewed articles.</p>
                </div>
                <div className="up-timeline">
                  {HISTORY_ARTICLES.map((article, index) => (
                    <div key={article.id} className="up-timeline-item">
                      <div className="up-timeline-dot"></div>
                      <div className="up-timeline-time">{article.time}</div>
                      <Link to={`/article/${article.id}`} className="up-timeline-card">
                        <img src={article.img} alt={article.title} />
                        <div className="up-timeline-info">
                          <span className="up-badge up-badge-outline">{article.category}</span>
                          <h4>{article.title}</h4>
                          <span className="up-timeline-read">{article.read} - position {index + 1}</span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div className="up-tab-pane fade-in">
                <div className="up-analytics-grid">
                  
                  <div className="up-analytics-card">
                    <div className="up-section-head">
                      <h2>Shared Analytics</h2>
                      <p>Where your shared stories travelled this month.</p>
                    </div>
                    <div className="up-chart-wrapper">
                      <div className="up-y-axis">
                        <span>320</span><span>240</span><span>160</span><span>80</span><span>0</span>
                      </div>
                      <div className="up-bars">
                        <div className="up-bar-group"><div className="up-bar" style={{height: "45%", backgroundColor: "#334155"}}></div><span>X</span></div>
                        <div className="up-bar-group"><div className="up-bar" style={{height: "60%", backgroundColor: "#1877F2"}}></div><span>Facebook</span></div>
                        <div className="up-bar-group"><div className="up-bar" style={{height: "95%", backgroundColor: "#25D366"}}></div><span>WhatsApp</span></div>
                        <div className="up-bar-group"><div className="up-bar" style={{height: "30%", backgroundColor: "#0A66C2"}}></div><span>LinkedIn</span></div>
                        <div className="up-bar-group"><div className="up-bar" style={{height: "20%", backgroundColor: "#e60000"}}></div><span>Email</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="up-analytics-card">
                    <div className="up-section-head">
                      <h2>Engagement Insights</h2>
                      <p>Your activity highlights.</p>
                    </div>
                    <div className="up-insights-list">
                      <div className="up-insight-item">
                        <div className="up-insight-icon" style={{backgroundColor: "rgba(230,0,0,0.1)", color: "#e60000"}}><Eye size={20}/></div>
                        <div className="up-insight-text">
                          <h4>+24% Reading Time</h4>
                          <p>Compared to last week</p>
                        </div>
                      </div>
                      <div className="up-insight-item">
                        <div className="up-insight-icon" style={{backgroundColor: "rgba(59,130,246,0.1)", color: "#3b82f6"}}><Bookmark size={20}/></div>
                        <div className="up-insight-text">
                          <h4>Politics is your top category</h4>
                          <p>You saved {savedArticleIds.length} articles</p>
                        </div>
                      </div>
                      <div className="up-insight-item">
                        <div className="up-insight-icon" style={{backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e"}}><Share2 size={20}/></div>
                        <div className="up-insight-text">
                          <h4>Top Sharer!</h4>
                          <p>You are in the top 5% of active sharers.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="up-tab-pane fade-in">
                <div className="up-settings-card">
                  <div className="up-section-head">
                    <h2>Preferences</h2>
                    <p>Tune your experience and notifications.</p>
                  </div>
                  
                  <div className="up-setting-row">
                    <div className="up-setting-info">
                      <h4>Dark mode</h4>
                      <p>Switch the entire interface to a dark palette.</p>
                    </div>
                    <label className="up-toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="up-slider"></span>
                    </label>
                  </div>

                  <div className="up-setting-row">
                    <div className="up-setting-info">
                      <h4>Breaking news alerts</h4>
                      <p>Get notified the moment a story breaks.</p>
                    </div>
                    <label className="up-toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="up-slider"></span>
                    </label>
                  </div>

                  <div className="up-setting-row">
                    <div className="up-setting-info">
                      <h4>Daily digest</h4>
                      <p>A curated email every morning at 8am.</p>
                    </div>
                    <label className="up-toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="up-slider"></span>
                    </label>
                  </div>

                  <div className="up-setting-row">
                    <div className="up-setting-info">
                      <h4>Weekly highlights</h4>
                      <p>Top stories of the week, every Sunday.</p>
                    </div>
                    <label className="up-toggle">
                      <input type="checkbox" />
                      <span className="up-slider"></span>
                    </label>
                  </div>

                  <div className="up-setting-row">
                    <div className="up-setting-info">
                      <h4>Push notifications</h4>
                      <p>Browser push for personalised updates.</p>
                    </div>
                    <label className="up-toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="up-slider"></span>
                    </label>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {isEditModalOpen && (
        <div className="up-modal-overlay">
          <div className="up-modal">
            <button className="up-modal-close" onClick={() => setIsEditModalOpen(false)}>
              <X size={20} />
            </button>
            
            <h2 className="up-modal-title">Edit Profile</h2>
            
            <div className="up-photo-upload">
              <div className="up-avatar large">
                {/* Dynamically update the preview here too */}
                {editProfilePic ? (
                  <img src={editProfilePic} alt="Preview" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                  user.initials
                )}
              </div>
              <div className="up-upload-text">
                {/* 👇 The hidden file input and the clickable trigger 👇 */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/jpeg, image/png" 
                  style={{ display: 'none' }} 
                />
                <span 
                  className="up-upload-btn" 
                  onClick={() => fileInputRef.current?.click()} 
                  style={{ cursor: 'pointer' }}
                >
                  <ImageIcon size={14}/> Click photo to upload
                </span>
                <p>JPG or PNG, up to 2MB.</p>
              </div>
            </div>

            <form className="up-form" onSubmit={handleSaveProfile}>
              <div className="up-form-group">
                <label>Full name</label>
                <div className="up-input-wrap">
                  <User size={16} className="up-input-icon"/>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
              </div>
              <div className="up-form-group">
                <label>Email</label>
                <div className="up-input-wrap">
                  <Mail size={16} className="up-input-icon"/>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                </div>
              </div>
              <div className="up-form-group">
                <label>Phone number</label>
                <div className="up-input-wrap">
                  <Phone size={16} className="up-input-icon"/>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
              </div>
              
              <div className="up-modal-actions">
                <button type="button" className="up-btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="up-btn-save">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;