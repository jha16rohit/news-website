import React from "react";
import { ArrowLeft, Mail } from "lucide-react";
import "./MessageDetail.css";
import { ContactStatusBadge } from "../../UI/ContactStatusBadge";
import { hasReply } from "../../../utils/contactStatusUtils";
import type { ContactMessageResponse } from "../../../api/user/contactus";

interface MessageDetailProps {
  message: ContactMessageResponse;
  onBack: () => void;
}

const MessageDetail: React.FC<MessageDetailProps> = ({ message, onBack }) => {
  const hasAdminReply = hasReply(message);

  return (
    <div className="md-container">
      <button className="md-back-btn" onClick={onBack} aria-label="Back to messages" type="button">
        <span className="md-back-icon"><ArrowLeft size={18} /></span>
        <span className="md-back-text">Back to Messages</span>
      </button>

      <article className="md-article">
        <header className="md-header">
          <div className="md-header-main">
            <h1 className="md-subject">{message.subject || "General Enquiry"}</h1>
            <div className="md-header-meta">
              <ContactStatusBadge status={message.replied ? "replied" : "pending"} variant="default" showIcon />
              <time className="md-date" dateTime={message.receivedAt}>
                {new Date(message.receivedAt).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </time>
            </div>
          </div>
          <div className="md-meta-row">
            <div className="md-meta-item"><Mail size={14} /><span>{message.email}</span></div>
            {message.phone && (
              <div className="md-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2-1.77 17.35 17.35 0 0 1 7 2.5 2 2 0 0 1 2.01.52 17.27 17.27 0 0 1 5 5.5 2 2 0 0 1 1.5 2.16 17.35 17.35 0 0 1 4 9c0 1.35-.35 2.6-.98 3.73" /></svg>
                <span>{message.phone}</span>
              </div>
            )}
          </div>
        </header>

        <div className="md-thread">
          <article className="md-message user">
            <header className="mt-header">
              <div className="mt-sender"><strong className="mt-name">{message.name}</strong><span className="mt-email">{message.email}</span></div>
              <time className="mt-time" dateTime={message.receivedAt}>{new Date(message.receivedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
            </header>
            <div className="mt-bubble user" dangerouslySetInnerHTML={{ __html: message.message.replace(/\n/g, "<br/>") }} />
          </article>

          {hasAdminReply && (
            <article className="md-message admin">
              <header className="mt-header">
                <div className="mt-sender"><strong className="mt-name">LocalNewz Team</strong><span className="mt-role">Admin</span></div>
                <time className="mt-time" dateTime={message.repliedAt || message.updatedAt || new Date().toISOString()}>
                  {message.repliedAt
                    ? new Date(message.repliedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    : message.updatedAt
                    ? new Date(message.updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "Just now"}
                </time>
              </header>
              <div className="mt-bubble admin" dangerouslySetInnerHTML={{ __html: (message.replyText || (message as any).reply || "").replace(/\n/g, "<br/>") }} />
            </article>
          )}

          {!hasAdminReply && (
            <div className="md-awaiting">
              <div className="await-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="await-spinner"><circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="28 56" /></svg>
              </div>
              <p className="await-text">We will notify you here and via email when our team replies.</p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};

export default MessageDetail;
export { MessageDetail };
