import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';
import './Errorpage.css';

const AccessDenied403: React.FC = () => {
  return (
    <div className="error-page-wrapper">
      <div className="error-container">
        <div className="error-icon-wrap">
          <ShieldAlert size={40} />
        </div>
        <h1 className="error-code">403</h1>
        <h2 className="error-title">Access Denied</h2>
        <p className="error-desc">
          You do not have permission to view this directory or page using the credentials that you supplied.
        </p>
        <Link to="/admin/login" className="error-btn">
          <LogIn size={18} /> Go to Admin Login
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied403;