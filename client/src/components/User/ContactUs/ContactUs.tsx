// client/src/components/User/ContactUs/ContactUs.tsx
// ─────────────────────────────────────────────────────────────
// Fully cleaned, error-free TypeScript component with a unified
// dropdown chat view for multiple enquiries.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Phone, Mail, MapPin, Clock, Globe,
  ChevronRight, Send, CheckCircle,
  Loader2, Plus, Home, Clock3, AlertCircle, History, RefreshCw, User, MessageSquare
} from "lucide-react";
import "./ContactUs.css";
import {
  getContactUsSettings,
  submitContactMessage,
} from "../../../api/user/contactus";
import type {
  ContactUsSettings,
  FaqItem,
  ContactMessageResponse,
} from "../../../api/user/contactus";
import { apiClient } from "../../../api/client";

const USER_EMAIL_KEY = "localnewz_contact_user_email";

const DEFAULT_SUBJECTS = [
  "General Enquiry",
  "News Tip",
  "Correction Request",
  "Advertising",
  "Partnership",
  "Complaint",
  "Other"
];

const getMessagesByEmail = async (email: string): Promise<ContactMessageResponse[]> => {
  const data: any = await apiClient(`/api/contact/messages/email/${email}`);
  return Array.isArray(data) ? data.map(item => ({ ...item, id: item?.id ?? item?._id })) : [];
};

const DEFAULT_DATA: ContactUsSettings = {
  heroVisible: true,
  heroTitle: "Let's Talk.",
  heroSubtitle: "Have a story tip, feedback, or a business enquiry? We'd love to hear from you.",
  contactInfoVisible: true,
  contactInfo: [
    { id: "c1", type: "phone",   label: "Newsroom Hotline",  value: "+91 98765 43210",    visible: true },
    { id: "c2", type: "phone",   label: "Advertising",       value: "+91 91234 56789",    visible: true },
    { id: "c3", type: "email",   label: "General Enquiries", value: "hello@localnewz.in", visible: true },
    { id: "c4", type: "email",   label: "Press & PR",        value: "press@localnewz.in", visible: true },
    { id: "c5", type: "address", label: "Head Office",       value: "Local Newz Media Pvt. Ltd., 4th Floor, Press Building, MG Road, Patna – 800001, Bihar", visible: true },
    { id: "c6", type: "hours",   label: "Office Hours",      value: "Mon – Sat: 9:00 AM – 7:00 PM IST", visible: true },
  ],
  formVisible: true,
  formTitle: "Send Us a Message",
  formSubtitle: "We typically respond within 24 hours on working days.",
  formSuccessMsg: "Thank you! Your message has been received.",
  subjectOptions: DEFAULT_SUBJECTS,
  faqVisible: true,
  faqTitle: "Frequently Asked Questions",
  faq: [
    { id: "f1", question: "How do I submit a news tip?", answer: "Use the contact form above and select 'News Tip' as the subject.", visible: true },
    { id: "f2", question: "How long does it take to get a response?", answer: "We aim to respond within 24–48 working hours.", visible: true },
  ],
};

const TYPE_ICON: Record<string, React.ElementType> = {
  phone: Phone,
  email: Mail,
  address: MapPin,
  hours: Clock,
  website: Globe,
};

const FaqAccordion: React.FC<{ item: FaqItem }> = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`cu-faq-accordion ${open ? "open" : ""}`} onClick={() => setOpen(o => !o)}>
      <div className="cu-faq-q">
        <span>{item.question}</span>
        {open ? <ChevronRight size={17} style={{ transform: "rotate(90deg)" }} /> : <ChevronRight size={17} />}
      </div>
      <div className="cu-faq-a" style={{ maxHeight: open ? 300 : 0 }}>
        <p>{item.answer}</p>
      </div>
    </div>
  );
};

