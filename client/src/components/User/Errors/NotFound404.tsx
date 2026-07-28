import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX, Home } from 'lucide-react';
import './Errorpage.css';

const NotFound404: React.FC = () => {
  return (
    <div className="error-page-wrapper">
      <div className="error-container">
        <div className="error-icon-wrap">
          <SearchX size={40} />
        </div>
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Page Not Found</h2>
        <p className="error-desc">
          Oops! The article or page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>
        <Link to="/" className="error-btn">
          <Home size={18} /> Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFound404;