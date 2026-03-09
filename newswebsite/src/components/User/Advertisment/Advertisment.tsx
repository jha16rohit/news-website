import React from "react";
import "./Advertisment.css";

// Defining the shape of our ad data
interface AdProps {
  adData?: {
    imageUrl: string;
    linkUrl: string;
    altText: string;
  } | null;
}

const Advertisement: React.FC<AdProps> = ({ adData }) => {
  // If the admin hasn't posted an ad (data is null or undefined), render NOTHING.
  if (!adData) {
    return null;
  }

  return (
    <section className="advertisement-section">
      <div className="advertisement-container">
        <span className="ad-label">Advertisement</span>
        <a 
          href={adData.linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="ad-image-wrapper"
        >
          <img 
            src={adData.imageUrl} 
            alt={adData.altText} 
            className="ad-image" 
          />
        </a>
      </div>
    </section>
  );
};

export default Advertisement;