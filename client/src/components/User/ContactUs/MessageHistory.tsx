import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import "./MessageHistory.css";
import { deleteMyMessage, getMyMessages } from "../../../api/user/contactus";
import type { ContactMessageResponse } from "../../../api/user/contactus";

interface MessageHistoryProps {
  onMessageSelect: (message: ContactMessageResponse) => void;
  onNewMessage: () => void;
  onDeleteSuccess?: (id: string) => void;
}

const MessageHistory: React.FC<MessageHistoryProps> = ({ onMessageSelect, onNewMessage, onDeleteSuccess }) => {
  const [messages, setMessages] = useState<ContactMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unreplied">("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await getMyMessages();
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  if (loading) {
    return (
      <div className="mh-loading">
        <Loader2 size={24} className="spin-icon" />
        <span>Loading your messages...</span>
      </div>
    );
  }

  const filtered = activeTab === "unreplied" ? messages.filter((m) => !m.replied) : messages;
  const unrepliedCount = messages.filter((m) => !m.replied).length;

  const handleConfirmDelete = async () => {
    if (!confirmId) return;
    setDeletingId(confirmId);
    setDeleteError(null);
    try {
      await deleteMyMessage(confirmId);
      setMessages((prev) => prev.filter((m) => m.id !== confirmId));
      onDeleteSuccess?.(confirmId);
      setConfirmId(null);
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete message. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mh-container">
      <div className="mh-header">
        <div className="mh-header-left">
          <h2 className="mh-title">Your Messages</h2>
          <p className="mh-subtitle">Manage your enquiries and track replies</p>
        </div>
        <button className="mh-new-btn" onClick={onNewMessage} type="button">New Message</button>
      </div>

      {deleteError && (
        <div className="mh-error" role="alert"><AlertCircle size={14} /> {deleteError}</div>
      )}

      <div className="mh-tabs" role="tablist" aria-label="Message filters">
        <button role="tab" aria-selected={activeTab === "all"} onClick={() => setActiveTab("all")} className={`mh-tab ${activeTab === "all" ? "active" : ""}`}>All Messages</button>
        <button role="tab" aria-selected={activeTab === "unreplied"} onClick={() => setActiveTab("unreplied")} className={`mh-tab ${activeTab === "unreplied" ? "active" : ""}`}>
          Unreplied {unrepliedCount > 0 && <span className="mh-tab-badge">{unrepliedCount}</span>}
        </button>
      </div>

      <div className="mh-list" aria-label="Messages">
        {messages.length === 0 ? (
          <div className="mh-empty">
            <div className="mh-empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg></div>
            <p>No messages yet</p>
            <span>Your enquiries will appear here after you send a message.</span>
            <button className="mh-empty-btn" onClick={onNewMessage} type="button">Send Your First Message</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mh-empty"><p>No unreplied messages. All caught up!</p></div>
        ) : (
          <ul className="mh-message-list">
            {filtered.map((msg) => (
              <li key={msg.id} className={`mh-item ${msg.replied ? "replied" : "pending"} ${!msg.read ? "unread" : ""}`} onClick={() => onMessageSelect(msg)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onMessageSelect(msg); } }} aria-label={`View message: ${msg.subject || "General Enquiry"}`}>
                <div className="mi-status" aria-hidden="true"><span className={`mi-status-dot ${msg.replied ? "replied" : "pending"}`} /></div>
                <div className="mi-content">
                  <div className="mi-header">
                    <span className="mi-subject">{msg.subject || "General Enquiry"}</span>
                    <span className="mi-date">{new Date(msg.receivedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="mi-meta"><span className={`mi-status-badge ${msg.replied ? "replied" : "pending"}`}>{msg.replied ? "Replied" : "Pending"}</span></div>
                  <p className="mi-preview">{msg.message?.slice(0, 90)}{(msg.message?.length || 0) > 90 ? "…" : ""}</p>
                </div>
                <button
                  className="mh-delete-btn"
                  aria-label={`Delete message ${msg.subject || "General Enquiry"}`}
                  disabled={deletingId === msg.id}
                  onClick={(e) => { e.stopPropagation(); setConfirmId(msg.id); setDeleteError(null); }}
                  type="button"
                >
                  {deletingId === msg.id ? <Loader2 size={14} className="spin-icon" /> : <Trash2 size={14} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {confirmId && (
        <div className="cu-modal-overlay" onClick={() => !deletingId && setConfirmId(null)} role="dialog" aria-modal="true" aria-label="Confirm delete">
          <div className="cu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cu-modal-icon cu-modal-icon--danger"><Trash2 size={20} /></div>
            <h4>Delete this message?</h4>
            <p>This will permanently delete your enquiry and any reply. This cannot be undone.</p>
            <div className="cu-modal-actions">
              <button className="cu-modal-cancel" onClick={() => setConfirmId(null)} disabled={!!deletingId} type="button">Cancel</button>
              <button className="cu-modal-confirm cu-modal-confirm--danger" onClick={handleConfirmDelete} disabled={!!deletingId} type="button">
                {deletingId ? <Loader2 size={14} className="spin-icon" /> : null} {deletingId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageHistory;
export { MessageHistory };
