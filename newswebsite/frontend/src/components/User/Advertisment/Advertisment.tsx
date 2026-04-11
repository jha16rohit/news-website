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

// 👇 HERE IS YOUR BUILT-IN ADVERTISEMENT DATA
const defaultAdData = {
  imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000",
  linkUrl: "https://www.google.com",
  altText: "Premium Business Advertisement"
};

const Advertisement: React.FC<AdProps> = ({ adData }) => {
  // 👇 MAGIC TRICK: Use the provided adData, OR use the defaultAdData if none is provided!
  const displayAd = adData || defaultAdData;

  // It will only return null now if BOTH are somehow missing
  if (!displayAd) {
    return null;
  }

  return (
    <section className="advertisement-section">
      <div className="advertisement-container">
        <span className="ad-label">Advertisement</span>
        <a 
          href={displayAd.linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="ad-image-wrapper"
        >
          <img 
            src={displayAd.imageUrl} 
            alt={displayAd.altText} 
            className="ad-image" 
          />
        </a>
      </div>
    </section>
  );
};

export default Advertisement;