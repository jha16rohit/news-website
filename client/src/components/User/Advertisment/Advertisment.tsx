import React, { useState, useEffect } from "react";
import "./Advertisment.css";

/* ─── Types ─────────────────────────────────────────────── */
interface AdProps {
  /** Which page/section this slot is on. Matches targetPage from admin publish. */
  page?: string;
  /** Fallback: explicit ad data passed directly (legacy support) */
  adData?: {
    imageUrl: string;
    linkUrl: string;
    altText: string;
  } | null;
}

interface PublishedAd {
  id: number;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  targetPage: string;
  publishedAt: string;
  expiresAt: string;
  isActive: boolean;
  adTitle: string;
  advertiser: string;
}

/* ─── Default fallback ad ───────────────────────────────── */
const DEFAULT_AD = {
  imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000",
  linkUrl: "https://www.google.com",
  altText: "Premium Business Advertisement",
};

/* ─── Helper: get the best active ad for this page ──────── */
function getActiveAdForPage(page: string): PublishedAd | null {
  try {
    const all: PublishedAd[] = JSON.parse(localStorage.getItem("localNewzPublishedAds") || "[]");
    const now = new Date();

    // Match by exact page slug or "all" (sitewide)
    const candidates = all.filter(ad =>
      ad.isActive &&
      new Date(ad.expiresAt) > now &&
      new Date(ad.publishedAt) <= now &&
      (ad.targetPage === page || ad.targetPage === "all")
    );

    if (candidates.length === 0) return null;

    // Pick the one most recently published (freshest)
    return candidates.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )[0];
  } catch {
    return null;
  }
}

/* ─── Component ─────────────────────────────────────────── */
const Advertisement: React.FC<AdProps> = ({ page = "home", adData }) => {
  const [activeAd, setActiveAd] = useState<PublishedAd | null>(null);
  const [imgError, setImgError] = useState(false);

  const loadAd = () => {
    const found = getActiveAdForPage(page);
    setActiveAd(found);
    setImgError(false);
  };

  useEffect(() => {
    loadAd();

    // Re-read whenever admin publishes or updates ads
    const handler = () => loadAd();
    window.addEventListener("localNewzPublishedAdsUpdate", handler);

    // Also re-check every 60 seconds in case an ad expires while page is open
    const interval = setInterval(loadAd, 60_000);

    return () => {
      window.removeEventListener("localNewzPublishedAdsUpdate", handler);
      clearInterval(interval);
    };
  }, [page]);

  // Priority: 1) published ad from admin  2) explicit prop  3) default
  let displayAd: { imageUrl: string; linkUrl: string; altText: string } | null = null;

  if (activeAd && !imgError) {
    displayAd = {
      imageUrl: activeAd.imageUrl,
      linkUrl: activeAd.linkUrl,
      altText: activeAd.altText,
    };
  } else if (adData) {
    displayAd = adData;
  } else {
    displayAd = DEFAULT_AD;
  }

  if (!displayAd) return null;

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
          {/*
            KEY CSS SAFETY:
            - The wrapper uses a fixed height + overflow:hidden so any ad image
              (tall, wide, square, tiny) cannot break the page layout.
            - object-fit: contain ensures the image is fully visible without crop.
            - object-position: center keeps it centered.
            This means ads of ALL sizes render cleanly.
          */}
          <img
            src={displayAd.imageUrl}
            alt={displayAd.altText}
            className="ad-image"
            onError={() => setImgError(true)}
          />
        </a>
      </div>
    </section>
  );
};

export default Advertisement;