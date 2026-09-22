import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Phone, MapPin, Clock, Globe, ChevronRight, Mail, Home, Loader2 } from "lucide-react";
import "./ContactUs.css";
import { getContactUsSettings, getMyMessages } from "../../../api/user/contactus";
import type { ContactUsSettings, FaqItem } from "../../../api/user/contactus";
import type { ContactMessageResponse } from "../../../api/user/contactus";
import { useAuth } from "../../../context/AuthContext";
import ContactForm from "./ContactForm";
import MessageHistory from "./MessageHistory";
import MessageDetail from "./MessageDetail";
import SuccessState from "./SuccessState";

const DEFAULT_SUBJECTS = [
  "General Enquiry",
  "News Tip",
  "Correction Request",
  "Advertising",
  "Partnership",
  "Complaint",
  "Other",
];

const DEFAULT_DATA: ContactUsSettings = {
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
  formSuccessMsg: "Thank you! Your message has been received.",
  subjectOptions: DEFAULT_SUBJECTS,
  faqVisible: true,
  faqTitle: "Frequently Asked Questions",
  faq: [
    { id: "f1", question: "How do I submit a news tip?", answer: "Use the contact form above and select 'News Tip' as the subject.", visible: true },
    { id: "f2", question: "How long does it take to get a response?", answer: "We aim to respond within 24–48 working hours.", visible: true },
    { id: "f3", question: "How can I advertise on Local Newz?", answer: "Reach out at ads@localnewz.in or fill the contact form selecting 'Advertising' as your subject.", visible: true },
    { id: "f4", question: "How do I report an error in an article?", answer: "Select 'Correction Request' in the form and include the article URL and the specific correction needed.", visible: true },
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
    <div className={`cu-faq-accordion ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)} aria-expanded={open}>
      <div className="cu-faq-q">
        <span>{item.question}</span>
        {open ? <ChevronRight size={17} style={{ transform: "rotate(90deg)" }} /> : <ChevronRight size={17} />}
      </div>
      <div className="cu-faq-a" style={{ maxHeight: open ? 300 : 0 }} aria-hidden={!open}>
        <p>{item.answer}</p>
      </div>
    </div>
  );
};

type RightPanel = "form" | "success" | "history" | "detail";

const ContactUs: React.FC = () => {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const location = useLocation();
  const [data, setData] = useState<ContactUsSettings>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [initializingPanel, setInitializingPanel] = useState(true);
  const [panel, setPanel] = useState<RightPanel>("form");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageResponse | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    getContactUsSettings()
      .then((d: ContactUsSettings) => {
        setData((prev) => ({
          ...prev,
          ...d,
          subjectOptions: d.subjectOptions && d.subjectOptions.length > 0 ? d.subjectOptions : DEFAULT_SUBJECTS,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Determine initial right panel based on auth + existing messages
  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setPanel("form");
      setSelectedMessage(null);
      setInitializingPanel(false);
      return;
    }
    // Logged in: fetch latest messages to decide
    setInitializingPanel(true);
    getMyMessages()
      .then((msgs) => {
        if (msgs && msgs.length > 0) setPanel("history");
        else setPanel("form");
      })
      .catch(() => setPanel("form"))
      .finally(() => setInitializingPanel(false));
    // Re-run when auth changes or user navigates back to /contact
  }, [isLoggedIn, authLoading, location.key]);

  const visibleInfo = (data.contactInfo || [])
    .map((item, index) => ({ ...item, id: item.id ?? `contact-${index}` }))
    .filter((c) => c.visible);

  const visibleFaq = (data.faq || [])
    .map((item, index) => ({ ...item, id: item.id ?? `faq-${index}` }))
    .filter((f: FaqItem) => f.visible);

  const handleSuccess = () => setPanel("success");
  const handleSendAnother = () => { setFormKey((k) => k + 1); setPanel("form"); };
  const handleViewMessages = () => setPanel("history");
  const handleMessageSelect = (msg: ContactMessageResponse) => { setSelectedMessage(msg); setPanel("detail"); };
  const handleBackToHistory = () => setPanel("history");
  const handleNewMessage = () => { setFormKey((k) => k + 1); setPanel("form"); };
  const handleDeleteSuccess = (deletedId: string) => {
    if (selectedMessage && selectedMessage.id === deletedId) {
      setSelectedMessage(null);
      setPanel("history");
    }
  };

  if (loading || initializingPanel || authLoading) {
    return (
      <main className="cu-page">
        <div className="cu-loading-full"><Loader2 size={32} className="spin-icon" /></div>
      </main>
    );
  }

  return (
    <main className="cu-page">
      {data.heroVisible && (
        <div className="cu-hero cu-hero--light">
          <div className="cu-container">
            <div className="cu-breadcrumb">
              <Link to="/" className="cu-breadcrumb-link"><Home size={12} /> Home</Link>
              <ChevronRight size={12} className="cu-breadcrumb-sep" />
              <span className="cu-breadcrumb-current">Contact Us</span>
            </div>
            <h1 className="cu-hero-title">
              {data.heroTitle?.replace(/\.$/, "") || "Let's Talk"}<span className="cu-hero-dot">.</span>
            </h1>
            <p className="cu-hero-sub">{data.heroSubtitle}</p>
            <div className="cu-hero-accent" aria-hidden="true" />
          </div>
        </div>
      )}

      <div className="cu-main-section">
        <div className="cu-container">
          <div className="cu-main-grid">
            {data.contactInfoVisible && visibleInfo.length > 0 && (
              <aside className="cu-info-panel">
                <h2 className="cu-panel-title">Get In Touch</h2>
                <p className="cu-info-subtitle">Reach our editorial and business teams directly.</p>
                <div className="cu-info-list">
                  {visibleInfo.map((item) => {
                    const Icon = TYPE_ICON[item.type] ?? Mail;
                    return (
                      <div key={item.id} className="cu-info-item">
                        <div className="cu-info-icon"><Icon size={16} /></div>
                        <div className="cu-info-content">
                          <span className="cu-info-label">{item.label}</span>
                          <span className="cu-info-value">
                            {item.type === "phone" ? (
                              <a href={`tel:${item.value.replace(/\s/g, "")}`}>{item.value}</a>
                            ) : item.type === "email" ? (
                              <a href={`mailto:${item.value}`}>{item.value}</a>
                            ) : item.type === "website" ? (
                              <a href={item.value} target="_blank" rel="noopener noreferrer">{item.value}</a>
                            ) : (
                              <span>{item.value}</span>
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
                {panel === "form" && <ContactForm key={formKey} data={data} onSuccess={handleSuccess} />}
                {panel === "success" && <SuccessState onSendAnother={handleSendAnother} onViewMessages={handleViewMessages} />}
                {panel === "history" && <MessageHistory onMessageSelect={handleMessageSelect} onNewMessage={handleNewMessage} onDeleteSuccess={handleDeleteSuccess} />}
                {panel === "detail" && selectedMessage && <MessageDetail message={selectedMessage} onBack={handleBackToHistory} />}
              </div>
            )}
          </div>
        </div>
      </div>

      {data.faqVisible && visibleFaq.length > 0 && (
        <section className="cu-faq-section">
          <div className="cu-container">
            <div className="cu-faq-label">
              <span className="cu-label-line" />
              <span className="cu-label-text">Help Centre</span>
              <span className="cu-label-line" />
            </div>
            <h2 className="cu-section-title">{data.faqTitle}</h2>
            <p className="cu-faq-subtitle">Find quick answers to common questions.</p>
            <div className="cu-faq-grid">
              {visibleFaq.map((f: FaqItem) => (
                <FaqAccordion key={f.id} item={f} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default ContactUs;
