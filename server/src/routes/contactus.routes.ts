// ─── routes/contactUs.routes.ts ───────────────────────────────────────────────
import { Router } from "express";
import {
  getContactUsSettings,
  updateContactUsSettings,
  getMessages,
  createMessage,
  markMessageRead,
  replyToMessage,
  deleteMessage,
} from "../controllers/contactus.controller";

const router = Router();

// Settings (hero, info, form config, FAQ)
router.get("/settings", getContactUsSettings);
router.put("/settings", updateContactUsSettings);

// Inbox messages
router.get("/messages", getMessages);
router.post("/messages", createMessage);          // public: user submits contact form
router.patch("/messages/:id/read", markMessageRead);
router.patch("/messages/:id/reply", replyToMessage);
router.delete("/messages/:id", deleteMessage);

export default router;