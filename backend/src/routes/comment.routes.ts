// server/src/routes/comment.routes.ts
// ─────────────────────────────────────────────

import { Router } from "express";

// ── Authentication Middlewares ────────────────────────────
import { protectSiteUser } from "../middleware/Siteuserauth.middleware";

import {
  protect,
  hasPermission,
} from "../middleware/auth.middleware";

// ── Comment Controller Handlers ───────────────────────────
import {
  getComments,
  createComment,
  getMyComments,
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
// PUBLIC COMMENT ROUTES → /api/comments/...
// ─────────────────────────────────────────────

export const commentRouter = Router();

/** GET /api/comments?newsId=xxx — fetch approved comments */
commentRouter.get(
  "/",
  getComments
);

/** GET /api/comments/mine — logged-in user's own comments */
commentRouter.get(
  "/mine",
  protectSiteUser,
  getMyComments
);

/** POST /api/comments — post a comment */
commentRouter.post(
  "/",
  protectSiteUser,
  createComment
);

/** POST /api/comments/:id/reply — reply to a comment */
commentRouter.post(
  "/:id/reply",
  protectSiteUser,
  replyToComment
);

/** POST /api/comments/:id/react — like / dislike */
commentRouter.post(
  "/:id/react",
  protectSiteUser,
  reactToComment
);

/** POST /api/comments/:id/report — report a comment */
commentRouter.post(
  "/:id/report",
  protectSiteUser,
  reportComment
);

/** DELETE /api/comments/:id — delete own comment */
commentRouter.delete(
  "/:id",
  protectSiteUser,
  deleteOwnComment
);

// ─────────────────────────────────────────────
// ADMIN COMMENT ROUTES → /api/admin/comments/...
// ─────────────────────────────────────────────

export const adminCommentRouter = Router();

/** GET /api/admin/comments/stats — dashboard stats */
adminCommentRouter.get(
  "/stats",
  protect,
  hasPermission("comments"),
  adminCommentStats
);

/** GET /api/admin/comments?status=&search= — paginated list */
adminCommentRouter.get(
  "/",
  protect,
  hasPermission("comments"),
  adminGetComments
);

/** PATCH /api/admin/comments/:id — approve or reject */
adminCommentRouter.patch(
  "/:id",
  protect,
  hasPermission("comments"),
  adminUpdateComment
);

/** DELETE /api/admin/comments/:id — delete comment + replies */
adminCommentRouter.delete(
  "/:id",
  protect,
  hasPermission("comments"),
  adminDeleteComment
);

/** POST /api/admin/comments/:id/reply — official reply */
adminCommentRouter.post(
  "/:id/reply",
  protect,
  hasPermission("comments"),
  adminReplyToComment
);