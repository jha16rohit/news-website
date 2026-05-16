// client/src/components/User/ContactUs/ContactUs.tsx
// ─────────────────────────────────────────────────────────────
// Fully wired to real backend. No localStorage.
// On submit → POST /api/contact/messages → stored in DB → email to admin.
// Success screen polls GET /api/contact/messages/:id for admin reply.

import React, { useState, useEffect, useRef } from "react";
import {
  Phone, Mail, MapPin, Clock, Globe,
  ChevronDown, ChevronUp, Send, CheckCircle,
  MessageSquare, RefreshCw, Loader2, X,
} from "lucide-react";
import "./ContactUs.css";
import {
  getContactUsSettings,
  submitContactMessage,
  getMessageById,
} from "../../../api/user/contactus";
import type {
  ContactUsSettings,
  FaqItem,
} from "../../../api/user/contactus";

// ─── Default fallback (shown while API loads) ───────────────────
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
  formSuccessMsg: "Thank you! Your message has been received. We'll be in touch soon.",
  subjectOptions: ["General Enquiry", "News Tip", "Correction Request", "Advertising", "Partnership", "Complaint", "Other"],
  faqVisible: true,
  faqTitle: "Frequently Asked Questions",
  faq: [
    { id: "f1", question: "How do I submit a news tip?", answer: "Use the contact form above and select 'News Tip' as the subject, or email us directly at editorial@localnewz.in.", visible: true },
    { id: "f2", question: "How long does it take to get a response?", answer: "We aim to respond within 24–48 working hours.", visible: true },
    { id: "f3", question: "How can I advertise on Local Newz?", answer: "Reach out to our sales team at ads@localnewz.in or fill the contact form.", visible: true },
    { id: "f4", question: "How do I report an error in an article?", answer: "Select 'Correction Request' in the form and include the article URL.", visible: true },
  ],
};

// Map contact info type → lucide icon
const TYPE_ICON: Record<string, React.ElementType> = {
  phone: Phone,
  email: Mail,
  address: MapPin,
  hours: Clock,
  website: Globe,
};

// ─── FAQ ACCORDION ──────────────────────────────────────────────
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

