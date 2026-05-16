// ─── controllers/advertisement.controller.ts ─────────────────────────────────
import { Request, Response } from "express";
import { Resend } from "resend";
import prisma from "../config/db";

// ── Resend client — same lazy-init pattern as auth_controller ─────────────────
let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) throw new Error("RESEND_API_KEY is not set in .env");
    resendClient = new Resend(key);
  }
  return resendClient;
}

// ── Admin email notification when a user submits the Advertise form ───────────
async function sendAdInquiryNotification(inquiry: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  budget?: string | null;
  targetPage?: string | null;
  duration?: string | null;
  customDays?: number | null;
  adType?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  adTitle?: string | null;
}): Promise<void> {
  const adminEmail = process.env.RESEND_TO_EMAIL?.trim();
  if (!adminEmail) {
    console.warn("[Advertisement] RESEND_TO_EMAIL not set — skipping notification.");
    return;
  }

  const adminUrl    = `${process.env.SITE_URL?.trim() || "http://localhost:3000"}/admin/advertisements`;
  const durationStr = inquiry.duration === "custom"
    ? `${inquiry.customDays} days (custom)`
    : inquiry.duration || "—";

  const { error } = await getResend().emails.send({
    from:    "Local Newz <onboarding@resend.dev>",
    to:      [adminEmail],
    subject: `📢 New Ad Inquiry from ${inquiry.name}${inquiry.company ? ` (${inquiry.company})` : ""}`,
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

        <h2 style="font-size:18px;color:#111;margin:0 0 4px">New Advertisement Inquiry</h2>
        <p style="color:#888;font-size:13px;margin:0 0 20px">
          Submitted via the Advertise With Us page.
        </p>

        <!-- Contact details -->
        <p style="font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:.05em;
                  font-weight:600;margin:0 0 8px">Contact Details</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr>
            <td style="padding:6px 0;color:#888;width:120px">Name</td>
            <td style="padding:6px 0;color:#111;font-weight:600">${inquiry.name}</td>
          </tr>
          ${inquiry.company ? `
          <tr>
            <td style="padding:6px 0;color:#888">Company</td>
            <td style="padding:6px 0;color:#111">${inquiry.company}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:6px 0;color:#888">Email</td>
            <td style="padding:6px 0">
              <a href="mailto:${inquiry.email}" style="color:#e10600">${inquiry.email}</a>
            </td>
          </tr>
          ${inquiry.phone ? `
          <tr>
            <td style="padding:6px 0;color:#888">Phone</td>
            <td style="padding:6px 0;color:#111">${inquiry.phone}</td>
          </tr>` : ""}
        </table>

        <!-- Campaign details -->
        <p style="font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:.05em;
                  font-weight:600;margin:0 0 8px">Campaign Details</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr>
            <td style="padding:6px 0;color:#888;width:120px">Target Page</td>
            <td style="padding:6px 0;color:#111">${inquiry.targetPage || "—"}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#888">Duration</td>
            <td style="padding:6px 0;color:#111">${durationStr}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#888">Ad Type</td>
            <td style="padding:6px 0;color:#111">${inquiry.adType || "—"}</td>
          </tr>
          ${inquiry.budget ? `
          <tr>
            <td style="padding:6px 0;color:#888">Budget</td>
            <td style="padding:6px 0;color:#111;font-weight:600">${inquiry.budget}</td>
          </tr>` : ""}
          ${inquiry.adTitle ? `
          <tr>
            <td style="padding:6px 0;color:#888">Ad Title</td>
            <td style="padding:6px 0;color:#111">${inquiry.adTitle}</td>
          </tr>` : ""}
          ${inquiry.linkUrl ? `
          <tr>
            <td style="padding:6px 0;color:#888">Link URL</td>
            <td style="padding:6px 0">
              <a href="${inquiry.linkUrl}" style="color:#e10600">${inquiry.linkUrl}</a>
            </td>
          </tr>` : ""}
          ${inquiry.imageUrl ? `
          <tr>
            <td style="padding:6px 0;color:#888">Image URL</td>
            <td style="padding:6px 0">
              <a href="${inquiry.imageUrl}" style="color:#e10600">View Image</a>
            </td>
          </tr>` : ""}
        </table>

        ${inquiry.message ? `
        <div style="background:#f9f9f9;border-left:4px solid #f59e0b;border-radius:6px;
                    padding:16px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:12px;color:#aaa;text-transform:uppercase;
                    letter-spacing:.05em;font-weight:600">Message</p>
          <p style="margin:0;color:#333;font-size:14px;line-height:1.7">
            ${inquiry.message.replace(/\n/g, "<br/>")}
          </p>
        </div>
        ` : ""}

        <a href="${adminUrl}"
           style="display:inline-block;background:#e10600;color:#fff;padding:11px 22px;
                  border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
          Review in Admin Panel →
        </a>

        <hr style="border:none;border-top:1px solid #f0f0f0;margin:28px 0 16px"/>
        <p style="color:#ccc;font-size:11px;margin:0">
          Inquiry ID: ${inquiry.id} &nbsp;·&nbsp; &copy; ${new Date().getFullYear()} Local Newz
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[Advertisement] Resend error:", (error as any)?.message || error);
  } else {
    console.log(`[Advertisement] Admin notification sent → ${adminEmail}`);
  }
}

// ── Inquiries ─────────────────────────────────────────────────────────────────

export const getInquiries = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const inquiries = await prisma.adInquiry.findMany({
      where:   status && status !== "all" ? { status: status as any } : undefined,
      include: { publishedAd: true },
      orderBy: { submittedAt: "desc" },
    });
    res.json(inquiries);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getInquiry = async (req: Request, res: Response) => {
  try {
    const inquiry = await prisma.adInquiry.findUnique({
      where:   { id: String(req.params.id) },
      include: { publishedAd: true },
    });
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    res.json(inquiry);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createInquiry = async (req: Request, res: Response) => {
  try {
    const {
      name, email, phone, company, message, budget,
      targetPage, duration, customDays, adType,
      imageUrl, linkUrl, adTitle,
    } = req.body;

    const inquiry = await prisma.adInquiry.create({
      data: {
        name, email, phone, company, message, budget,
        targetPage, duration,
        customDays: customDays ? Number(customDays) : undefined,
        adType, imageUrl, linkUrl, adTitle,
      },
    });

    // Fire-and-forget — never fail the API response over an email error
    sendAdInquiryNotification(inquiry).catch(err =>
      console.error("[Advertisement] Notification email failed:", err.message)
    );

    res.status(201).json(inquiry);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response) => {
  try {
    const { status, adminNote } = req.body;
    const inquiry = await prisma.adInquiry.update({
      where: { id: String(req.params.id) },
      data:  {
        status,
        ...(adminNote !== undefined && { adminNote }),
      },
    });
    res.json(inquiry);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteInquiry = async (req: Request, res: Response) => {
  try {
    await prisma.adInquiry.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ── Published Ads ─────────────────────────────────────────────────────────────

export const getPublishedAds = async (_req: Request, res: Response) => {
  try {
    const ads = await prisma.publishedAd.findMany({
      include: { inquiry: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(ads);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const publishAd = async (req: Request, res: Response) => {
  try {
    const {
      inquiryId, imageUrl, linkUrl, altText,
      targetPage, adTitle, advertiser,
      publishedAt, expiresAt,
    } = req.body;

    const [ad] = await prisma.$transaction([
      prisma.publishedAd.create({
        data: {
          inquiryId, imageUrl, linkUrl, altText,
          targetPage, adTitle, advertiser,
          publishedAt: new Date(publishedAt),
          expiresAt:   new Date(expiresAt),
        },
      }),
      prisma.adInquiry.update({
        where: { id: inquiryId },
        data:  {
          status:      "published",
          publishedAt: new Date(publishedAt),
          expiresAt:   new Date(expiresAt),
        },
      }),
    ]);

    res.status(201).json(ad);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleAdActive = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.publishedAd.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!existing) return res.status(404).json({ message: "Ad not found" });

    const ad = await prisma.publishedAd.update({
      where: { id: String(req.params.id) },
      data:  { isActive: !existing.isActive },
    });
    res.json(ad);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAd = async (req: Request, res: Response) => {
  try {
    await prisma.publishedAd.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ── Page Settings ─────────────────────────────────────────────────────────────

const SETTINGS_ID = "singleton";

export const getAdPageSettings = async (_req: Request, res: Response) => {
  try {
    let settings = await prisma.adPageSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (!settings) {
      settings = await prisma.adPageSettings.create({
        data: {
          id:        SETTINGS_ID,
          whyPoints: [
            "Hyper-local audience across 18+ Indian cities",
            "Flexible campaign durations",
            "Real-time performance analytics",
          ],
          packages: [
            { label: "7 Days",   price: "₹2,999"  },
            { label: "14 Days",  price: "₹4,999"  },
            { label: "30 Days",  price: "₹8,999"  },
            { label: "3 Months", price: "₹19,999" },
          ],
        },
      });
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAdPageSettings = async (req: Request, res: Response) => {
  try {
    const {
      whyEnabled, whyPoints,
      packagesEnabled, packages,
      contactEnabled, contactEmail, contactPhone, contactNote,
    } = req.body;

    const settings = await prisma.adPageSettings.upsert({
      where:  { id: SETTINGS_ID },
      update: { whyEnabled, whyPoints, packagesEnabled, packages, contactEnabled, contactEmail, contactPhone, contactNote },
      create: { id: SETTINGS_ID, whyEnabled, whyPoints, packagesEnabled, packages, contactEnabled, contactEmail, contactPhone, contactNote },
    });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};