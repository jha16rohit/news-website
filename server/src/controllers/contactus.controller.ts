// ─── controllers/contactUs.controller.ts ─────────────────────────────────────
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SETTINGS_ID = "singleton";

// ── Settings ──────────────────────────────────────────────────────────────────

const DEFAULT_CONTACT_INFO = [
  { type: "phone", label: "Newsroom Hotline", value: "+91 98765 43210", visible: true, position: 0 },
  { type: "phone", label: "Advertising", value: "+91 91234 56789", visible: true, position: 1 },
  { type: "email", label: "General Enquiries", value: "hello@localnewz.in", visible: true, position: 2 },
  { type: "email", label: "Press & PR", value: "press@localnewz.in", visible: true, position: 3 },
  {
    type: "address",
    label: "Head Office",
    value:
      "Local Newz Media Pvt. Ltd., 4th Floor, Press Building, MG Road, Patna – 800001, Bihar",
    visible: true,
    position: 4,
  },
  {
    type: "hours",
    label: "Office Hours",
    value: "Mon – Sat: 9:00 AM – 7:00 PM IST",
    visible: true,
    position: 5,
  },
];

const DEFAULT_FAQ = [
  {
    question: "How do I submit a news tip?",
    answer:
      "Use the contact form above and select 'News Tip' as the subject, or email us directly at editorial@localnewz.in with details and any media.",
    visible: true,
    position: 0,
  },
  {
    question: "How long does it take to get a response?",
    answer:
      "We aim to respond to all enquiries within 24–48 working hours. Urgent matters are prioritised.",
    visible: true,
    position: 1,
  },
  {
    question: "How can I advertise on Local Newz?",
    answer:
      "Reach out to our sales team at ads@localnewz.in or fill the contact form selecting 'Advertising' as your subject.",
    visible: true,
    position: 2,
  },
  {
    question: "How do I report an error in an article?",
    answer:
      "Select 'Correction Request' in the form and include the article URL and the specific correction needed. Our editorial team reviews all requests.",
    visible: true,
    position: 3,
  },
];

export const getContactUsSettings = async (
  _req: Request,
  res: Response
) => {
  try {
    let settings = await prisma.contactUsSettings.findUnique({
      where: { id: SETTINGS_ID },
      include: {
        contactInfo: { orderBy: { position: "asc" } },
        faq: { orderBy: { position: "asc" } },
      },
    });

    if (!settings) {
      settings = await prisma.contactUsSettings.create({
        data: {
          id: SETTINGS_ID,
          contactInfo: { create: DEFAULT_CONTACT_INFO },
          faq: { create: DEFAULT_FAQ },
        },
        include: {
          contactInfo: { orderBy: { position: "asc" } },
          faq: { orderBy: { position: "asc" } },
        },
      });
    }

    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateContactUsSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      heroVisible,
      heroTitle,
      heroSubtitle,
      contactInfoVisible,
      contactInfo,
      formVisible,
      formTitle,
      formSubtitle,
      formSuccessMsg,
      subjectOptions,
      faqVisible,
      faqTitle,
      faq,
    } = req.body;

    // Upsert top-level settings
    await prisma.contactUsSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        heroVisible,
        heroTitle,
        heroSubtitle,
        contactInfoVisible,
        formVisible,
        formTitle,
        formSubtitle,
        formSuccessMsg,
        subjectOptions,
        faqVisible,
        faqTitle,
      },
      create: {
        id: SETTINGS_ID,
        heroVisible,
        heroTitle,
        heroSubtitle,
        contactInfoVisible,
        formVisible,
        formTitle,
        formSubtitle,
        formSuccessMsg,
        subjectOptions,
        faqVisible,
        faqTitle,
      },
    });

    // Sync contactInfo: delete all then recreate
    await prisma.contactInfo.deleteMany({
      where: { settingsId: SETTINGS_ID },
    });

    if (Array.isArray(contactInfo) && contactInfo.length > 0) {
      await prisma.contactInfo.createMany({
        data: contactInfo.map((c: any, i: number) => ({
          settingsId: SETTINGS_ID,
          type: c.type,
          label: c.label,
          value: c.value,
          visible: c.visible ?? true,
          position: i,
        })),
      });
    }

    // Sync FAQ
    await prisma.fAQItem.deleteMany({
      where: { settingsId: SETTINGS_ID },
    });

    if (Array.isArray(faq) && faq.length > 0) {
      await prisma.fAQItem.createMany({
        data: faq.map((f: any, i: number) => ({
          settingsId: SETTINGS_ID,
          question: f.question,
          answer: f.answer,
          visible: f.visible ?? true,
          position: i,
        })),
      });
    }

    const updated = await prisma.contactUsSettings.findUnique({
      where: { id: SETTINGS_ID },
      include: {
        contactInfo: { orderBy: { position: "asc" } },
        faq: { orderBy: { position: "asc" } },
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ── Messages ──────────────────────────────────────────────────────────────────

export const getMessages = async (_req: Request, res: Response) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { receivedAt: "desc" },
    });

    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const msg = await prisma.contactMessage.create({
      data: { name, email, phone, subject, message },
    });

    res.status(201).json(msg);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const markMessageRead = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const msg = await prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });

    res.json(msg);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const replyToMessage = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;
    const { replyText } = req.body;

    const msg = await prisma.contactMessage.update({
      where: { id },
      data: {
        replied: true,
        replyText,
        read: true,
      },
    });

    res.json(msg);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteMessage = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    await prisma.contactMessage.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};