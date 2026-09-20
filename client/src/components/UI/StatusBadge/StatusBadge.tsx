import React from "react";
import { Zap, Radio } from "lucide-react";
import "./StatusBadge.css";

export interface StatusBadgeProps {
  articleType?: "STANDARD" | "BREAKING" | "LIVE";
  statusType?: string;
  variant?: "default" | "compact" | "inline";
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  articleType = "STANDARD",
  statusType,
  variant = "default",
  className = "",
}) => {
  const isLive = articleType === "LIVE" && statusType !== "ended";
  const isBreaking = articleType === "BREAKING" && statusType === "published";

  if (!isLive && !isBreaking) {
    return null;
  }

  const liveClass = "status-badge status-badge--live";
  const breakingClass = "status-badge status-badge--breaking";
  const compactClass = variant === "compact" ? "status-badge--compact" : "";
  const inlineClass = variant === "inline" ? "status-badge--inline" : "";

  const renderLiveBadge = () => (
    <span className={`${liveClass} ${compactClass} ${inlineClass}`} aria-label="Live news">
      <Radio size={variant === "compact" ? 10 : 12} className="status-badge__dot" />
      <span className="status-badge__text">LIVE</span>
    </span>
  );

  const renderBreakingBadge = () => (
    <span className={`${breakingClass} ${compactClass} ${inlineClass}`} aria-label="Breaking news">
      <Zap size={variant === "compact" ? 10 : 12} className="status-badge__icon" />
      <span className="status-badge__text">BREAKING</span>
    </span>
  );

  const isLiveActive = articleType === "LIVE" && statusType !== "ended";
  const isBreakingActive = articleType === "BREAKING" && statusType === "published";

  if (isLiveActive && isBreakingActive) {
    return (
      <span className={`status-badge-group ${compactClass} ${inlineClass} ${className}`}>
        {renderLiveBadge()}
        {renderBreakingBadge()}
      </span>
    );
  }

  if (isLiveActive) {
    return <>{renderLiveBadge()}</>;
  }

  if (isBreakingActive) {
    return <>{renderBreakingBadge()}</>;
  }

  return null;
};

export default StatusBadge;