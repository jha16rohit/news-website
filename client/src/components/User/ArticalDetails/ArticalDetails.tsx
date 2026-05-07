import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Calendar, Clock, User, Share2, Facebook, Instagram,
  Bold, Italic, Underline, Smile, AtSign, ThumbsUp, ThumbsDown, 
  MessageSquare, MoreHorizontal, ChevronDown, Flag, Copy
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import "./ArticalDetails.css"; 
import Advertisement from "../Advertisment/Advertisment";
import { useNews } from "../../Admin/NewsStore/NewsStore";

type VoteType = 'like' | 'dislike' | null;

interface CommentType {
  id: number;
  author: string;
  avatar: string;
  profilePic?: string | null;
  time: string;
  text: string;
  likes: number;
  dislikes: number;
  userVote: VoteType;
  isVerified?: boolean;
  replies: CommentType[];
}

const ALL_MOCK_ARTICLES = [
  { id: 1, category: "Politics", title: "Parliament Passes Historic Budget Bill: What It Means For India's Economy", subtitle: "Finance Minister outlines sweeping reforms across healthcare, education, and infrastructure in a landmark parliamentary session.", img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80" },
  { id: 2, category: "Sports", title: "India Clinches Historic Test Series Win Against Australia 3-1", subtitle: "A breathtaking final day in Sydney seals India's most celebrated overseas Test victory in decades.", img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&q=80" },
  { id: 3, category: "Business", title: "Sensex Surges 800 Points as FIIs Pour Record Capital Into Indian Markets", subtitle: "Foreign institutional investors drive the biggest single-day rally of the year amid optimism around policy reforms.", img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80" },
];

const INITIAL_COMMENTS: CommentType[] = [
  {
    id: 1,
    author: "Noah Pierre",
    avatar: "NP",
    profilePic: null,
    time: "58 minutes ago",
    text: "I'm a bit unclear about how condensation forms in the water cycle. Can someone break it down?",
    likes: 25,
    dislikes: 3,
    userVote: null,
    replies: [
      {
        id: 2,
        author: "Skill Sprout",
        avatar: "SS",
        profilePic: null,
        isVerified: true,
        time: "8 minutes ago",
        text: "Condensation happens when water vapor cools down and changes back into liquid droplets. It's the step before precipitation. The example with the glass of ice water in the video was a great visual!",
        likes: 2,
        dislikes: 0,
        userVote: null,
        replies: []
      }
    ]
  },
  {
    id: 3,
    author: "Mollie Hall",
    avatar: "MH",
    profilePic: null,
    time: "5 hours ago",
    text: "I really enjoyed today's lesson! The animations made the processes so much easier to grasp.",
    likes: 12,
    dislikes: 1,
    userVote: null,
    replies: []
  }
];

const MOCK_USERS = ["Aditi Sharma", "Noah Pierre", "Skill Sprout", "Mollie Hall"];
const EMOJIS = ["😀", "😂", "🥰", "😎", "🤔", "🙌", "👍", "🔥", "✨", "💯", "👀", "🎉"];

const ArticleDetail: React.FC = () => {
  const { articleId } = useParams();
  const { articles: storeArticles } = useNews() || { articles: [] };

  const [currentUser, setCurrentUser] = useState<{name: string, initials: string, profilePic: string | null} | null>(null);

  const [comments, setComments] = useState<CommentType[]>(INITIAL_COMMENTS);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  
  const commentInputRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("localNewzUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.cmt-toolbar') && !target.closest('.cmt-menu-wrap')) {
        setShowEmojiPicker(false);
        setShowMentionPicker(false);
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleShare = (platform: 'fb' | 'tw' | 'ig' | 'native') => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(article.title);

    if (platform === 'fb') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    if (platform === 'tw') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
    if (platform === 'ig') {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard for Instagram!");
    }
    if (platform === 'native' && navigator.share) {
      navigator.share({ title: article.title, url: window.location.href });
    }
  };

  const executeCommand = (e: React.MouseEvent, command: string) => {
    e.preventDefault();
    document.execCommand(command, false);
  };

  const insertAtCursor = (text: string) => {
    document.execCommand('insertText', false, text);
    setShowEmojiPicker(false);
    setShowMentionPicker(false);
  };

  const handleVote = (commentId: number, voteType: VoteType, isReply: boolean = false, parentId: number | null = null) => {
    const updateVoteCount = (c: CommentType): CommentType => {
      let newLikes = c.likes;
      let newDislikes = c.dislikes;
      
      if (c.userVote === 'like') newLikes--;
      if (c.userVote === 'dislike') newDislikes--;

      const finalVote = c.userVote === voteType ? null : voteType;
      
      if (finalVote === 'like') newLikes++;
      if (finalVote === 'dislike') newDislikes++;

      return { ...c, likes: newLikes, dislikes: newDislikes, userVote: finalVote };
    };

    setComments(prev => prev.map(c => {
      if (!isReply && c.id === commentId) return updateVoteCount(c);
      if (isReply && c.id === parentId) {
        return { ...c, replies: c.replies.map(r => r.id === commentId ? updateVoteCount(r) : r) };
      }
      return c;
    }));
  };

  const handleCommentSubmit = () => {
    const htmlContent = commentInputRef.current?.innerHTML || "";
    if (!htmlContent.trim()) return;

    const newCommentObj: CommentType = {
      id: Date.now(), 
      author: currentUser?.name || "Reader", 
      avatar: currentUser?.initials || "RE", 
      profilePic: currentUser?.profilePic || null,
      time: "Just now",
      text: htmlContent, 
      likes: 0, 
      dislikes: 0, 
      userVote: null, 
      replies: []
    };
    
    setComments([newCommentObj, ...comments]);
    if (commentInputRef.current) commentInputRef.current.innerHTML = "";
  };

  const handleReplySubmit = (parentId: number) => {
    const htmlContent = replyInputRef.current?.innerHTML || "";
    if (!htmlContent.trim()) return;

    const newReplyObj: CommentType = {
      id: Date.now(), 
      author: currentUser?.name || "Reader", 
      avatar: currentUser?.initials || "RE", 
      profilePic: currentUser?.profilePic || null,
      time: "Just now",
      text: htmlContent, 
      likes: 0, 
      dislikes: 0, 
      userVote: null, 
      replies: []
    };

    setComments(prev => prev.map(c => 
      c.id === parentId ? { ...c, replies: [...c.replies, newReplyObj] } : c
    ));
    
    setReplyingToId(null); 
  };

  const handleMenuClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

// 👇 Updated, much more reliable scroll function 👇
  const scrollToMainLiveUpdates = () => {
    const section = document.getElementById("main-detailed-live-updates");
    if (section) {
      // 'block: "center"' scrolls it perfectly into the middle of the screen, 
      // ensuring your top navbar doesn't block it!
      section.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const defaultMockArticle = {
    title: "Parliament Passes Historic Budget Bill: What It Means For India's Economy",
    subtitle: "Finance Minister outlines sweeping reforms across healthcare, education, and infrastructure in a landmark parliamentary session.",
    category: "Politics", author: "Aditi Sharma", date: "March 2, 2026", readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&q=80&w=1200",
    isLive: true, 
    liveUpdates: [
      { time: "12:45 PM", text: "PM addresses the nation on education reform passage. He highlighted that the new budget allocation will double the reach of rural development programs." },
      { time: "12:30 PM", text: "Opposition parties react to the bill — mixed responses observed across the parliamentary floor as leaders review the newly proposed tax slabs." },
      { time: "12:15 PM", text: "Bill passed with 356 votes in favor, 98 against. A historic moment for the current administration." }
    ],
    content: `In a landmark session, the Indian Parliament has passed the most ambitious budget bill in recent history, promising sweeping reforms across healthcare, education, and infrastructure sectors. 

The bill, which saw weeks of intense debate, was finally approved with a significant majority. Financial analysts are already predicting a positive market response, citing the heavy emphasis on digital infrastructure and renewable energy initiatives.

"This is a budget for the future," stated the Finance Minister during the closing remarks. "We are laying the foundation for a resilient, self-reliant economy that can weather global uncertainties."`
  };

  const realArticle = storeArticles.find(a => a.id === Number(articleId));
  const mockArticle = ALL_MOCK_ARTICLES.find(a => a.id === Number(articleId));

  const article = realArticle ? {
    id: realArticle.id, title: realArticle.title,
    subtitle: (realArticle as any).subtitle || "Stay informed with the latest updates and in-depth coverage from our editorial team.",
    category: realArticle.category || "News",
    author: (realArticle as any).author || "Local Newz Team", date: (realArticle as any).publishedAt || "Recently",
    readTime: "4 min read", imageUrl: (realArticle as any).imageUrl || (realArticle as any).img || defaultMockArticle.imageUrl,
    isLive: false, liveUpdates: [], content: (realArticle as any).content || defaultMockArticle.content
  } : mockArticle ? {
    ...defaultMockArticle, id: mockArticle.id, title: mockArticle.title,
    subtitle: mockArticle.subtitle,
    category: mockArticle.category, imageUrl: mockArticle.img, isLive: mockArticle.id === 1 
  } : {
    ...defaultMockArticle, id: articleId ? parseInt(articleId) : 1001,
  };

  const displayCategory = article.category.charAt(0).toUpperCase() + article.category.slice(1).toLowerCase();

  return (
    <div className="ad-page-wrapper">
      <div className="ad-container">
        
        <main className="ad-main-content">
          
          <div className="ad-breadcrumb">
            <Link to="/" className="ad-bc-link">Home</Link>
            <span className="ad-bc-sep">/</span>
            <Link to={`/category/${article.category.toLowerCase()}`} className="ad-bc-link" style={{ textTransform: 'capitalize' }}>
              {displayCategory}
            </Link>
            <span className="ad-bc-sep">/</span>
            <span className="ad-bc-current">{article.title}</span>
          </div>

          <span className="ad-category-badge">{article.category}</span>
          
          {/* ── MAIN HEADLINE ── */}
          <h1 className="ad-headline">{article.title}</h1>

          {/* ── SUBHEADING ── */}
          <p className="ad-subheadline">{article.subtitle}</p>

          <div className="ad-meta-row">
            <div className="ad-meta-left">
              <span><User size={14} /> {article.author}</span>
              <span><Calendar size={14} /> {article.date}</span>
              <span><Clock size={14} /> {article.readTime}</span>
            </div>
            
            <div className="ad-meta-right">
              <span className="ad-share-label"><Share2 size={14} /> Share:</span>
              <button className="ad-share-btn fb" onClick={() => handleShare('fb')}><Facebook size={14} /></button>
              <button className="ad-share-btn ig" onClick={() => handleShare('ig')}><Instagram size={14} /></button>
              <button className="ad-share-btn tw" onClick={() => handleShare('tw')}><FaXTwitter size={14} /></button>
            </div>
          </div>

          <img src={article.imageUrl} alt={article.title} className="ad-hero-image" />

          <div className="ad-article-body">
            {article.content.split('\n\n').map((paragraph: string, index: number) => {
              if (paragraph.startsWith('"') && paragraph.endsWith('"')) {
                return <blockquote key={index} className="ad-article-quote">{paragraph}</blockquote>;
              }
              return <p key={index}>{paragraph}</p>;
            })}
          </div>

          <div style={{ margin: "50px 0" }}>
            <Advertisement page={article.category?.toLowerCase() || "all"}/>
          </div>

          {/* 👇 DETAILED LIVE UPDATES SECTION (MAIN BODY) - ADDED ID HERE 👇 */}
          {article.isLive && (
            <div className="ad-main-live-section" id="main-detailed-live-updates">
              <div className="ad-main-live-header">
                <span className="ad-main-live-dot"></span>
                <h2>LIVE UPDATES</h2>
              </div>
              
              <div className="ad-main-live-timeline">
                {article.liveUpdates.map((update, index) => (
                  <div key={index} className="ad-main-live-item">
                    <div className="ad-main-live-time">
                      <Clock size={16} />
                      {update.time}
                    </div>
                    <div className="ad-main-live-content">
                      <p>{update.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="comments-section">
            
            <div className="cmt-input-box">
              <div 
                ref={commentInputRef}
                className="cmt-textarea" 
                contentEditable={true}
                data-placeholder="Add comment..."
              />
              
              <div className="cmt-toolbar">
                {showEmojiPicker && (
                  <div className="cmt-popup-menu">
                    {EMOJIS.map(e => (
                      <button key={e} className="cmt-emoji-btn" onMouseDown={(ev) => { ev.preventDefault(); insertAtCursor(e); }}>{e}</button>
                    ))}
                  </div>
                )}

                {showMentionPicker && (
                  <div className="cmt-popup-menu" style={{ flexDirection: 'column', gap: '4px', left: '120px' }}>
                    <span style={{fontSize:'10px', color:'#94a3b8', padding:'0 8px', fontWeight:700, textTransform:'uppercase'}}>Tag a user</span>
                    {MOCK_USERS.map(u => (
                      <button key={u} className="cmt-mention-btn" onMouseDown={(ev) => { ev.preventDefault(); insertAtCursor(`@${u} `); }}>{u}</button>
                    ))}
                  </div>
                )}
                <button className="cmt-submit" onClick={handleCommentSubmit}>Submit</button>
              </div>
            </div>

            <div className="cmt-header">
              <h3>Comments <span className="cmt-count">{comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)}</span></h3>
              <button className="cmt-sort">Most recent <ChevronDown size={14} /></button>
            </div>

            <div className="cmt-list">
              {comments.map((comment) => (
                <div key={comment.id} className="cmt-thread">
                  
                  <div className="cmt-item">
                    <div className="cmt-avatar">
                      {comment.profilePic ? (
                        <img src={comment.profilePic} alt={comment.author} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                      ) : (
                        comment.avatar
                      )}
                    </div>

                    <div className="cmt-content">
                      <div className="cmt-meta">
                        <span className="cmt-author">{comment.author}</span>
                        <span className="cmt-time">{comment.time}</span>
                      </div>
                      
                      <div className="cmt-text" dangerouslySetInnerHTML={{ __html: comment.text }} />
                      
                      <div className="cmt-actions">
                        <button className={`cmt-action-btn ${comment.userVote === 'like' ? 'active' : ''}`} onClick={() => handleVote(comment.id, 'like')}>
                          <ThumbsUp size={14} fill={comment.userVote === 'like' ? 'currentColor' : 'none'} /> {comment.likes}
                        </button>
                        <button className={`cmt-action-btn ${comment.userVote === 'dislike' ? 'active' : ''}`} onClick={() => handleVote(comment.id, 'dislike')}>
                          <ThumbsDown size={14} fill={comment.userVote === 'dislike' ? 'currentColor' : 'none'} /> {comment.dislikes}
                        </button>
                        <button className="cmt-action-btn cmt-reply-btn" onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}>
                          <MessageSquare size={14} /> Reply
                        </button>
                        
                        <div className="cmt-menu-wrap">
                          <button className="cmt-more-btn" onClick={(e) => handleMenuClick(e, comment.id)}>
                            <MoreHorizontal size={14} />
                          </button>
                          {openMenuId === comment.id && (
                            <div className="cmt-dropdown">
                              <button onClick={() => { alert('Link copied!'); setOpenMenuId(null); }}><Copy size={14}/> Copy Link</button>
                              <button onClick={() => { alert('Comment reported.'); setOpenMenuId(null); }}><Flag size={14}/> Report</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {replyingToId === comment.id && (
                        <div className="cmt-reply-box">
                          <div 
                            ref={replyInputRef}
                            className="cmt-textarea" 
                            contentEditable={true}
                            data-placeholder={`Replying to ${comment.author}...`}
                          />
                          <div className="cmt-reply-actions">
                            <button className="cmt-cancel" onClick={() => setReplyingToId(null)}>Cancel</button>
                            <button className="cmt-submit" onClick={() => handleReplySubmit(comment.id)}>Reply</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {comment.replies.length > 0 && (
                    <div className="cmt-replies-container">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="cmt-item">
                          
                          <div className="cmt-avatar cmt-avatar-small">
                            {reply.profilePic ? (
                              <img src={reply.profilePic} alt={reply.author} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                            ) : (
                              reply.avatar
                            )}
                          </div>

                          <div className="cmt-content">
                            <div className="cmt-meta">
                              <span className="cmt-author">
                                {reply.author} {reply.isVerified && <span className="cmt-verified">✔</span>}
                              </span>
                              <span className="cmt-time">{reply.time}</span>
                            </div>
                            
                            <div className="cmt-text" dangerouslySetInnerHTML={{ __html: reply.text }} />
                            
                            <div className="cmt-actions">
                              <button className={`cmt-action-btn ${reply.userVote === 'like' ? 'active' : ''}`} onClick={() => handleVote(reply.id, 'like', true, comment.id)}>
                                <ThumbsUp size={14} fill={reply.userVote === 'like' ? 'currentColor' : 'none'} /> {reply.likes}
                              </button>
                              <button className={`cmt-action-btn ${reply.userVote === 'dislike' ? 'active' : ''}`} onClick={() => handleVote(reply.id, 'dislike', true, comment.id)}>
                                <ThumbsDown size={14} fill={reply.userVote === 'dislike' ? 'currentColor' : 'none'} /> {reply.dislikes}
                              </button>
                              <button className="cmt-action-btn cmt-reply-btn" onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}>
                                <MessageSquare size={14} /> Reply
                              </button>

                              <div className="cmt-menu-wrap">
                                <button className="cmt-more-btn" onClick={(e) => handleMenuClick(e, reply.id)}>
                                  <MoreHorizontal size={14} />
                                </button>
                                {openMenuId === reply.id && (
                                  <div className="cmt-dropdown">
                                    <button onClick={() => { alert('Link copied!'); setOpenMenuId(null); }}><Copy size={14}/> Copy Link</button>
                                    <button onClick={() => { alert('Reply reported.'); setOpenMenuId(null); }}><Flag size={14}/> Report</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        <aside className="ad-sidebar">
          
          {/* 👇 SIDEBAR COMPACT LIVE UPDATES WIDGET 👇 */}
          {article.isLive && (
            <div className="ad-sidebar-widget ad-live-widget">
              <div className="ad-live-header">
                <span className="ad-live-dot"></span>
                <h3 className="ad-widget-title">LIVE UPDATES</h3>
              </div>
              <div className="ad-widget-divider"></div>
              <div className="ad-live-list">
                {article.liveUpdates.map((update, index) => (
                  <div 
                    key={index} 
                    className="ad-live-item" 
                    onClick={scrollToMainLiveUpdates} 
                    style={{ cursor: "pointer" }}
                    title="Click to view detailed updates"
                  >
                    <span className="ad-live-time">{update.time}</span>
                    {/* 👇 Truncates the text after 55 characters and adds "..." 👇 */}
                    <p className="ad-live-text">
                      {update.text.length > 55 ? update.text.substring(0, 40) + "..." : update.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ad-sidebar-widget ad-sticky-widget">
            <h3 className="ad-widget-title" style={{ color: '#0f172a' }}>Related News</h3>
            <div className="ad-widget-divider"></div>
            <div className="ad-related-item">
              <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=200" alt="Market" />
              <div className="ad-related-info">
                <h4>Sensex Surges 800 Points After Budget Announcement</h4>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="ad-related-item">
              <img src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=200" alt="Tech" />
              <div className="ad-related-info">
                <h4>Tech Sector Welcomes New AI Infrastructure Fund</h4>
                <span>4 hours ago</span>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default ArticleDetail;