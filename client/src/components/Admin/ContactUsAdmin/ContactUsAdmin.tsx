import React, { useState, useEffect } from "react";
import {
  Save, CheckCircle, Plus, Trash2, Phone, Mail, MapPin,
  Clock, Globe,  Inbox, Send, Reply, X, Eye
} from "lucide-react";
import "./ContactUsAdmin.css";

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
  contactInfo: [
    { id: "c1", type: "phone", label: "Newsroom Hotline", value: "+91 98765 43210", visible: true },
    { id: "c2", type: "phone", label: "Advertising", value: "+91 91234 56789", visible: true },
    { id: "c3", type: "email", label: "General Enquiries", value: "hello@localnewz.in", visible: true },
    { id: "c4", type: "email", label: "Press & PR", value: "press@localnewz.in", visible: true },
    { id: "c5", type: "address", label: "Head Office", value: "Local Newz Media Pvt. Ltd., 4th Floor, Press Building, MG Road, Patna – 800001, Bihar", visible: true },
    { id: "c6", type: "hours", label: "Office Hours", value: "Mon – Sat: 9:00 AM – 7:00 PM IST", visible: true },
  ],
  formVisible: true,
  formTitle: "Send Us a Message",
  formSubtitle: "We typically respond within 24 hours on working days.",
  formSuccessMsg: "Thank you! Your message has been received. We'll be in touch soon.",
  subjectOptions: ["General Enquiry", "News Tip", "Correction Request", "Advertising", "Partnership", "Complaint", "Other"],
  faqVisible: true,
  faqTitle: "Frequently Asked Questions",
  faq: [
    { id: "f1", question: "How do I submit a news tip?", answer: "Use the contact form above and select 'News Tip' as the subject, or email us directly at editorial@localnewz.in with details and any media.", visible: true },
    { id: "f2", question: "How long does it take to get a response?", answer: "We aim to respond to all enquiries within 24–48 working hours. Urgent matters are prioritised.", visible: true },
    { id: "f3", question: "How can I advertise on Local Newz?", answer: "Reach out to our sales team at ads@localnewz.in or fill the contact form selecting 'Advertising' as your subject.", visible: true },
    { id: "f4", question: "How do I report an error in an article?", answer: "Select 'Correction Request' in the form and include the article URL and the specific correction needed. Our editorial team reviews all requests.", visible: true },
  ],
};

// Sample messages for demo
const SAMPLE_MESSAGES: ContactMessage[] = [
  {
    id: "m1", name: "Ravi Kumar", email: "ravi@example.com", phone: "+91 98765 11111",
    subject: "News Tip", message: "There is a major road collapse near Bailey Road junction. Sending photos separately.",
    receivedAt: "2025-01-14T10:32:00Z", read: false, replied: false,
  },
  {
    id: "m2", name: "Priya Singh", email: "priya@gmail.com",
    subject: "Advertising", message: "We'd like to advertise our new restaurant opening in Patna. Please share your rate card.",
    receivedAt: "2025-01-13T15:10:00Z", read: true, replied: true, replyText: "Hi Priya, please find the rate card attached. Looking forward to working with you.",
  },
  {
    id: "m3", name: "Amit Jha", email: "amit.jha@company.in",
    subject: "Correction Request", message: "The article about Ganga water levels published on Jan 12 has incorrect data. The level was 48.2m not 42.8m.",
    receivedAt: "2025-01-12T08:55:00Z", read: true, replied: false,
  },
];

const TYPE_ICON: Record<string, React.FC<any>> = {
  phone: Phone, email: Mail, address: MapPin, hours: Clock, website: Globe,
};