// ─── SUCCESS SCREEN with reply polling ─────────────────────────
const SuccessScreen: React.FC<{
  msgId: string;
  successMsg: string;
  onReset: () => void;
}> = ({ msgId, successMsg, onReset }) => {
  const [reply,    setReply]    = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [newReply, setNewReply] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkReply = async (): Promise<boolean> => {
    try {
      const msg = await getMessageById(msgId);
      if (msg?.replied && msg?.replyText) {
        setReply(prev => {
          if (!prev) setNewReply(true);
          return msg.replyText!;
        });
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

 useEffect(() => {
  checkReply();
}, [msgId]);

  useEffect(() => {
    if (newReply) {
      const t = setTimeout(() => setNewReply(false), 4000);
      return () => clearTimeout(t);
    }
  }, [newReply]);

  const handleManualCheck = async () => {
    setChecking(true);
    await checkReply();
    setTimeout(() => setChecking(false), 700);
  };

  return (
    <div className="cu-form-success">
      <div className="cu-success-icon"><CheckCircle size={38} /></div>
      <h3>{successMsg}</h3>
      <div className="cu-reply-area">
        {reply ? (
          <div className={`cu-reply-bubble ${newReply ? "cu-reply-new" : ""}`}>
            <div className="cu-reply-bubble-header">
              <MessageSquare size={14} /><span>Reply from Local Newz</span>
            </div>
            <p className="cu-reply-bubble-text">{reply}</p>
          </div>
        ) : (
          <div className="cu-awaiting-reply">
            <div className="cu-awaiting-icon"><MessageSquare size={16} /></div>
            <p>Waiting for a reply from the team…</p>
            <button
              className={`cu-check-reply-btn ${checking ? "checking" : ""}`}
              onClick={handleManualCheck}
              disabled={checking}
            >
              {checking
                ? <><span className="cu-spinner-sm" /> Checking…</>
                : <><RefreshCw size={13} /> Check for Reply</>}
            </button>
          </div>
        )}
      </div>
      <button className="cu-success-back" onClick={onReset}>Send Another Message</button>
    </div>
  );
};

// ─── CONTACT FORM ───────────────────────────────────────────────
const ContactForm: React.FC<{ data: ContactUsSettings }> = ({ data }) => {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
  });
  const [sentMsgId, setSentMsgId] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [apiError,  setApiError]  = useState<string | null>(null);

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
      const msg = await submitContactMessage({
        name:    form.name,
        email:   form.email,
        phone:   form.phone || undefined,
        subject: form.subject || "General Enquiry",
        message: form.message,
      });
      setSentMsgId(msg.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send message. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
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
      {apiError && (
        <div className="cu-form-api-error">
          <X size={14} />{apiError}
        </div>
      )}

      <div className="cu-form-row">
        <div className="cu-form-field">
          <label>Full Name <span>*</span></label>
          <input
            value={form.name}
            onChange={e => setF("name", e.target.value)}
            placeholder="Arjun Sharma"
            disabled={loading}
          />
          {errors.name && <span className="cu-form-error">{errors.name}</span>}
        </div>
        <div className="cu-form-field">
          <label>Email Address <span>*</span></label>
          <input
            type="email"
            value={form.email}
            onChange={e => setF("email", e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
          />
          {errors.email && <span className="cu-form-error">{errors.email}</span>}
        </div>
      </div>

      <div className="cu-form-row">
        <div className="cu-form-field">
          <label>Phone Number <span className="cu-optional">(optional)</span></label>
          <input
            value={form.phone}
            onChange={e => setF("phone", e.target.value)}
            placeholder="+91 98765 43210"
            disabled={loading}
          />
        </div>
        <div className="cu-form-field">
          <label>Subject</label>
          <select
            value={form.subject}
            onChange={e => setF("subject", e.target.value)}
            disabled={loading}
          >
            <option value="">Select a subject…</option>
           {(data.subjectOptions || []).map((s: string, i: number) => (
  <option key={i} value={s}>
    {s}
  </option>
))}
          </select>
        </div>
      </div>

      <div className="cu-form-field">
        <label>Message <span>*</span></label>
        <textarea
          rows={5}
          value={form.message}
          onChange={e => setF("message", e.target.value)}
          placeholder="Tell us more about your enquiry…"
          disabled={loading}
        />
        {errors.message && <span className="cu-form-error">{errors.message}</span>}
      </div>

      <button
        className={`cu-submit-btn ${loading ? "loading" : ""}`}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <><Loader2 size={15} className="spin-icon" /> Sending…</>
          : <><Send size={15} /> Send Message</>}
      </button>
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────
const ContactUs: React.FC = () => {
  const [data,    setData]    = useState<ContactUsSettings>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContactUsSettings()
      .then((d: ContactUsSettings) => setData(d))
      .catch(() => { /* keep defaults */ })
      .finally(() => setLoading(false));
  }, []);

  const visibleInfo = data.contactInfo.filter(c => c.visible);
  const visibleFaq  = data.faq.filter((f: FaqItem) => f.visible);

  if (loading) {
    return (
      <main className="cu-page cu-loading">
        <Loader2 size={32} className="spin-icon" />
      </main>
    );
  }

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

      {/* ══════════ INFO + FORM ══════════ */}
      <section className="cu-main-section">
        <div className="cu-container">
          <div className="cu-main-grid">

            {data.contactInfoVisible && visibleInfo.length > 0 && (
              <aside className="cu-info-panel">
                <h2 className="cu-panel-title">Get In Touch</h2>
                <div className="cu-info-list">
                  {visibleInfo.map(item => {
                    const Icon = TYPE_ICON[item.type] ?? Mail;
                    return (
                      <div className="cu-info-item" key={item.id}>
                        <div className="cu-info-icon"><Icon size={17} /></div>
                        <div>
                          <span className="cu-info-label">{item.label}</span>
                          <span className="cu-info-value">
                            {item.type === "phone"
                              ? <a href={`tel:${item.value.replace(/\s/g, "")}`}>{item.value}</a>
                              : item.type === "email"
                              ? <a href={`mailto:${item.value}`}>{item.value}</a>
                              : item.type === "website"
                              ? <a href={item.value} target="_blank" rel="noopener noreferrer">{item.value}</a>
                              : item.value}
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
              {visibleFaq.map((f: FaqItem) => <FaqAccordion key={f.id} item={f} />)}
            </div>
          </div>
        </section>
      )}

    </main>
  );
};

export default ContactUs;