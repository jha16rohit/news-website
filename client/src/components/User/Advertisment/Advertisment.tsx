import React, { useState } from "react";
import "./Advertisment.css";

/* ─── Types ─────────────────────────────────────────────── */
interface AdProps {
  adData?: {
  imageUrl: string;
  linkUrl?: string;
  altText?: string;
} | null;

    variant?: "strip" | "card";
}


/* ─── Component ─────────────────────────────────────────── */
const Advertisement: React.FC<AdProps> = ({ adData ,variant = "strip",}) => {
  const [imgError, setImgError] = useState(false);

 const displayAd =
  !imgError && adData
    ? adData
    : null;

   if (!displayAd) {
  return null;
}

const normalizedUrl =
  displayAd.linkUrl &&
  (displayAd.linkUrl.startsWith("http://") ||
    displayAd.linkUrl.startsWith("https://"))
    ? displayAd.linkUrl
    : displayAd.linkUrl
    ? `https://${displayAd.linkUrl}`
    : "#";

return (
  <section className="advertisement-section">
    <div className="advertisement-container">
      <span className="ad-label">Advertisement</span>

      <a
        href={normalizedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`ad-image-wrapper ${
    variant === "card"
        ? "ad-image-wrapper--card"
        : "ad-image-wrapper--strip"
}`}
      >
        <img
          src={displayAd.imageUrl}
          alt={displayAd.altText}
          className={`ad-image ${
    variant === "card"
        ? "ad-image--card"
        : "ad-image--strip"
}`}
          onError={() => setImgError(true)}
        />
      </a>
    </div>
  </section>
);
};

export default Advertisement;