// ─── MESSAGE DETAIL MODAL ──────────────────────────────────────────
const MessageModal: React.FC<{
  msg: ContactMessage;
  onClose: () => void;
  onReply: (id: string, text: string) => void;
  onMarkRead: (id: string) => void;
}> = ({ msg, onClose, onReply, onMarkRead }) => {
  const [replyText, setReplyText] = useState(msg.replyText || "");
  const [sent, setSent] = useState(msg.replied);

  useEffect(() => { if (!msg.read) onMarkRead(msg.id); }, []);

  const handleSend = () => {
    if (!replyText.trim()) return;
    onReply(msg.id, replyText);
    setSent(true);
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
            <button className="cu-send-reply-btn" onClick={handleSend} disabled={!replyText.trim() || sent}>
              <Send size={14} /> {sent ? "Sent" : "Send Reply"}
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
  const [messages, setMessages] = useState<ContactMessage[]>(SAMPLE_MESSAGES);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"inbox" | "hero" | "info" | "form" | "faq">("inbox");
  const [openMsg, setOpenMsg] = useState<ContactMessage | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("localNewzContactData");
      if (stored) setData(JSON.parse(stored));
      const storedMsgs = localStorage.getItem("localNewzContactMessages");
      if (storedMsgs) setMessages(JSON.parse(storedMsgs));
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem("localNewzContactData", JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (patch: Partial<ContactUsData>) => setData(d => ({ ...d, ...patch }));

  // contact info helpers
  const addContact = () =>
    set({ contactInfo: [...data.contactInfo, { id: uid(), type: "phone", label: "", value: "", visible: true }] });
  const removeContact = (id: string) => set({ contactInfo: data.contactInfo.filter(c => c.id !== id) });
  const patchContact = (id: string, patch: Partial<ContactInfo>) =>
    set({ contactInfo: data.contactInfo.map(c => (c.id === id ? { ...c, ...patch } : c)) });

  // faq helpers
  const addFaq = () =>
    set({ faq: [...data.faq, { id: uid(), question: "", answer: "", visible: true }] });
  const removeFaq = (id: string) => set({ faq: data.faq.filter(f => f.id !== id) });
  const patchFaq = (id: string, patch: Partial<FaqItem>) =>
    set({ faq: data.faq.map(f => (f.id === id ? { ...f, ...patch } : f)) });

  // subject helpers
  const addSubject = () => set({ subjectOptions: [...data.subjectOptions, ""] });
  const updateSubject = (i: number, val: string) => {
    const arr = [...data.subjectOptions]; arr[i] = val;
    set({ subjectOptions: arr });
  };
  const removeSubject = (i: number) => set({ subjectOptions: data.subjectOptions.filter((_, j) => j !== i) });

  // message helpers
  const markRead = (id: string) => setMessages(ms => ms.map(m => m.id === id ? { ...m, read: true } : m));
  const handleReply = (id: string, text: string) => {
    const updated = messages.map(m => m.id === id ? { ...m, replied: true, replyText: text, read: true } : m);
    setMessages(updated);
    localStorage.setItem("localNewzContactMessages", JSON.stringify(updated));
  };

  const unread = messages.filter(m => !m.read).length;

  const tabs = [
    { key: "inbox", label: "Inbox", icon: <Inbox size={14} />, badge: unread > 0 ? unread : null },
    { key: "hero", label: "Hero Banner", icon: null },
    { key: "info", label: "Contact Info", icon: null },
    { key: "form", label: "Contact Form", icon: null },
    { key: "faq", label: "FAQ", icon: null },
  ];

  return (
    <div className="cu-admin">
      {/* Header */}
      <div className="cu-admin-header">
        <div>
          <h1 className="cu-admin-title">Contact Us Manager</h1>
          <p className="cu-admin-sub">Control every element of your Contact Us page.</p>
        </div>
        <button className={`cu-save-btn ${saved ? "saved" : ""}`} onClick={save}>
          {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
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
                    <button className="cu-msg-view-btn"><Eye size={14} /></button>
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

      {/* Float Save */}
      <button className={`cu-float-save ${saved ? "saved" : ""}`} onClick={save}>
        {saved ? <CheckCircle size={17} /> : <Save size={17} />}
      </button>

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