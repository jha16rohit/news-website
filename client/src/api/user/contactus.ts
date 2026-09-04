// client/src/api/user/contactus.ts
// ─────────────────────────────────────────────
// User-facing Contact Us API calls

import { apiClient } from "../client";

export interface ContactUsSettings {
  heroVisible: boolean;
  heroTitle: string;
  heroSubtitle: string;
  contactInfoVisible: boolean;
  contactInfo: ContactInfo[];
  formVisible: boolean;
  formTitle: string;
  formSubtitle: string;
  formSuccessMsg: string;
  subjectOptions: string[];
  faqVisible: boolean;
  faqTitle: string;
  faq: FaqItem[];
}

export interface ContactInfo {
  id: string;
  type: "phone" | "email" | "address" | "hours" | "website";
  label: string;
  value: string;
  visible: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  visible: boolean;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface ContactMessageResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  receivedAt: string;
  read: boolean;
  replied: boolean;
  replyText?: string;
}

// Get page settings (public)
export const getContactUsSettings = (): Promise<ContactUsSettings> =>
  apiClient("/api/contact/settings");

// Submit a contact message (public)
export const submitContactMessage = async (
  data: ContactMessagePayload
): Promise<ContactMessageResponse> => {
  const res: any = await apiClient("/api/contact/messages", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return {
    ...res,
    id: res?.id ?? res?._id,
  };
};

// Poll for reply on a specific message (public)
export const getMessageById = async (id: string): Promise<ContactMessageResponse> => {
  const data: any = await apiClient(`/api/contact/messages/${id}`);
  return {
    ...data,
    id: data?.id ?? data?._id,
    replyText: data?.replyText ?? data?.reply,
  };
};