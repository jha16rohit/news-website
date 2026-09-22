import React from "react";
import { CheckCircle, Send, ArrowRight } from "lucide-react";
import "./SuccessState.css";

interface SuccessStateProps {
  onSendAnother: () => void;
  onViewMessages: () => void;
  message?: string;
  isSending?: boolean;
}

const SuccessState: React.FC<SuccessStateProps> = ({
  onSendAnother,
  onViewMessages,
  message,
  isSending = false,
}) => {
  if (isSending) {
    return (
      <div className="ss-container sending">
        <div className="ss-card">
          <div className="ss-spinner-wrapper">
            <div className="ss-spinner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ss-spinner-svg">
                <circle cx="12" cy="12" r="10" strokeWidth="2.5" strokeDasharray="28 56" />
              </svg>
            </div>
          </div>
          <h2 className="ss-title">Sending...</h2>
          <p className="ss-subtitle">Please wait while we send your message</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ss-container">
      <div className="ss-card">
        <div className="ss-icon-wrapper">
          <div className="ss-icon-bg">
            <CheckCircle size={28} className="ss-icon" />
          </div>
          <div className="ss-pulse-ring" />
        </div>

        <h2 className="ss-title">Message Sent!</h2>

        <p className="ss-message">
          {message || "Thank you for reaching out. We have received your message and will get back to you within 24 hours on working days."}
        </p>

        <div className="ss-actions">
          <button
            className="ss-btn ss-btn-primary"
            onClick={onSendAnother}
            type="button"
          >
            <Send size={16} />
            <span>Send Another Message</span>
          </button>

          <button
            className="ss-btn ss-btn-secondary"
            onClick={onViewMessages}
            type="button"
          >
            <span>View Your Messages</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <p className="ss-note">
          Your message has been assigned a reference ID. You can track its status in <strong>Your Messages</strong>.
        </p>
      </div>
    </div>
  );
};

export default SuccessState;