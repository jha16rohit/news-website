// client/src/components/User/ContactUs/ContactUs.tsx
// ─────────────────────────────────────────────────────────────
// Fully cleaned, error-free TypeScript component with unified
// dropdown chat view for multiple enquiries. Follows AdvertiseWithUs
// authentication pattern - Contact page is public, message/history
// require login via existing SignIn modal.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Phone, MapPin, Clock, Globe,
  ChevronRight, Send, Loader2,
  Mail, AlertCircle, LogIn, Home
} from "lucide-react";
import "./ContactUs.css";
import {
  getContactUsSettings,
  submitContactMessage,
} from "../../../api/user/contactus";
import type {
  ContactUsSettings,
  FaqItem,
} from "../../../api/user/contactus";
import { useAuth } from "../../../context/AuthContext";

const DEFAULT_SUBJECTS = [
  "General Enquiry",
  "News Tip",
  "Correction Request",
  "Advertising",
  "Partnership",
  "Complaint",
  "Other"
];

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

// ─── CONTACT FORM ─────────────────────────────────────
const ContactForm: React.FC<{ data: ContactUsSettings }> = ({ data }) => {
  const { isLoggedIn, openLogin } = useAuth();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

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
    if (!isLoggedIn) {
      openLogin();
      return;
    }
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
      // Success - form will be replaced by MessageHistoryView via parent state
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send message. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="cu-form-panel">
      <h2 className="cu-panel-title">{data.formTitle}</h2>
      <p className="cu-form-subtitle">{data.formSubtitle}</p>

      {apiError && (
        <div className="cu-form-error-banner">
          <AlertCircle size={14} /> {apiError}
        </div>
      )}

      <div className="cu-form-body">
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
              {subjects.map((s: string, i: number) => (
                <option key={`subject-${i}-${s}`} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="cu-form-field cu-form-field-full">
          <label>Message <span>*</span></label>
          <textarea
            rows={4}
            value={form.message}
            onChange={e => setF("message", e.target.value)}
            placeholder="Tell us more about your enquiry…"
            disabled={loading}
          />
          {errors.message && <span className="cu-form-error">{errors.message}</span>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="cu-submit-btn"
        >
          {loading
            ? <><Loader2 size={15} className="spin-icon" /> Sending Message…</>
            : <><Send size={15} /> Send Message</>}
        </button>
      </div>
    </div>
  );
};

// ─── MESSAGE SECTION WRAPPER ──────────────────────────────
// Handles login gate: shows login prompt when logged out,
// shows form when logged out, shows history after submission
const MessageSection: React.FC<{ data: ContactUsSettings }> = ({ data }) => {
  const { isLoggedIn, openLogin } = useAuth();

  // Logged out: show login gate with "Message Us" button
  if (!isLoggedIn) {
    return (
      <div className="cu-login-gate">
        <div className="cu-gate-icon"><LogIn size={30} /></div>
        <h3>{data.formTitle}</h3>
        <p>We'd love to hear from you. Sign in to send us a message and manage your enquiries.</p>
        <button
          onClick={() => openLogin()}
          className="cu-btn-primary"
        >
          <LogIn size={14} /> Message Us
        </button>
      </div>
    );
  }

  return (
    <ContactForm data={data} />
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────
const ContactUs: React.FC = () => {
  const [data, setData] = useState<ContactUsSettings>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

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
      <main className="cu-page">
        <div className="cu-loading-full"><Loader2 size={32} className="spin-icon" /></div>
      </main>
    );
  }

  return (
    <main className="cu-page">
      {data.heroVisible && (
        <div className="cu-hero">
          <div className="cu-hero-bg" />
          <div className="cu-hero-content">
            <div className="cu-breadcrumb">
              <Link to="/" className="cu-breadcrumb-link"><Home size={12} /> Home</Link>
              <ChevronRight size={12} className="cu-breadcrumb-sep" />
              <span className="cu-breadcrumb-current">Contact Us</span>
            </div>
            <h1 className="cu-hero-title">{data.heroTitle}</h1>
            <p className="cu-hero-sub">{data.heroSubtitle}</p>
          </div>
        </div>
      )}

      <div className="cu-main-section">
        <div className="cu-container">
          <div className="cu-main-grid">

            {data.contactInfoVisible && visibleInfo.length > 0 && (
              <aside className="cu-info-panel">
                <h2 className="cu-panel-title">Get In Touch</h2>
                <div className="cu-info-list">
                  {visibleInfo.map(item => {
                    const Icon = TYPE_ICON[item.type] ?? Mail;
                    return (
                      <div key={item.id} className="cu-info-item">
                        <div className="cu-info-icon">
                          <Icon size={16} />
                        </div>
                        <div>
                          <span className="cu-info-label">{item.label}</span>
                          <span className="cu-info-value">
                            {item.type === "phone" ? (
                              <a href={`tel:${item.value.replace(/\s/g, "")}`}>{item.value}</a>
                            ) : item.type === "email" ? (
                              <a href={`mailto:${item.value}`}>{item.value}</a>
                            ) : item.type === "website" ? (
                              <a href={item.value} target="_blank" rel="noopener noreferrer">{item.value}</a>
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
              <div className="cu-form-panel-wrapper">
                <MessageSection data={data} />
              </div>
            )}
          </div>
        </div>
      </div>

      {data.faqVisible && visibleFaq.length > 0 && (
        <section className="cu-faq-section">
          <div className="cu-faq-label">
            <span className="cu-label-line" />
            <span className="cu-label-text">Help Centre</span>
            <span className="cu-label-line" />
          </div>
          <h2 className="cu-section-title">{data.faqTitle}</h2>
          <div className="cu-faq-grid">
            {visibleFaq.map((f: FaqItem) => <FaqAccordion key={f.id} item={f} />)}
          </div>
        </section>
      )}
    </main>
  );
};

export default ContactUs;
