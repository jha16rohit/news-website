// server/src/routes/comment.routes.ts
// ─────────────────────────────────────────────

import { Router } from "express";

// ── Authentication Middlewares ────────────────────────────
import { protectSiteUser } from "../middleware/Siteuserauth.middleware";
import { protect, isAdmin } from "../middleware/auth.middleware";

// ── Comment Controller Handlers ───────────────────────────
import {
  getComments,
  createComment,
  replyToComment,
  reactToComment,
  reportComment,
  deleteOwnComment,
  adminGetComments,
  adminCommentStats,
  adminUpdateComment,
  adminDeleteComment,
  adminReplyToComment,
} from "../controllers/comment.controller";

// ─────────────────────────────────────────────
//  PUBLIC COMMENT ROUTES  →  /api/comments/...
// ─────────────────────────────────────────────
export const commentRouter = Router();

/** GET  /api/comments?newsId=xxx  — fetch approved comments (public, no auth) */
commentRouter.get("/",             getComments);

/** POST /api/comments             — post a comment (site user auth required) */
commentRouter.post("/",            protectSiteUser, createComment);

/** POST /api/comments/:id/reply   — reply to a comment (site user auth required) */
commentRouter.post("/:id/reply",   protectSiteUser, replyToComment);

/** POST /api/comments/:id/react   — like / dislike (site user auth required) */
commentRouter.post("/:id/react",   protectSiteUser, reactToComment);

/** POST /api/comments/:id/report  — report a comment (site user auth required) */
commentRouter.post("/:id/report",  protectSiteUser, reportComment);

/** DELETE /api/comments/:id       — delete own comment (site user auth required) */
commentRouter.delete("/:id",       protectSiteUser, deleteOwnComment);


// ─────────────────────────────────────────────
//  ADMIN COMMENT ROUTES  →  /api/admin/comments/...
// ─────────────────────────────────────────────
export const adminCommentRouter = Router();

/** GET  /api/admin/comments/stats            — dashboard stat cards */
adminCommentRouter.get("/stats",      protect, isAdmin, adminCommentStats);

/** GET  /api/admin/comments?status=&search=  — paginated list */
adminCommentRouter.get("/",           protect, isAdmin, adminGetComments);

/** PATCH /api/admin/comments/:id             — approve or reject */
adminCommentRouter.patch("/:id",      protect, isAdmin, adminUpdateComment);

/** DELETE /api/admin/comments/:id            — delete comment + all its replies */
adminCommentRouter.delete("/:id",     protect, isAdmin, adminDeleteComment);

/** POST /api/admin/comments/:id/reply        — official LocalNewz reply */
adminCommentRouter.post("/:id/reply", protect, isAdmin, adminReplyToComment);