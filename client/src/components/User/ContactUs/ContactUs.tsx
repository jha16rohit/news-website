import React, { useState, useEffect, useRef } from "react";
import { Phone, Mail, MapPin, Clock, Globe, ChevronDown, ChevronUp, Send, CheckCircle, MessageSquare, RefreshCw } from "lucide-react";
import "./ContactUs.css";

// ─── TYPES ─────────────────────────────────────────────────────────
interface ContactInfo {
  id: string; type: "phone" | "email" | "address" | "hours" | "website";
  label: string; value: string; visible: boolean;
}
interface FaqItem { id: string; question: string; answer: string; visible: boolean; }
interface ContactUsData {
  heroVisible: boolean; heroTitle: string; heroSubtitle: string;
  contactInfoVisible: boolean; contactInfo: ContactInfo[];
  formVisible: boolean; formTitle: string; formSubtitle: string;
  formSuccessMsg: string; subjectOptions: string[];
  faqVisible: boolean; faqTitle: string; faq: FaqItem[];
}

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

const TYPE_ICON: Record<string, any> = {
  phone: Phone, email: Mail, address: MapPin, hours: Clock, website: Globe,
};

// ─── Helper: read a message by id from localStorage ────────────────
const getMsgById = (id: string) => {
  try {
    const stored = localStorage.getItem("localNewzContactMessages");
    const msgs: any[] = stored ? JSON.parse(stored) : [];
    return msgs.find(m => m.id === id) || null;
  } catch { return null; }
};

// ─── FAQ ACCORDION ─────────────────────────────────────────────────
const FaqAccordion: React.FC<{ item: FaqItem }> = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`cu-faq-accordion ${open ? "open" : ""}`} onClick={() => setOpen(o => !o)}>
      <div className="cu-faq-q">
        <span>{item.question}</span>
        {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </div>
      <div className="cu-faq-a" style={{ maxHeight: open ? 300 : 0 }}>
        <p>{item.answer}</p>
      </div>
    </div>
  );
};

