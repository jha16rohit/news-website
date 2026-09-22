import React, { useState, useEffect } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { submitContactMessage } from "../../../api/user/contactus";
import type { ContactUsSettings } from "../../../api/user/contactus";
import { useAuth } from "../../../context/AuthContext";

const DEFAULT_SUBJECTS = [
  "General Enquiry",
  "News Tip",
  "Correction Request",
  "Advertising",
  "Partnership",
  "Complaint",
  "Other",
];

interface ContactFormProps {
  data: ContactUsSettings;
  onSuccess: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ data, onSuccess }) => {
  const { isLoggedIn, openLogin, user } = useAuth();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || "",
        email: f.email || user.email || "",
        phone: f.phone || (user as any).phone || "",
      }));
    }
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const subjects = (data.subjectOptions && data.subjectOptions.length > 0) ? data.subjectOptions : DEFAULT_SUBJECTS;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
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
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        subject: form.subject || "General Enquiry",
        message: form.message,
      });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send message. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="cu-form-panel">
      <h2 className="cu-panel-title">{data.formTitle}</h2>
      <p className="cu-form-subtitle">{data.formSubtitle}</p>
      {apiError && (
        <div className="cu-form-error-banner" role="alert">
          <AlertCircle size={14} /> {apiError}
        </div>
      )}
      <div className="cu-form-body">
        <div className="cu-form-row">
          <div className="cu-form-field">
            <label htmlFor="cu-name">Full Name <span aria-hidden="true">*</span></label>
            <input id="cu-name" value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="Arjun Sharma" disabled={loading} />
            {errors.name && <span className="cu-form-error">{errors.name}</span>}
          </div>
          <div className="cu-form-field">
            <label htmlFor="cu-email">Email Address <span aria-hidden="true">*</span></label>
            <input id="cu-email" type="email" value={form.email} onChange={(e) => setF("email", e.target.value)} placeholder="you@example.com" disabled={loading} />
            {errors.email && <span className="cu-form-error">{errors.email}</span>}
          </div>
        </div>
        <div className="cu-form-row">
          <div className="cu-form-field">
            <label htmlFor="cu-phone">Phone Number <span className="cu-optional">(optional)</span></label>
            <input id="cu-phone" value={form.phone} onChange={(e) => setF("phone", e.target.value)} placeholder="+91 98765 43210" disabled={loading} />
          </div>
          <div className="cu-form-field">
            <label htmlFor="cu-subject">Subject</label>
            <select id="cu-subject" value={form.subject} onChange={(e) => setF("subject", e.target.value)} disabled={loading}>
              <option value="">Select a subject…</option>
              {subjects.map((s: string, i: number) => (
                <option key={`subject-${i}-${s}`} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="cu-form-field cu-form-field-full">
          <label htmlFor="cu-message">Message <span aria-hidden="true">*</span></label>
          <textarea id="cu-message" rows={4} value={form.message} onChange={(e) => setF("message", e.target.value)} placeholder="Tell us more about your enquiry…" disabled={loading} />
          {errors.message && <span className="cu-form-error">{errors.message}</span>}
        </div>
        <button onClick={handleSubmit} disabled={loading} className="cu-submit-btn" type="button">
          {loading ? <><Loader2 size={15} className="spin-icon" /> Sending…</> : <><Send size={15} /> Send Message</>}
        </button>
      </div>
    </div>
  );
};

export default ContactForm;
