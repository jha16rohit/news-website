import { Router } from "express";

import {
  getContactUsSettings,
  updateContactUsSettings,
  getMessages,
  getMessageById,
  getMessagesByEmail,
  getMyMessages,
  deleteMyMessage,
  createMessage,
  markMessageRead,
  replyToMessage,
  deleteMessage,
} from "../controllers/contactus.controller";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

import { protectSiteUser } from "../middleware/Siteuserauth.middleware";

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

// ─── Protected: users must be logged in to submit Contact Us messages ─────────

router.post(
  "/messages",
  protectSiteUser,
  createMessage
);

// Protected: fetch authenticated user's own messages
router.get(
  "/my-messages",
  protectSiteUser,
  getMyMessages
);

router.delete(
  "/my-messages/:id",
  protectSiteUser,
  deleteMyMessage
);

// Public: fetch all past messages and replies for a user by email (with ownership check)
router.get(
  "/messages/email/:email",
  getMessagesByEmail
);

// Protected: allow users to view their specific message thread (with ownership check)
router.get(
  "/messages/:id",
  protectSiteUser,
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