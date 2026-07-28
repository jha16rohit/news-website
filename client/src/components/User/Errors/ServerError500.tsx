import React from 'react';
import { ServerCrash, RefreshCw } from 'lucide-react';
import './Errorpage.css';

const ServerError500: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="error-page-wrapper">
      <div className="error-container">
        <div className="error-icon-wrap">
          <ServerCrash size={40} />
        </div>
        <h1 className="error-code">500</h1>
        <h2 className="error-title">Internal Server Error</h2>
        <p className="error-desc">
          We are experiencing some technical difficulties on our end. Our engineering team has been notified and is working on it!
        </p>
        <button onClick={handleRefresh} className="error-btn">
          <RefreshCw size={18} /> Refresh Page
        </button>
      </div>
    </div>
  );
};

export default ServerError500;