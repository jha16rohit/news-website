import { Router } from "express";

import {
  getContactUsSettings,
  updateContactUsSettings,
  getMessages,
  getMessageById,
  getMessagesByEmail,
  createMessage,
  markMessageRead,
  replyToMessage,
  deleteMessage,
} from "../controllers/contactus.controller";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

const router = Router();

// ─── Public: frontend reads Contact Us settings ─────────────────────────────

router.get(
  "/settings",
  getContactUsSettings
);

// ─── Protected: update Contact Us settings ─────────────────────────────────

router.put(
  "/settings",
  protect,
  hasPermission("contact-manager"),
  updateContactUsSettings
);

// ─── Public: users can submit Contact Us messages ───────────────────────────

router.post(
  "/messages",
  createMessage
);

// Public: fetch all past messages and replies for a user by email
router.get(
  "/messages/email/:email",
  getMessagesByEmail
);

// Public: allow users to poll and view their specific message thread & reply
router.get(
  "/messages/:id",
  getMessageById
);

// ─── Protected: Contact Us inbox ────────────────────────────────────────────

router.get(
  "/messages",
  protect,
  hasPermission("contact-manager"),
  getMessages
);

router.patch(
  "/messages/:id/read",
  protect,
  hasPermission("contact-manager"),
  markMessageRead
);

router.patch(
  "/messages/:id/reply",
  protect,
  hasPermission("contact-manager"),
  replyToMessage
);

router.delete(
  "/messages/:id",
  protect,
  hasPermission("contact-manager"),
  deleteMessage
);

export default router;