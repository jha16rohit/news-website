import "./RecentArticles.css";

const articles = [
  {
    title: "Tech Giants Report Strong Q4 Earnings...",
    author: "Priya Sharma",
    category: "Business",
    status: "Published",
    time: "10:45 AM",
    views: "12.5K",
  },
  {
    title: "National Sports Day: Athletes Share...",
    author: "Rahul Verma",
    category: "Sports",
    status: "Published",
    time: "10:30 AM",
    views: "8.2K",
  },
  {
    title: "New Healthcare Policy: What It Means for...",
    author: "Dr. Anita Patel",
    category: "Health",
    status: "Draft",
    time: "-",
    views: "-",
  },
  {
    title: "Exclusive: Behind the Scenes of...",
    author: "Karan Mehta",
    category: "Entertainment",
    status: "Scheduled",
    time: "2:00 PM",
    views: "-",
  },
  {
    title: "Climate Summit: India Announces...",
    author: "Neha Gupta",
    category: "Environment",
    status: "Published",
    time: "9:15 AM",
    views: "45.3K",
  },
];

const RecentArticles = () => {
  return (
    <div className="recent-card">
      {/* HEADER */}
      <div className="recent-header">
        <div>
          <h3>Recent Articles</h3>
          <p>Latest content from your newsroom</p>
        </div>
      </div>

      {/* TABLE */}
      <table className="recent-table">
        <thead>
          <tr>
            <th>Article</th>
            <th>Category</th>
            <th>Status</th>
            <th>Published</th>
            <th>Views</th>
          </tr>
        </thead>

        <tbody>
          {articles.map((item, index) => (
            <tr key={index}>
              <td>
                <div className="article-cell">
                  <strong>{item.title}</strong>
                  <span>{item.author}</span>
                </div>
              </td>

              <td className="muted">{item.category}</td>

              <td>
                <span className="status">{item.status}</span>
              </td>

              <td className="muted">{item.time}</td>

              <td className="views">{item.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentArticles;
