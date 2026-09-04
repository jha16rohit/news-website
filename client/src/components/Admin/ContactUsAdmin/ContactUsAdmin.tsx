import React, { useState, useEffect, useCallback } from "react";
import {
  Save, CheckCircle, Plus, Trash2, Phone, Mail, MapPin,
  Clock, Globe, Inbox, Send, Reply, X, Eye, Loader2,
} from "lucide-react";
import "./ContactUsAdmin.css";
import { apiClient } from "../../../api/client";

// ─── TYPES ─────────────────────────────────────────────────────────
export interface ContactInfo {
  id: string;
  type: "phone" | "email" | "address" | "hours" | "website";
  label: string;
  value: string;
  visible: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  visible: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  receivedAt: string;
  read: boolean;
  replied: boolean;
  replyText?: string;
}

export interface ContactUsData {
  heroVisible: boolean;
  heroTitle: string;
  heroSubtitle: string;
  contactInfoVisible: boolean;
  contactInfo: ContactInfo[];
  formVisible: boolean;
  formTitle: string;
  formSubtitle: string;
  formSuccessMsg: string;
  subjectOptions: string[];
  faqVisible: boolean;
  faqTitle: string;
  faq: FaqItem[];
}

// ─── DEFAULTS ──────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);

const DEFAULT_DATA: ContactUsData = {
  heroVisible: true,
  heroTitle: "Let's Talk.",
  heroSubtitle: "Have a story tip, feedback, or a business enquiry? We'd love to hear from you.",
  contactInfoVisible: true,
  contactInfo: [],
  formVisible: true,
  formTitle: "Send Us a Message",
  formSubtitle: "We typically respond within 24 hours on working days.",
  formSuccessMsg: "Thank you! Your message has been received. We'll be in touch soon.",
  subjectOptions: ["General Enquiry", "News Tip", "Correction Request", "Advertising", "Partnership", "Complaint", "Other"],
  faqVisible: true,
  faqTitle: "Frequently Asked Questions",
  faq: [],
};

const TYPE_ICON: Record<string, React.FC<any>> = {
  phone: Phone, email: Mail, address: MapPin, hours: Clock, website: Globe,
};