// ─── SUCCESS SCREEN with reply polling ─────────────────────────────
const SuccessScreen: React.FC<{
  msgId: string;
  successMsg: string;
  onReset: () => void;
}> = ({ msgId, successMsg, onReset }) => {
  const [reply, setReply] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [newReply, setNewReply] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkReply = (): boolean => {
    const msg = getMsgById(msgId);
    if (msg?.replied && msg?.replyText) {
      setReply((prev) => {
        if (!prev) setNewReply(true); // first time we find a reply
        return msg.replyText;
      });
      return true;
    }
    return false;
  };

  // Auto-poll every 4s until reply is found
  useEffect(() => {
    checkReply();
    pollRef.current = setInterval(() => {
      const found = checkReply();
      if (found && pollRef.current) clearInterval(pollRef.current);
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [msgId]);

  // Remove "new" highlight after 4s
  useEffect(() => {
    if (newReply) {
      const t = setTimeout(() => setNewReply(false), 4000);
      return () => clearTimeout(t);
    }
  }, [newReply]);

  const handleManualCheck = () => {
    setChecking(true);
    setTimeout(() => { checkReply(); setChecking(false); }, 700);
  };

  return (
    <div className="cu-form-success">
      <div className="cu-success-icon"><CheckCircle size={38} /></div>
      <h3>{successMsg}</h3>

      <div className="cu-reply-area">
        {reply ? (
          /* ── Reply received ── */
          <div className={`cu-reply-bubble ${newReply ? "cu-reply-new" : ""}`}>
            <div className="cu-reply-bubble-header">
              <MessageSquare size={14} />
              <span>Reply from Local Newz</span>
            </div>
            <p className="cu-reply-bubble-text">{reply}</p>
          </div>
        ) : (
          /* ── Awaiting reply ── */
          <div className="cu-awaiting-reply">
            <div className="cu-awaiting-icon">
              <MessageSquare size={16} />
            </div>
            <p>Waiting for a reply from the team…</p>
            <button
              className={`cu-check-reply-btn ${checking ? "checking" : ""}`}
              onClick={handleManualCheck}
              disabled={checking}
            >
              {checking
                ? <><span className="cu-spinner-sm" /> Checking…</>
                : <><RefreshCw size={13} /> Check for Reply</>
              }
            </button>
          </div>
        )}
      </div>

      <button className="cu-success-back" onClick={onReset}>Send Another Message</button>
    </div>
  );
};

// ─── CONTACT FORM ──────────────────────────────────────────────────
const ContactForm: React.FC<{ data: ContactUsData }> = ({ data }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sentMsgId, setSentMsgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.message.trim()) e.message = "Message is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    const msgId = Math.random().toString(36).slice(2, 10);
    const msg = {
      id: msgId,
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      subject: form.subject || "General Enquiry",
      message: form.message,
      receivedAt: new Date().toISOString(),
      read: false,
      replied: false,
    };

    try {
      const stored = localStorage.getItem("localNewzContactMessages");
      const msgs = stored ? JSON.parse(stored) : [];
      msgs.unshift(msg);
      localStorage.setItem("localNewzContactMessages", JSON.stringify(msgs));
    } catch {}

    setTimeout(() => { setLoading(false); setSentMsgId(msgId); }, 1200);
  };

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  if (sentMsgId) {
    return (
      <SuccessScreen
        msgId={sentMsgId}
        successMsg={data.formSuccessMsg}
        onReset={() => {
          setSentMsgId(null);
          setForm({ name: "", email: "", phone: "", subject: "", message: "" });
        }}
      />
    );
  }

  return (
    <div className="cu-form-body">
      <div className="cu-form-row">
        <div className="cu-form-field">
          <label>Full Name <span>*</span></label>
          <input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Arjun Sharma" />
          {errors.name && <span className="cu-form-error">{errors.name}</span>}
        </div>
        <div className="cu-form-field">
          <label>Email Address <span>*</span></label>
          <input type="email" value={form.email} onChange={e => setF("email", e.target.value)} placeholder="you@example.com" />
          {errors.email && <span className="cu-form-error">{errors.email}</span>}
        </div>
      </div>

      <div className="cu-form-row">
        <div className="cu-form-field">
          <label>Phone Number <span className="cu-optional">(optional)</span></label>
          <input value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <div className="cu-form-field">
          <label>Subject</label>
          <select value={form.subject} onChange={e => setF("subject", e.target.value)}>
            <option value="">Select a subject…</option>
            {data.subjectOptions.map((s, i) => <option key={i} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="cu-form-field">
        <label>Message <span>*</span></label>
        <textarea rows={5} value={form.message} onChange={e => setF("message", e.target.value)}
          placeholder="Tell us more about your enquiry…" />
        {errors.message && <span className="cu-form-error">{errors.message}</span>}
      </div>

      <button className={`cu-submit-btn ${loading ? "loading" : ""}`} onClick={handleSubmit} disabled={loading}>
        {loading ? <span className="cu-spinner" /> : <><Send size={15} /> Send Message</>}
      </button>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────
const ContactUs: React.FC = () => {
  const [data, setData] = useState<ContactUsData>(DEFAULT_DATA);

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem("localNewzContactData");
        if (stored) setData(JSON.parse(stored));
      } catch {}
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const visibleInfo = data.contactInfo.filter(c => c.visible);
  const visibleFaq = data.faq.filter(f => f.visible);

  return (
    <main className="cu-page">

      {/* ══════════ HERO ══════════ */}
      {data.heroVisible && (
        <section className="cu-hero">
          <div className="cu-hero-bg" />
          <div className="cu-hero-content">
            <p className="cu-hero-tag"><span className="cu-dot" /> Contact Us</p>
            <h1 className="cu-hero-title">{data.heroTitle}</h1>
            <p className="cu-hero-sub">{data.heroSubtitle}</p>
          </div>
        </section>
      )}

      {/* ══════════ CONTACT INFO + FORM ══════════ */}
      <section className="cu-main-section">
        <div className="cu-container">
          <div className="cu-main-grid">

            {data.contactInfoVisible && visibleInfo.length > 0 && (
              <aside className="cu-info-panel">
                <h2 className="cu-panel-title">Get In Touch</h2>
                <div className="cu-info-list">
                  {visibleInfo.map(item => {
                    const Icon = TYPE_ICON[item.type] || Mail;
                    return (
                      <div className="cu-info-item" key={item.id}>
                        <div className="cu-info-icon"><Icon size={17} /></div>
                        <div>
                          <span className="cu-info-label">{item.label}</span>
                          <span className="cu-info-value">
                            {item.type === "phone" ? (
                              <a href={`tel:${item.value.replace(/\s/g, "")}`}>{item.value}</a>
                            ) : item.type === "email" ? (
                              <a href={`mailto:${item.value}`}>{item.value}</a>
                            ) : item.type === "website" ? (
                              <a href={item.value} target="_blank" rel="noopener noreferrer">{item.value}</a>
                            ) : item.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>
            )}

            {data.formVisible && (
              <div className="cu-form-panel">
                <h2 className="cu-panel-title">{data.formTitle}</h2>
                <p className="cu-form-subtitle">{data.formSubtitle}</p>
                <ContactForm data={data} />
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      {data.faqVisible && visibleFaq.length > 0 && (
        <section className="cu-faq-section">
          <div className="cu-container">
            <div className="cu-faq-label">
              <span className="cu-label-line" />
              <span className="cu-label-text">Help Centre</span>
              <span className="cu-label-line" />
            </div>
            <h2 className="cu-section-title">{data.faqTitle}</h2>
            <div className="cu-faq-grid">
              {visibleFaq.map(f => <FaqAccordion key={f.id} item={f} />)}
            </div>
          </div>
        </section>
      )}

    </main>
  );
};

export default ContactUs;