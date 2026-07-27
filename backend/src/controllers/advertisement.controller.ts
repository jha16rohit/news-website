
// ─── controllers/advertisement.controller.ts ─────────────────────────────────
import { Request, Response } from "express";
import { Resend } from "resend";
import AdInquiry from "../models/AdInquiry";
import PublishedAd from "../models/PublishedAd";
import AdvertisementPool from "../models/AdvertisementPool";

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
async function sendAdInquiryNotification(inquiry: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  adType?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  adTitle?: string | null;
}): Promise<void> {
  const adminEmail = process.env.RESEND_TO_EMAIL?.trim();
  if (!adminEmail) {
    console.warn(
      "[Advertisement] RESEND_TO_EMAIL not set — skipping notification."
    );
    return;
  }

  const adminUrl = `${
    process.env.SITE_URL?.trim() || "http://localhost:3000"
  }/admin/advertisements`;
  

  const { error } = await getResend().emails.send({
    from: "Local Newz <onboarding@resend.dev>",
    to: [adminEmail],
    subject: `📢 New Ad Inquiry from ${inquiry.name}${
      inquiry.company ? ` (${inquiry.company})` : ""
    }`,
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
        <p style="color:#888;font-size:13px;margin:0 0 20px">Submitted via the Advertise With Us page.</p>

        <p style="font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin:0 0 8px">Contact Details</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          <tr><td style="padding:6px 0;color:#888;width:120px">Name</td><td style="padding:6px 0;color:#111;font-weight:600">${inquiry.name}</td></tr>
          ${inquiry.company ? `<tr><td style="padding:6px 0;color:#888">Company</td><td style="padding:6px 0;color:#111">${inquiry.company}</td></tr>` : ""}
          <tr><td style="padding:6px 0;color:#888">Email</td><td style="padding:6px 0"><a href="mailto:${inquiry.email}" style="color:#e10600">${inquiry.email}</a></td></tr>
          ${inquiry.phone ? `<tr><td style="padding:6px 0;color:#888">Phone</td><td style="padding:6px 0;color:#111">${inquiry.phone}</td></tr>` : ""}
        </table>

        <p style="font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin:0 0 8px">Campaign Details</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
          
          <tr><td style="padding:6px 0;color:#888">Ad Type</td><td style="padding:6px 0;color:#111">${inquiry.adType || "—"}</td></tr>
          ${inquiry.adTitle ? `<tr><td style="padding:6px 0;color:#888">Ad Title</td><td style="padding:6px 0;color:#111">${inquiry.adTitle}</td></tr>` : ""}
          ${inquiry.linkUrl ? `<tr><td style="padding:6px 0;color:#888">Link URL</td><td style="padding:6px 0"><a href="${inquiry.linkUrl}" style="color:#e10600">${inquiry.linkUrl}</a></td></tr>` : ""}
          ${inquiry.imageUrl ? `<tr><td style="padding:6px 0;color:#888">Image URL</td><td style="padding:6px 0"><a href="${inquiry.imageUrl}" style="color:#e10600">View Image</a></td></tr>` : ""}
        </table>

        ${
          inquiry.message
            ? `<div style="background:#f9f9f9;border-left:4px solid #f59e0b;border-radius:6px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Message</p>
          <p style="margin:0;color:#333;font-size:14px;line-height:1.7">${inquiry.message.replace(/\n/g, "<br/>")}</p>
        </div>`
            : ""
        }

        <a href="${adminUrl}" style="display:inline-block;background:#e10600;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Review in Admin Panel →</a>

        <hr style="border:none;border-top:1px solid #f0f0f0;margin:28px 0 16px"/>
        <p style="color:#ccc;font-size:11px;margin:0">Inquiry ID: ${inquiry.id} &nbsp;·&nbsp; &copy; ${new Date().getFullYear()} Local Newz</p>
      </div>
    `,
  });

  if (error) {
    console.error(
      "[Advertisement] Resend error:",
      (error as any)?.message || error
    );
  } else {
    console.log(`[Advertisement] Admin notification sent → ${adminEmail}`);
  }
}

// ── Inquiries ─────────────────────────────────────────────────────────────────

export const getInquiries = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    type InquiryStatus =
  | "pending"
  | "published"
  | "rejected";

const filter =
  status && status !== "all"
    ? { status: status as InquiryStatus }
    : {};
    const inquiries = await AdInquiry.find(filter).sort({ submittedAt: -1 });
    res.json(inquiries);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getInquiry = async (req: Request, res: Response) => {
  try {
    const inquiry = await AdInquiry.findById(req.params.id);
    if (!inquiry)
      return res.status(404).json({ message: "Inquiry not found" });
    res.json(inquiry);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createInquiry = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      message,
      adType,
      linkUrl,
      adTitle,
    } = req.body;

    const imageUrl = (req as any).uploadedImageUrl;
const imagePublicId = (req as any).uploadedImagePublicId;

    const inquiry = await AdInquiry.create({
      name,
      email,
      phone,
      company,
      message,
      adType,
      linkUrl,
      adTitle,
      imageUrl,
      imagePublicId
    });

    sendAdInquiryNotification({
      id: String(inquiry._id),
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      company: inquiry.company,
      message: inquiry.message,
      adType: inquiry.adType,
      imageUrl: inquiry.imageUrl,
      linkUrl: inquiry.linkUrl,
      adTitle: inquiry.adTitle,
    }).catch((err) =>
      console.error(
        "[Advertisement] Notification email failed:",
        err.message
      )
    );

    return res.status(201).json({
  id: String(inquiry._id),
  name: inquiry.name,
  email: inquiry.email,
  phone: inquiry.phone,
  company: inquiry.company,
  message: inquiry.message,
  adType: inquiry.adType,
  imageUrl: inquiry.imageUrl,
  linkUrl: inquiry.linkUrl,
  adTitle: inquiry.adTitle,
  status: inquiry.status,
  submittedAt: inquiry.submittedAt,
});
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response) => {
  try {
    const { status, rejectionReason } = req.body;

const update: any = { status };

if (rejectionReason !== undefined) {
    update.rejectionReason = rejectionReason;
}

    const inquiry = await AdInquiry.findByIdAndUpdate(
      req.params.id,
      update,
      { returnDocument: 'after' }
    );
    if (!inquiry)
      return res.status(404).json({ message: "Inquiry not found" });
    res.json(inquiry);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteInquiry = async (req: Request, res: Response) => {
  try {
    await AdInquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ── Published Ads ─────────────────────────────────────────────────────────────
export const getPublishedAds = async (
  _req: Request,
  res: Response
) => {
  try {
    const ads = await PublishedAd.find().sort({
      publishedAt: -1,
    });

    const formattedAds = ads.map((ad) => ({
      id: ad._id.toString(),
      ...ad.toObject(),
    }));

    return res.status(200).json(formattedAds);
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

export const publishAd = async (req: Request, res: Response) => {
  try {
    const {
      inquiryId,
      durationDays,
      publishNotes,
    } = req.body;

    // Validate input
    if (!inquiryId || !durationDays) {
      return res.status(400).json({
        message: "Inquiry ID and duration are required.",
      });
    }

    // Check if inquiry exists
    const inquiry = await AdInquiry.findById(inquiryId);

    if (!inquiry) {
      return res.status(404).json({
        message: "Inquiry not found.",
      });
    }

    // Prevent duplicate publishing
    const existingAd = await PublishedAd.findOne({
      inquiryId,
    });

    if (existingAd) {
      return res.status(400).json({
        message: "This inquiry has already been published.",
      });
    }

    const publishedAt = new Date();

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + Number(durationDays)
    );

    const publishedAd = await PublishedAd.create({
      inquiryId: inquiry._id.toString(),

      imageUrl: inquiry.imageUrl,

      linkUrl: inquiry.linkUrl,

      altText: inquiry.adTitle || inquiry.company || inquiry.name,

      advertiser: inquiry.company || inquiry.name,


      adType: inquiry.adType,

      status: "active",

      durationDays,

      publishNotes,

      publishedAt,

      expiresAt,
    });
    const lastAdvertisement = await AdvertisementPool
  .findOne({
    adType: publishedAd.adType,
  })
  .sort({ queueOrder: -1 });

const nextQueueOrder = lastAdvertisement
  ? lastAdvertisement.queueOrder + 1
  : 1;

await AdvertisementPool.create({
  publishedAdId: publishedAd._id.toString(),
  adType: publishedAd.adType,
  queueOrder: nextQueueOrder,
  isActive: true,
});


    inquiry.status = "published";
    await inquiry.save();

    return res.status(201).json(publishedAd);
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};


export const endAdvertisement = async (
  req: Request,
  res: Response
) => {
  try {
    const { endReason } = req.body;

    const ad = await PublishedAd.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        message: "Advertisement not found.",
      });
    }

    if (ad.status !== "active") {
      return res.status(400).json({
        message: "Only active advertisements can be ended.",
      });
    }

    ad.status = "ended";
ad.endedAt = new Date();
ad.endReason = endReason?.trim() || "Ended by Admin";

// Save advertisement
await ad.save();

// Remove advertisement from the active rotation pool
await AdvertisementPool.deleteOne({
  publishedAdId: ad._id.toString(),
});

return res.status(200).json({
  message: "Advertisement ended successfully.",
  advertisement: ad,
});
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

export const renewAdvertisement = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      durationDays,
      publishNotes,
    } = req.body;

    if (!durationDays) {
      return res.status(400).json({
        message: "Duration is required.",
      });
    }

    const ad = await PublishedAd.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        message: "Advertisement not found.",
      });
    }

    const publishedAt = new Date();

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + Number(durationDays)
    );

    ad.status = "active";
    ad.durationDays = Number(durationDays);
    ad.publishNotes = publishNotes || ad.publishNotes;

    ad.publishedAt = publishedAt;
    ad.renewedAt = publishedAt;
    ad.expiresAt = expiresAt;

    // Remove old ending information
    ad.endedAt = undefined;
    ad.endReason = undefined;

    await ad.save();
    // Find the last queue position for this advertisement type
const lastAdvertisement = await AdvertisementPool
  .findOne({
    adType: ad.adType,
  })
  .sort({ queueOrder: -1 });

const nextQueueOrder = lastAdvertisement
  ? lastAdvertisement.queueOrder + 1
  : 1;

// Add advertisement back into the rotation pool
await AdvertisementPool.create({
  publishedAdId: ad._id.toString(),
  adType: ad.adType,
  queueOrder: nextQueueOrder,
  isActive: true,
});

    return res.status(200).json(ad);
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};