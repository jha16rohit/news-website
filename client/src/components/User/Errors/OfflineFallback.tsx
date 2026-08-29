import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import './Errorpage.css';

const OfflineFallback: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="error-page-wrapper">
      <div className="error-container">
        <div className="error-icon-wrap" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
          <WifiOff size={40} />
        </div>
        <h2 className="error-title" style={{ marginTop: '20px' }}>You are offline</h2>
        <p className="error-desc">
          It looks like you've lost your internet connection. Please check your network settings to continue reading the latest news.
        </p>
        <button onClick={handleRefresh} className="error-btn error-btn-outline">
          <RefreshCw size={18} /> Try Again
        </button>
      </div>
    </div>
  );
};

export default OfflineFallback;