// ─── UNIFIED SINGLE CHAT BOX WITH DROPDOWN SELECTOR ───────────
const MessageHistoryView: React.FC<{
  email: string;
  onNewRequest: () => void;
}> = ({ email, onNewRequest }) => {
  const [messages, setMessages] = useState<ContactMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsgId, setSelectedMsgId] = useState<string>("");
  const [followUpText, setFollowUpText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getMessagesByEmail(email);
      setMessages(data);
      if (data.length > 0 && (!selectedMsgId || !data.some(m => m.id === selectedMsgId))) {
        setSelectedMsgId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) {
      fetchHistory();
    }
  }, [email]);

  const activeMsg = messages.find(m => m.id === selectedMsgId) || messages[0];

  const handleSendFollowUp = async () => {
    if (!followUpText.trim() || !activeMsg) return;
    setSending(true);
    setError(null);
    try {
      await submitContactMessage({
        name: activeMsg.name,
        email: activeMsg.email,
        phone: activeMsg.phone,
        subject: `Follow-up: ${activeMsg.subject || "General Enquiry"}`,
        message: followUpText,
      });
      setFollowUpText("");
      await fetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send follow-up reply.";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0b1423", margin: "0 0 2px 0" }}>My Enquiries Chat</h3>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Showing conversation for <strong>{email}</strong></p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button 
            onClick={fetchHistory}
            disabled={loading}
            style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "7px 12px", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
          >
            <RefreshCw size={13} className={loading ? "spin-icon" : ""} /> Refresh
          </button>
          <button 
            onClick={onNewRequest}
            style={{ background: "#e10600", color: "#fff", border: "none", padding: "7px 14px", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
          >
            <Plus size={14} /> New Enquiry
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}><Loader2 size={24} className="spin-icon" /></div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px", background: "#f8fafc", borderRadius: "8px", color: "#64748b" }}>
          No enquiries found for this email address.
        </div>
      ) : (
        <div>
          {messages.length > 1 && (
            <div style={{ marginBottom: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>Select Enquiry Thread:</span>
              <select
                value={selectedMsgId}
                onChange={(e) => setSelectedMsgId(e.target.value)}
                style={{ flex: 1, maxWidth: "350px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff", color: "#0b1423", fontWeight: 500, outline: "none" }}
              >
                {messages.map((m, idx) => (
                  <option key={m.id} value={m.id}>
                    #{idx + 1} - {m.subject || "General Enquiry"} ({new Date(m.receivedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeMsg && (
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", overflow: "hidden", boxSizing: "border-box" }}>
              <div style={{ background: "#f8fafc", padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#e10600", letterSpacing: "0.05em" }}>{activeMsg.subject || "General Enquiry"}</span>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Started on {new Date(activeMsg.receivedAt).toLocaleDateString()}</div>
                </div>
                <div>
                  {activeMsg.replied ? (
                    <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle size={12} /> Replied
                    </span>
                  ) : (
                    <span style={{ background: "#fef9c3", color: "#a16207", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Clock3 size={12} /> Pending Review
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "16px", background: "#fdfdfd", minHeight: "180px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: "85%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                    <User size={12} /> You ({activeMsg.name})
                  </div>
                  <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "12px 14px", borderRadius: "10px 10px 10px 2px", color: "#1e293b", fontSize: "13px", lineHeight: "1.5", wordBreak: "break-word" }}>
                    {activeMsg.message}
                  </div>
                </div>

                {activeMsg.replyText && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", alignSelf: "flex-end", maxWidth: "85%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: "#1d4ed8", marginBottom: "4px" }}>
                      <MessageSquare size={12} /> Local Newz Team (Admin)
                    </div>
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 14px", borderRadius: "10px 10px 2px 10px", color: "#1e3a8a", fontSize: "13px", lineHeight: "1.5", wordBreak: "break-word" }}>
                      {activeMsg.replyText}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: "#f8fafc", padding: "14px 18px", borderTop: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Continue conversation / Follow-up:</p>
                {error && <div style={{ color: "#ef4444", fontSize: "11px", marginBottom: "6px" }}>{error}</div>}
                <textarea
                  rows={2}
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  placeholder="Type your reply here..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: "8px", background: "#fff" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleSendFollowUp}
                    disabled={sending || !followUpText.trim()}
                    style={{ background: "#0b1423", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {sending ? <Loader2 size={13} className="spin-icon" /> : <Send size={13} />} Send Reply
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── CONTACT FORM ─────────────────────────────────────
const ContactForm: React.FC<{ data: ContactUsSettings; onSuccess: (email: string) => void }> = ({ data, onSuccess }) => {
  const [form, setForm] = useState({
    name: "", email: localStorage.getItem(USER_EMAIL_KEY) || "", phone: "", subject: "", message: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [lookupEmail, setLookupEmail] = useState("");
  const [showLookupModal, setShowLookupModal] = useState(false);

  const subjects = (data.subjectOptions && data.subjectOptions.length > 0) ? data.subjectOptions : DEFAULT_SUBJECTS;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.email.trim())   e.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.message.trim()) e.message = "Message is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setApiError(null);
    setLoading(true);

    try {
      await submitContactMessage({
        name:    form.name,
        email:   form.email,
        phone:   form.phone || undefined,
        subject: form.subject || "General Enquiry",
        message: form.message,
      });
      localStorage.setItem(USER_EMAIL_KEY, form.email);
      onSuccess(form.email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send message. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      {apiError && (
        <div style={{ background: "#ffeeef", color: "#ef4444", padding: "10px", borderRadius: "6px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", border: "1px solid #fecaca" }}>
          <AlertCircle size={14} /> {apiError}
        </div>
      )}

      {showLookupModal ? (
        <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#0b1423" }}>View Previous Enquiries</h4>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px 0" }}>Enter your email address to check all your past messages and admin replies in chat format.</p>
          <input
            type="email"
            value={lookupEmail}
            onChange={(e) => setLookupEmail(e.target.value)}
            placeholder="Enter your email..."
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", marginBottom: "10px", background: "#fff" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                if (lookupEmail.trim()) {
                  localStorage.setItem(USER_EMAIL_KEY, lookupEmail.trim());
                  onSuccess(lookupEmail.trim());
                } else {
                  alert("Please enter a valid email");
                }
              }}
              style={{ background: "#0b1423", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              Fetch Chat History
            </button>
            <button
              onClick={() => setShowLookupModal(false)}
              style={{ background: "#e2e8f0", color: "#334155", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowLookupModal(true)}
            style={{ background: "transparent", border: "none", color: "#e10600", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", textDecoration: "underline" }}
          >
            <History size={13} /> View Previous Enquiries Chat
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "5px" }}>Full Name <span style={{ color: "#e10600" }}>*</span></label>
          <input
            value={form.name}
            onChange={e => setF("name", e.target.value)}
            placeholder="Arjun Sharma"
            disabled={loading}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "#fff" }}
          />
          {errors.name && <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "3px", display: "block" }}>{errors.name}</span>}
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "5px" }}>Email Address <span style={{ color: "#e10600" }}>*</span></label>
          <input
            type="email"
            value={form.email}
            onChange={e => setF("email", e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "#fff" }}
          />
          {errors.email && <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "3px", display: "block" }}>{errors.email}</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "5px" }}>Phone Number <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
          <input
            value={form.phone}
            onChange={e => setF("phone", e.target.value)}
            placeholder="+91 98765 43210"
            disabled={loading}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "#fff" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "5px" }}>Subject</label>
          <select
            value={form.subject}
            onChange={e => setF("subject", e.target.value)}
            disabled={loading}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "#fff", color: "#334155" }}
          >
            <option value="">Select a subject…</option>
            {subjects.map((s: string, i: number) => (
              <option key={`subject-${i}-${s}`} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "5px" }}>Message <span style={{ color: "#e10600" }}>*</span></label>
        <textarea
          rows={4}
          value={form.message}
          onChange={e => setF("message", e.target.value)}
          placeholder="Tell us more about your enquiry…"
          disabled={loading}
          style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "#fff", resize: "vertical" }}
        />
        {errors.message && <span style={{ color: "#ef4444", fontSize: "11px", marginTop: "3px", display: "block" }}>{errors.message}</span>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ width: "100%", background: "#e10600", color: "#fff", border: "none", padding: "12px", borderRadius: "6px", fontWeight: 600, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(225,6,0,0.2)" }}
      >
        {loading
          ? <><Loader2 size={15} className="spin-icon" /> Sending Message…</>
          : <><Send size={15} /> Send Message</>}
      </button>
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────
const ContactUs: React.FC = () => {
  const [data, setData] = useState<ContactUsSettings>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [activeEmail, setActiveEmail] = useState<string | null>(() => {
    return localStorage.getItem(USER_EMAIL_KEY);
  });

  useEffect(() => {
    getContactUsSettings()
      .then((d: ContactUsSettings) => {
        setData(prev => ({
          ...prev,
          ...d,
          subjectOptions: (d.subjectOptions && d.subjectOptions.length > 0) ? d.subjectOptions : DEFAULT_SUBJECTS
        }));
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => setLoading(false));
  }, []);

  const visibleInfo = (data.contactInfo || []).map((item, index) => ({
    ...item,
    id: item.id ?? `contact-${index}`
  })).filter(c => c.visible);

  const visibleFaq = (data.faq || []).map((item, index) => ({
    ...item,
    id: item.id ?? `faq-${index}`
  })).filter((f: FaqItem) => f.visible);

  if (loading) {
    return (
      <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <Loader2 size={32} className="spin-icon" />
      </main>
    );
  }

  return (
    <main className="cu-page">
      {data.heroVisible && (
        <div className="awu-hero">
          <div className="awu-hero-inner">
            <div className="awu-breadcrumb">
              <Link to="/"><Home size={12} /> Home</Link>
              <ChevronRight size={12} />
              <span>Contact Us</span>
            </div>
            <h1>{data.heroTitle}</h1>
            <p>{data.heroSubtitle}</p>
          </div>
        </div>
      )}

      <div className="awu-main" style={{ padding: "40px 20px", maxWidth: "1280px", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "30px", alignItems: "start" }}>
          
          {data.contactInfoVisible && visibleInfo.length > 0 && (
            <aside style={{ background: "#0b1423", borderRadius: "14px", padding: "30px", color: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", boxSizing: "border-box" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px" }}>Get In Touch</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {visibleInfo.map(item => {
                  const Icon = TYPE_ICON[item.type] ?? Mail;
                  return (
                    <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ background: "rgba(255,255,255,0.08)", padding: "8px", borderRadius: "8px", color: "#e10600", flexShrink: 0 }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <span style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: "13px", color: "#f8fafc", wordBreak: "break-word", lineHeight: "1.4" }}>
                          {item.type === "phone" ? (
                            <a href={`tel:${item.value.replace(/\s/g, "")}`} style={{ color: "inherit", textDecoration: "none" }}>{item.value}</a>
                          ) : item.type === "email" ? (
                            <a href={`mailto:${item.value}`} style={{ color: "inherit", textDecoration: "none" }}>{item.value}</a>
                          ) : item.type === "website" ? (
                            <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{item.value}</a>
                          ) : (
                            item.value
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}

          {data.formVisible && (
            <div style={{ background: "#fff", borderRadius: "14px", padding: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", boxSizing: "border-box", overflow: "hidden" }}>
              {activeEmail ? (
                <MessageHistoryView 
                  email={activeEmail} 
                  onNewRequest={() => {
                    localStorage.removeItem(USER_EMAIL_KEY);
                    setActiveEmail(null);
                  }}
                />
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0b1423", margin: "0 0 4px 0" }}>{data.formTitle}</h2>
                      <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{data.formSubtitle}</p>
                    </div>
                  </div>
                  <ContactForm 
                    data={data} 
                    onSuccess={(email) => setActiveEmail(email)} 
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {data.faqVisible && visibleFaq.length > 0 && (
        <section style={{ padding: "30px 20px 60px", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#e10600", letterSpacing: "0.1em" }}>Help Centre</span>
          </div>
          <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: "700", marginBottom: "24px", color: "#0b1423" }}>{data.faqTitle}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {visibleFaq.map((f: FaqItem) => <FaqAccordion key={f.id} item={f} />)}
          </div>
        </section>
      )}
    </main>
  );
};

export default ContactUs;