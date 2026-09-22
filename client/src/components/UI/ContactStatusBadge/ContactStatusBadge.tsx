import React from "react";
import { Clock } from "lucide-react";
import "./ContactStatusBadge.css";

export type ContactMessageStatus = "pending" | "replied";

export interface ContactStatusBadgeProps {
  status: "pending" | "replied";
  variant?: "default" | "compact" | "inline";
  className?: string;
  showIcon?: boolean;
}

const ContactStatusBadge: React.FC<ContactStatusBadgeProps> = ({
  status = "pending",
  variant = "default",
  className = "",
  showIcon = true,
}) => {
  const baseClass = "contact-status-badge";
  const statusClass = `contact-status-badge--${status}`;

  return (
    <span
      className={`${baseClass} ${statusClass} ${variant !== "default" ? `contact-status-badge--${variant}` : ""} ${className}`}
      aria-label={status === "replied" ? "Replied" : "Pending"}
    >
      {showIcon ? (
        <span className="contact-status-badge__icon" aria-hidden="true">
          {status === "replied" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="contact-status-badge__icon-svg">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <Clock size={12} className="contact-status-badge__spinner" />
          )}
        </span>
      ) : null}
      <span className="contact-status-badge__text">
        {status === "replied" ? "Replied" : "Pending"}
      </span>
    </span>
  );
};

export default ContactStatusBadge;