// ─── MESSAGE DETAIL MODAL ──────────────────────────────────────────
const MessageModal: React.FC<{
  msg: ContactMessage;
  onClose: () => void;
  onReply: (id: string, text: string) => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
}> = ({ msg, onClose, onReply, onMarkRead }) => {
  const [replyText, setReplyText] = useState(msg.replyText || "");
  const [sent, setSent] = useState(msg.replied);
  const [sending, setSending] = useState(false);

  useEffect(() => { if (!msg.read) onMarkRead(msg.id); }, []);

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(msg.id, replyText);
    setSent(true);
    setSending(false);
  };

  return (
    <div className="cu-modal-overlay" onClick={onClose}>
      <div className="cu-modal" onClick={e => e.stopPropagation()}>
        <div className="cu-modal-header">
          <div>
            <p className="cu-modal-from">{msg.name} &lt;{msg.email}&gt;</p>
            <h3 className="cu-modal-subject">{msg.subject}</h3>
            <p className="cu-modal-time">{new Date(msg.receivedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <button className="cu-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="cu-modal-body">
          <p className="cu-modal-msg">{msg.message}</p>
          {msg.phone && <p className="cu-modal-phone"><Phone size={13} /> {msg.phone}</p>}
        </div>

        <div className="cu-modal-reply">
          <label className="cu-reply-label"><Reply size={14} /> Reply to {msg.email}</label>
          <textarea
            rows={4}
            className="cu-reply-textarea"
            placeholder="Write your reply…"
            value={replyText}
            onChange={e => { setReplyText(e.target.value); setSent(false); }}
          />
          <div className="cu-modal-actions">
            {sent && <span className="cu-reply-sent"><CheckCircle size={14} /> Reply sent</span>}
            <button className="cu-send-reply-btn" onClick={handleSend} disabled={!replyText.trim() || sent || sending}>
              {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
              {sent ? "Sent" : sending ? "Sending…" : "Send Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────
const ContactUsAdmin: React.FC = () => {
  const [data, setData] = useState<ContactUsData>(DEFAULT_DATA);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"inbox" | "hero" | "info" | "form" | "faq">("inbox");
  const [openMsg, setOpenMsg] = useState<ContactMessage | null>(null);

  // ── Fetch settings + messages from API ──────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, msgs] = await Promise.all([
        apiClient("/api/contact/settings"),
        apiClient("/api/contact/messages"),
      ]);

      setData({
        heroVisible:        settings.heroVisible,
        heroTitle:          settings.heroTitle,
        heroSubtitle:       settings.heroSubtitle,
        contactInfoVisible: settings.contactInfoVisible,
        // Normalize contact info IDs from Mongo subdocuments (`_id` -> `id`)[cite: 3]
        contactInfo:        (settings.contactInfo ?? []).map((c: any) => ({
          id:      c.id ?? c._id,
          type:    c.type,
          label:   c.label,
          value:   c.value,
          visible: c.visible,
        })),
        formVisible:    settings.formVisible,
        formTitle:      settings.formTitle,
        formSubtitle:   settings.formSubtitle,
        formSuccessMsg: settings.formSuccessMsg,
        subjectOptions: settings.subjectOptions ?? [],
        faqVisible:     settings.faqVisible,
        faqTitle:       settings.faqTitle,
        // Normalize FAQ item IDs[cite: 3]
        faq:            (settings.faq ?? []).map((f: any) => ({
          id:       f.id ?? f._id,
          question: f.question,
          answer:   f.answer,
          visible:  f.visible,
        })),
      });

      // Normalize message IDs (`_id` -> `id`) to fix missing key warnings and delete failures[cite: 3]
      setMessages((msgs ?? []).map((m: any) => ({ ...m, id: m.id ?? m._id })));
    } catch (err) {
      console.error("Failed to load contact settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Save settings to API ─────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      await apiClient("/api/contact/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (patch: Partial<ContactUsData>) => setData(d => ({ ...d, ...patch }));

  // ── Contact info helpers ─────────────────────────────────────────
  const addContact = () =>
    set({ contactInfo: [...data.contactInfo, { id: uid(), type: "phone", label: "", value: "", visible: true }] });
  const removeContact = (id: string) => set({ contactInfo: data.contactInfo.filter(c => c.id !== id) });
  const patchContact = (id: string, patch: Partial<ContactInfo>) =>
    set({ contactInfo: data.contactInfo.map(c => (c.id === id ? { ...c, ...patch } : c)) });

  // ── FAQ helpers ──────────────────────────────────────────────────
  const addFaq = () =>
    set({ faq: [...data.faq, { id: uid(), question: "", answer: "", visible: true }] });
  const removeFaq = (id: string) => set({ faq: data.faq.filter(f => f.id !== id) });
  const patchFaq = (id: string, patch: Partial<FaqItem>) =>
    set({ faq: data.faq.map(f => (f.id === id ? { ...f, ...patch } : f)) });

  // ── Subject helpers ──────────────────────────────────────────────
  const addSubject = () => set({ subjectOptions: [...data.subjectOptions, ""] });
  const updateSubject = (i: number, val: string) => {
    const arr = [...data.subjectOptions]; arr[i] = val;
    set({ subjectOptions: arr });
  };
  const removeSubject = (i: number) => set({ subjectOptions: data.subjectOptions.filter((_, j) => j !== i) });

  // ── Message helpers — all hit real API ──────────────────────────
  const markRead = async (id: string) => {
    try {
      await apiClient(`/api/contact/messages/${id}/read`, { method: "PATCH" });
      setMessages(ms => ms.map(m => m.id === id ? { ...m, read: true } : m));
    } catch (err) {
      console.error("markRead failed:", err);
    }
  };

  const handleReply = async (id: string, text: string) => {
    try {
      const updated = await apiClient(`/api/contact/messages/${id}/reply`, {
        method: "PATCH",
        body: JSON.stringify({ replyText: text }),
      });
      // Normalize reply response IDs[cite: 3]
      const normalized = { ...updated, id: updated.id ?? updated._id };
      setMessages(ms => ms.map(m => m.id === id ? { ...m, ...normalized } : m));
      setOpenMsg(prev => prev?.id === id ? { ...prev, ...normalized } : prev);
    } catch (err: any) {
      alert("Reply failed: " + err.message);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await apiClient(`/api/contact/messages/${id}`, { method: "DELETE" });
      setMessages(ms => ms.filter(m => m.id !== id));
      if (openMsg?.id === id) setOpenMsg(null);
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const unread = messages.filter(m => !m.read).length;

  const tabs = [
    { key: "inbox", label: "Inbox", icon: <Inbox size={14} />, badge: unread > 0 ? unread : null },
    { key: "hero",  label: "Hero Banner", icon: null, badge: null },
    { key: "info",  label: "Contact Info", icon: null, badge: null },
    { key: "form",  label: "Contact Form", icon: null, badge: null },
    { key: "faq",   label: "FAQ", icon: null, badge: null },
  ];

  if (loading) {
    return (
      <div className="cu-admin" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <Loader2 size={32} className="spin" />
      </div>
    );
  }

  return (
    <div className="cu-admin">
      {/* Header */}
      <div className="cu-admin-header">
        <div>
          <h1 className="cu-admin-title">Contact Us Manager</h1>
          <p className="cu-admin-sub">Control every element of your Contact Us page.</p>
        </div>
        <button className={`cu-save-btn ${saved ? "saved" : ""}`} onClick={save} disabled={saving}>
          {saving ? <Loader2 size={15} className="spin" /> : saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="cu-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`cu-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key as any)}>
            {t.icon && t.icon}
            {t.label}
            {t.badge != null && <span className="cu-tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      <div className="cu-panel">

        {/* ═══════════ INBOX ═══════════ */}
        {activeTab === "inbox" && (
          <div className="cu-section">
            <div className="cu-section-header">
              <h2>Messages <span className="cu-msg-count">{messages.length}</span></h2>
              {unread > 0 && <span className="cu-unread-badge">{unread} unread</span>}
            </div>

            {messages.length === 0 ? (
              <div className="cu-inbox-empty">
                <Inbox size={36} />
                <p>No messages yet</p>
              </div>
            ) : (
              <div className="cu-msg-list">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`cu-msg-row ${!msg.read ? "unread" : ""}`}
                    onClick={() => { setOpenMsg(msg); markRead(msg.id); }}
                  >
                    <div className="cu-msg-dot-col">
                      {!msg.read && <span className="cu-unread-dot" />}
                    </div>
                    <div className="cu-msg-info">
                      <div className="cu-msg-top">
                        <span className="cu-msg-name">{msg.name}</span>
                        <span className="cu-msg-time">
                          {new Date(msg.receivedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <div className="cu-msg-subject-line">
                        <span className="cu-msg-subject-tag">{msg.subject}</span>
                        {msg.replied && <span className="cu-msg-replied"><CheckCircle size={11} /> Replied</span>}
                      </div>
                      <p className="cu-msg-preview">{msg.message.slice(0, 90)}{msg.message.length > 90 ? "…" : ""}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="cu-msg-view-btn"><Eye size={14} /></button>
                      <button className="cu-del-btn" onClick={e => { e.stopPropagation(); deleteMessage(msg.id); }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ HERO ═══════════ */}
        {activeTab === "hero" && (
          <div className="cu-section">
            <div className="cu-section-header">
              <h2>Hero Banner</h2>
              <label className="cu-toggle">
                <input type="checkbox" checked={data.heroVisible} onChange={e => set({ heroVisible: e.target.checked })} />
                <span className="cu-toggle-track" />
                <span className="cu-toggle-label">{data.heroVisible ? "Visible" : "Hidden"}</span>
              </label>
            </div>
            <div className="cu-field"><label>Hero Title</label>
              <input value={data.heroTitle} onChange={e => set({ heroTitle: e.target.value })} placeholder="e.g. Let's Talk." />
            </div>
            <div className="cu-field"><label>Hero Subtitle</label>
              <textarea rows={3} value={data.heroSubtitle} onChange={e => set({ heroSubtitle: e.target.value })} />
            </div>
          </div>
        )}

        {/* ═══════════ INFO ═══════════ */}
        {activeTab === "info" && (
          <div className="cu-section">
            <div className="cu-section-header">
              <h2>Contact Information</h2>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <label className="cu-toggle">
                  <input type="checkbox" checked={data.contactInfoVisible} onChange={e => set({ contactInfoVisible: e.target.checked })} />
                  <span className="cu-toggle-track" />
                  <span className="cu-toggle-label">{data.contactInfoVisible ? "Visible" : "Hidden"}</span>
                </label>
                <button className="cu-add-btn" onClick={addContact}><Plus size={13} /> Add Item</button>
              </div>
            </div>

            <div className="cu-contact-list">
              {data.contactInfo.map(c => {
                const Icon = TYPE_ICON[c.type] || Mail;
                return (
                  <div className={`cu-contact-row ${!c.visible ? "dimmed" : ""}`} key={c.id}>
                    <div className="cu-contact-type-icon"><Icon size={15} /></div>
                    <div className="cu-field cu-field-sm"><label>Type</label>
                      <select value={c.type} onChange={e => patchContact(c.id, { type: e.target.value as any })}>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="address">Address</option>
                        <option value="hours">Hours</option>
                        <option value="website">Website</option>
                      </select>
                    </div>
                    <div className="cu-field cu-field-grow"><label>Label</label>
                      <input value={c.label} onChange={e => patchContact(c.id, { label: e.target.value })} placeholder="e.g. Newsroom Hotline" />
                    </div>
                    <div className="cu-field cu-field-grow"><label>Value</label>
                      <input value={c.value} onChange={e => patchContact(c.id, { value: e.target.value })} placeholder="e.g. +91 98765..." />
                    </div>
                    <div className="cu-row-actions">
                      <label className="cu-toggle cu-toggle-sm">
                        <input type="checkbox" checked={c.visible} onChange={e => patchContact(c.id, { visible: e.target.checked })} />
                        <span className="cu-toggle-track" />
                      </label>
                      <button className="cu-del-btn" onClick={() => removeContact(c.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════ FORM ═══════════ */}
        {activeTab === "form" && (
          <div className="cu-section">
            <div className="cu-section-header">
              <h2>Contact Form</h2>
              <label className="cu-toggle">
                <input type="checkbox" checked={data.formVisible} onChange={e => set({ formVisible: e.target.checked })} />
                <span className="cu-toggle-track" />
                <span className="cu-toggle-label">{data.formVisible ? "Visible" : "Hidden"}</span>
              </label>
            </div>

            <div className="cu-grid-2">
              <div className="cu-field"><label>Form Title</label>
                <input value={data.formTitle} onChange={e => set({ formTitle: e.target.value })} />
              </div>
              <div className="cu-field"><label>Form Subtitle</label>
                <input value={data.formSubtitle} onChange={e => set({ formSubtitle: e.target.value })} />
              </div>
            </div>
            <div className="cu-field"><label>Success Message</label>
              <textarea rows={2} value={data.formSuccessMsg} onChange={e => set({ formSuccessMsg: e.target.value })} />
            </div>

            <div className="cu-divider" />

            <div className="cu-section-header" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0b1423" }}>Subject Options</h3>
              <button className="cu-add-btn" onClick={addSubject}><Plus size={13} /> Add Option</button>
            </div>
            <div className="cu-subjects-list">
              {data.subjectOptions.map((s, i) => (
                <div className="cu-subject-row" key={i}>
                  <input value={s} onChange={e => updateSubject(i, e.target.value)} placeholder="Subject option..." />
                  <button className="cu-del-btn" onClick={() => removeSubject(i)}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ FAQ ═══════════ */}
        {activeTab === "faq" && (
          <div className="cu-section">
            <div className="cu-section-header">
              <h2>FAQ Section</h2>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label className="cu-toggle">
                  <input type="checkbox" checked={data.faqVisible} onChange={e => set({ faqVisible: e.target.checked })} />
                  <span className="cu-toggle-track" />
                  <span className="cu-toggle-label">{data.faqVisible ? "Visible" : "Hidden"}</span>
                </label>
                <button className="cu-add-btn" onClick={addFaq}><Plus size={13} /> Add FAQ</button>
              </div>
            </div>
            <div className="cu-field" style={{ marginBottom: 20 }}><label>Section Title</label>
              <input value={data.faqTitle} onChange={e => set({ faqTitle: e.target.value })} />
            </div>
            <div className="cu-faq-list">
              {data.faq.map((f, i) => (
                <div className={`cu-faq-item ${!f.visible ? "dimmed" : ""}`} key={f.id}>
                  <div className="cu-faq-top">
                    <span className="cu-faq-num">Q{i + 1}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <label className="cu-toggle cu-toggle-sm">
                        <input type="checkbox" checked={f.visible} onChange={e => patchFaq(f.id, { visible: e.target.checked })} />
                        <span className="cu-toggle-track" />
                      </label>
                      <button className="cu-del-btn" onClick={() => removeFaq(f.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="cu-field"><label>Question</label>
                    <input value={f.question} onChange={e => patchFaq(f.id, { question: e.target.value })} placeholder="FAQ question..." />
                  </div>
                  <div className="cu-field"><label>Answer</label>
                    <textarea rows={3} value={f.answer} onChange={e => patchFaq(f.id, { answer: e.target.value })} placeholder="FAQ answer..." />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {openMsg && (
        <MessageModal
          msg={openMsg}
          onClose={() => setOpenMsg(null)}
          onReply={handleReply}
          onMarkRead={markRead}
        />
      )}
    </div>
  );
};

export default ContactUsAdmin;