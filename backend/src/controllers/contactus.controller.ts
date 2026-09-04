// ─── controllers/contactus.controller.ts ─────────────────────────────────────
import { Request, Response } from "express";
import { Resend } from "resend";
import ContactUsSettings from "../models/ContactUsSettings";
import ContactInfo from "../models/ContactInfo";
import FAQItem from "../models/FAQItem";
import ContactMessage from "../models/ContactMessage";
import UserNotification from "../models/UserNotification";

// ── Resend client ─────────────────────────────────────────────────────────────
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) throw new Error("RESEND_API_KEY is not set in .env");
    resendClient = new Resend(key);
  }
  return resendClient;
}

// ── Admin email notification ──────────────────────────────────────────────────
async function sendContactNotification(msg: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}): Promise<void> {
  const adminEmail = process.env.RESEND_TO_EMAIL?.trim();
  if (!adminEmail) {
    console.warn("[ContactUs] RESEND_TO_EMAIL not set — skipping notification.");
    return;
  }

  const adminUrl = `${
    process.env.SITE_URL?.trim() || "http://localhost:3000"
  }/admin/contact`;

  const { error } = await getResend().emails.send({
    from: "Local Newz <onboarding@resend.dev>",
    to: [adminEmail],
    subject: `📬 New Contact Message: ${
      msg.subject || "General Enquiry"
    } — ${msg.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:36px;
                  border:1px solid #e8e8e8;border-radius:14px;background:#fff">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <div style="width:36px;height:36px;background:#e10600;border-radius:8px;
                      display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-size:18px;font-weight:700">L</span>
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:#111">Local Newz</div>
            <div style="font-size:12px;color:#999">Admin Notification</div>
          </div>
        </div>
        <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0"/>
        <h2 style="font-size:18px;color:#111;margin:0 0 4px">New Contact Message</h2>
        <p style="color:#888;font-size:13px;margin:0 0 20px">A user submitted a message via the Contact Us page.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:7px 0;color:#888;width:110px;vertical-align:top">Name</td><td style="padding:7px 0;color:#111;font-weight:600">${msg.name}</td></tr>
          <tr><td style="padding:7px 0;color:#888;vertical-align:top">Email</td><td style="padding:7px 0"><a href="mailto:${msg.email}" style="color:#e10600">${msg.email}</a></td></tr>
          ${msg.phone ? `<tr><td style="padding:7px 0;color:#888;vertical-align:top">Phone</td><td style="padding:7px 0;color:#111">${msg.phone}</td></tr>` : ""}
          <tr><td style="padding:7px 0;color:#888;vertical-align:top">Subject</td><td style="padding:7px 0;color:#111">${msg.subject || "General Enquiry"}</td></tr>
        </table>
        <div style="background:#f9f9f9;border-left:4px solid #e10600;border-radius:6px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Message</p>
          <p style="margin:0;color:#333;font-size:14px;line-height:1.7">${msg.message.replace(/\n/g, "<br/>")}</p>
        </div>
        <a href="${adminUrl}" style="display:inline-block;background:#e10600;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">View &amp; Reply in Admin Panel →</a>
        <hr style="border:none;border-top:1px solid #f0f0f0;margin:28px 0 16px"/>
        <p style="color:#ccc;font-size:11px;margin:0">Message ID: ${msg.id} &nbsp;·&nbsp; &copy; ${new Date().getFullYear()} Local Newz</p>
      </div>
    `,
  });

  if (error) {
    console.error("[ContactUs] Resend error:", (error as any)?.message || error);
  } else {
    console.log(`[ContactUs] Admin notification sent → ${adminEmail}`);
  }
}

// ── Default seed data ─────────────────────────────────────────────────────────
const SETTINGS_ID = "singleton";

const DEFAULT_CONTACT_INFO = [
  { type: "phone",   label: "Newsroom Hotline", value: "+91 98765 43210",  visible: true, position: 0 },
  { type: "phone",   label: "Advertising",      value: "+91 91234 56789",  visible: true, position: 1 },
  { type: "email",   label: "General Enquiries",value: "hello@localnewz.in", visible: true, position: 2 },
  { type: "email",   label: "Press & PR",        value: "press@localnewz.in", visible: true, position: 3 },
  { type: "address", label: "Head Office",       value: "Local Newz Media Pvt. Ltd., 4th Floor, Press Building, MG Road, Patna – 800001, Bihar", visible: true, position: 4 },
  { type: "hours",   label: "Office Hours",      value: "Mon – Sat: 9:00 AM – 7:00 PM IST", visible: true, position: 5 },
];

const DEFAULT_FAQ = [
  { question: "How do I submit a news tip?",      answer: "Use the contact form above and select 'News Tip' as the subject, or email us at editorial@localnewz.in.", visible: true, position: 0 },
  { question: "How long does it take to get a response?", answer: "We aim to respond within 24–48 working hours.", visible: true, position: 1 },
  { question: "How can I advertise on Local Newz?", answer: "Reach out at ads@localnewz.in or fill the contact form selecting 'Advertising' as your subject.", visible: true, position: 2 },
  { question: "How do I report an error in an article?", answer: "Select 'Correction Request' in the form and include the article URL and the specific correction needed.", visible: true, position: 3 },
];

// ── Settings ──────────────────────────────────────────────────────────────────

