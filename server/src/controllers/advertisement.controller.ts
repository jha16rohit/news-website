// ─── controllers/advertisement.controller.ts ─────────────────────────────────
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Inquiries ─────────────────────────────────────────────────────────────────

export const getInquiries = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const inquiries = await prisma.adInquiry.findMany({
      where: status && status !== "all" ? { status: status as any } : undefined,
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
      where: { id: String(req.params.id)},
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
        targetPage, duration, customDays, adType,
        imageUrl, linkUrl, adTitle,
      },
    });
    res.status(201).json(inquiry);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response) => {
  try {
    const { status, adminNote } = req.body;
    const inquiry = await prisma.adInquiry.update({
      where: {id: String(req.params.id) },
      data: {
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
    await prisma.adInquiry.delete({ where: { id: String(req.params.id)} });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ── Published Ads ─────────────────────────────────────────────────────────────

export const getPublishedAds = async (req: Request, res: Response) => {
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
          expiresAt: new Date(expiresAt),
        },
      }),
      prisma.adInquiry.update({
        where: { id: inquiryId },
        data: {
          status: "published",
          publishedAt: new Date(publishedAt),
          expiresAt: new Date(expiresAt),
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
    const existing = await prisma.publishedAd.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) return res.status(404).json({ message: "Ad not found" });
    const ad = await prisma.publishedAd.update({
      where: { id: String(req.params.id) },
      data: { isActive: !existing.isActive },
    });
    res.json(ad);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteAd = async (req: Request, res: Response) => {
  try {
    await prisma.publishedAd.delete({ where: { id: String(req.params.id)} });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ── Page Settings ─────────────────────────────────────────────────────────────

const SETTINGS_ID = "singleton";

export const getAdPageSettings = async (_req: Request, res: Response) => {
  try {
    let settings = await prisma.adPageSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (!settings) {
      settings = await prisma.adPageSettings.create({
        data: {
          id: SETTINGS_ID,
          whyPoints: [
            "Hyper-local audience across 18+ Indian cities",
            "Flexible campaign durations",
            "Real-time performance analytics",
          ],
          packages: [
            { label: "7 Days", price: "₹2,999" },
            { label: "14 Days", price: "₹4,999" },
            { label: "30 Days", price: "₹8,999" },
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
      where: { id: SETTINGS_ID },
      update: {
        whyEnabled, whyPoints,
        packagesEnabled, packages,
        contactEnabled, contactEmail, contactPhone, contactNote,
      },
      create: {
        id: SETTINGS_ID,
        whyEnabled, whyPoints,
        packagesEnabled, packages,
        contactEnabled, contactEmail, contactPhone, contactNote,
      },
    });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};