export const getContactUsSettings = async (_req: Request, res: Response) => {
  try {
    let settings = await ContactUsSettings.findOne({ id: SETTINGS_ID });

    if (!settings) {
      settings = await ContactUsSettings.create({ id: SETTINGS_ID });
      await ContactInfo.insertMany(
        DEFAULT_CONTACT_INFO.map((c) => ({ ...c, settingsId: SETTINGS_ID }))
      );
      await FAQItem.insertMany(
        DEFAULT_FAQ.map((f) => ({ ...f, settingsId: SETTINGS_ID }))
      );
    }

    const contactInfo = await ContactInfo.find({ settingsId: SETTINGS_ID }).sort({ position: 1 });
    const faq = await FAQItem.find({ settingsId: SETTINGS_ID }).sort({ position: 1 });

    res.json({ ...settings.toObject(), contactInfo, faq });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateContactUsSettings = async (req: Request, res: Response) => {
  try {
    const {
      heroVisible, heroTitle, heroSubtitle,
      contactInfoVisible, contactInfo,
      formVisible, formTitle, formSubtitle, formSuccessMsg, subjectOptions,
      faqVisible, faqTitle, faq,
    } = req.body;

    await ContactUsSettings.findOneAndUpdate(
      { id: SETTINGS_ID },
      {
        heroVisible, heroTitle, heroSubtitle,
        contactInfoVisible,
        formVisible, formTitle, formSubtitle, formSuccessMsg, subjectOptions,
        faqVisible, faqTitle,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Replace contact info
    await ContactInfo.deleteMany({ settingsId: SETTINGS_ID });
    if (Array.isArray(contactInfo) && contactInfo.length > 0) {
      await ContactInfo.insertMany(
        contactInfo.map((c: any, i: number) => ({
          settingsId: SETTINGS_ID,
          type: c.type,
          label: c.label,
          value: c.value,
          visible: c.visible ?? true,
          position: i,
        }))
      );
    }

    // Replace FAQ
    await FAQItem.deleteMany({ settingsId: SETTINGS_ID });
    if (Array.isArray(faq) && faq.length > 0) {
      await FAQItem.insertMany(
        faq.map((f: any, i: number) => ({
          settingsId: SETTINGS_ID,
          question: f.question,
          answer: f.answer,
          visible: f.visible ?? true,
          position: i,
        }))
      );
    }

    const updatedSettings = await ContactUsSettings.findOne({ id: SETTINGS_ID });
    const updatedContactInfo = await ContactInfo.find({ settingsId: SETTINGS_ID }).sort({ position: 1 });
    const updatedFaq = await FAQItem.find({ settingsId: SETTINGS_ID }).sort({ position: 1 });

    res.json({
      ...updatedSettings?.toObject(),
      contactInfo: updatedContactInfo,
      faq: updatedFaq,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ── Messages ──────────────────────────────────────────────────────────────────

export const getMessages = async (_req: Request, res: Response) => {
  try {
    const messages = await ContactMessage.find().sort({ receivedAt: -1 });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMessageById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const msg = await ContactMessage.findById(id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    res.json(msg);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Case-insensitive lookup by email for user history[cite: 2]
export const getMessagesByEmail = async (req: Request, res: Response) => {
  try {
    const emailParam = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
    const messages = await ContactMessage.find({ 
      email: { $regex: new RegExp(`^${emailParam}$`, "i") } 
    }).sort({ receivedAt: -1 });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const msg = await ContactMessage.create({
      name, email, phone, subject, message,
    });

    sendContactNotification({
      id: String(msg._id),
      name: msg.name,
      email: msg.email,
      phone: msg.phone,
      subject: msg.subject,
      message: msg.message,
    }).catch((err) =>
      console.error("[ContactUs] Notification email failed:", err.message)
    );

    res.status(201).json(msg);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const markMessageRead = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const msg = await ContactMessage.findByIdAndUpdate(
      id,
      { read: true },
      { returnDocument: 'after' }
    );
    res.json(msg);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const replyToMessage = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { replyText } = req.body;

    const msg = await ContactMessage.findByIdAndUpdate(
      id,
      { replied: true, replyText, read: true },
      { returnDocument: 'after' }
    );

    if (!msg) return res.status(404).json({ message: "Message not found" });

    // Create an in-app user notification using valid schema properties[cite: 2]
    try {
      await UserNotification.create({
        type: "ad_response",
        title: "Reply to your enquiry",
        message: `Admin replied: "${replyText.substring(0, 60)}..."`,
        link: "/contact",
      });
    } catch (notifErr: any) {
      console.error("[ContactUs] Failed to create in-app notification:", notifErr.message);
    }

    // Send reply email to user
    try {
      const { error } = await getResend().emails.send({
        from: "Local Newz <onboarding@resend.dev>",
        to: [msg.email],
        subject: `Reply to your enquiry - ${msg.subject || "General Enquiry"}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2>Hello ${msg.name},</h2>
            <p>Thank you for contacting Local Newz.</p>
            <div style="background:#f7f7f7;padding:16px;border-left:4px solid #e10600;margin:20px 0;border-radius:8px;">
              ${replyText.replace(/\n/g, "<br/>")}
            </div>
            <p>If you have more questions, feel free to contact us again.</p>
            <br/>
            <p>Regards,<br/>Local Newz Team</p>
          </div>
        `,
      });

      if (error) {
        console.error("[ContactUs] Reply email failed:", error);
      } else {
        console.log(`[ContactUs] Reply email sent to ${msg.email}`);
      }
    } catch (mailErr: any) {
      console.error("[ContactUs] Mail sending error:", mailErr.message);
    }

    res.json(msg);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await ContactMessage.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};