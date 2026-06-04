// server/src/controllers/comment.controller.ts
// ─────────────────────────────────────────────

import { Response } from "express";
import Comment from "../models/Comment";
import { SiteUserRequest } from "../middleware/Siteuserauth.middleware";
import { AuthRequest }     from "../middleware/auth.middleware";

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatComment(c: any, currentUserId?: string) {
  const likeCount    = (c.reactions as any[]).filter((r) => r.type === "like").length;
  const dislikeCount = (c.reactions as any[]).filter((r) => r.type === "dislike").length;
  const userReaction = currentUserId
    ? ((c.reactions as any[]).find((r) => r.userId === currentUserId)?.type ?? null)
    : null;

  return {
    id:          String(c._id),
    author:      c.userName,
    avatar:      getInitials(c.userName),
    profilePic:  c.userProfilePic ?? null,
    isVerified:  c.isVerified ?? false,
    text:        c.content,
    time:        c.createdAt,
    likes:       likeCount,
    dislikes:    dislikeCount,
    userVote:    userReaction,
    parentId:    c.parentId ?? null,
    status:      c.status,
    reportCount: (c.reportedBy as string[]).length,
    isReported:  (c.reportedBy as string[]).length > 0,
    replies:     [] as any[],
  };
}

// ══════════════════════════════════════════════════════════════
//  PUBLIC: GET /api/comments?newsId=xxx
// ══════════════════════════════════════════════════════════════
export const getComments = async (req: any, res: Response) => {
  try {
    const { newsId } = req.query as { newsId: string };
    const currentUserId = (req as SiteUserRequest).userId;

    if (!newsId) return res.status(400).json({ message: "newsId is required" });

    const all = await Comment.find({ newsId, status: "approved" }).sort({ createdAt: -1 });

    const topLevel = all.filter((c) => !c.parentId);
    const replies  = all.filter((c) => !!c.parentId);

    const formatted = topLevel.map((c) => {
      const fc = formatComment(c, currentUserId);
      fc.replies = replies
        .filter((r) => String(r.parentId) === String(c._id))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((r) => formatComment(r, currentUserId));
      return fc;
    });

    return res.status(200).json({ comments: formatted, total: all.length });
  } catch (err) {
    console.error("getComments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  PUBLIC: POST /api/comments   (protectSiteUser)
// ══════════════════════════════════════════════════════════════
export const createComment = async (req: SiteUserRequest, res: Response) => {
  try {
    const { newsId, content } = req.body;

    if (!newsId || !content?.trim()) {
      return res.status(400).json({ message: "newsId and content are required." });
    }
    if (content.trim().length > 2000) {
      return res.status(400).json({ message: "Comment too long (max 2000 chars)." });
    }

    const comment = await Comment.create({
      newsId,
      content:        content.trim(),
      userId:         req.userId!,
      userName:       req.userName!,
      userProfilePic: req.userProfilePic ?? undefined,
      status:         "approved",
    });

    return res.status(201).json({ comment: formatComment(comment, req.userId) });
  } catch (err) {
    console.error("createComment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  PUBLIC: POST /api/comments/:id/reply   (protectSiteUser)
// ══════════════════════════════════════════════════════════════
export const replyToComment = async (req: SiteUserRequest, res: Response) => {
  try {
    const parentId = String(req.params.id);
    const { newsId, content } = req.body;

    if (!newsId || !content?.trim()) {
      return res.status(400).json({ message: "newsId and content are required." });
    }

    const parent = await Comment.findById(parentId);
    if (!parent) return res.status(404).json({ message: "Parent comment not found." });

    const reply = await Comment.create({
      newsId,
      content:        content.trim(),
      userId:         req.userId!,
      userName:       req.userName!,
      userProfilePic: req.userProfilePic ?? undefined,
      parentId:       parentId, 
      status:         "approved",
    });

    return res.status(201).json({ comment: formatComment(reply, req.userId) });
  } catch (err) {
    console.error("replyToComment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  PUBLIC: POST /api/comments/:id/react   (protectSiteUser)
// ══════════════════════════════════════════════════════════════
export const reactToComment = async (req: SiteUserRequest, res: Response) => {
  try {
    const { type } = req.body as { type: "like" | "dislike" };

    if (!["like", "dislike"].includes(type)) {
      return res.status(400).json({ message: "type must be like or dislike." });
    }

    const comment = await Comment.findById(String(req.params.id));
    if (!comment) return res.status(404).json({ message: "Comment not found." });

    const userId = req.userId!;
    const idx    = comment.reactions.findIndex((r) => r.userId === userId);

    if (idx !== -1) {
      if (comment.reactions[idx].type === type) {
        comment.reactions.splice(idx, 1);
      } else {
        comment.reactions[idx].type = type;
      }
    } else {
      comment.reactions.push({ userId, type });
    }

    await comment.save();

    const likeCount    = comment.reactions.filter((r) => r.type === "like").length;
    const dislikeCount = comment.reactions.filter((r) => r.type === "dislike").length;
    const userReaction = comment.reactions.find((r) => r.userId === userId)?.type ?? null;

    return res.status(200).json({ likes: likeCount, dislikes: dislikeCount, userVote: userReaction });
  } catch (err) {
    console.error("reactToComment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  PUBLIC: POST /api/comments/:id/report   (protectSiteUser)
// ══════════════════════════════════════════════════════════════
export const reportComment = async (req: SiteUserRequest, res: Response) => {
  try {
    const userId  = req.userId!;
    const comment = await Comment.findById(String(req.params.id));
    if (!comment) return res.status(404).json({ message: "Comment not found." });

    if (!comment.reportedBy.includes(userId)) {
      comment.reportedBy.push(userId);
      await comment.save();
    }

    return res.status(200).json({ message: "Comment reported. Our team will review it." });
  } catch (err) {
    console.error("reportComment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  PUBLIC: DELETE /api/comments/:id   (protectSiteUser — own only)
// ══════════════════════════════════════════════════════════════
export const deleteOwnComment = async (req: SiteUserRequest, res: Response) => {
  try {
    const userId  = req.userId!;
    const comment = await Comment.findById(String(req.params.id));
    if (!comment) return res.status(404).json({ message: "Comment not found." });
    if (comment.userId !== userId) return res.status(403).json({ message: "Not authorized." });

    await Comment.deleteMany({ $or: [{ _id: String(req.params.id) }, { parentId: String(req.params.id) }] });

    return res.status(200).json({ message: "Comment deleted." });
  } catch (err) {
    console.error("deleteOwnComment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  ADMIN: GET /api/admin/comments (LOOKUP WITH HEADLINES ONCE)
// ══════════════════════════════════════════════════════════════
export const adminGetComments = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, page = "1", limit = "20" } = req.query as Record<string, string>;

    const filter: any = {};
    if (status === "pending")  filter.status = "pending";
    if (status === "approved") filter.status = "approved";
    if (status === "reported") filter["reportedBy.0"] = { $exists: true };

    if (search) {
      filter.$or = [
        { content:  { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    filter.$nor = [{ status: "DELETED" }];

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Comment.countDocuments(filter);
    
    const docs = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const newsIds = [...new Set(docs.map(d => d.newsId).filter(Boolean))];
    const newsArticles = await require("../models/News").default.find({ _id: { $in: newsIds } }).select("headline").lean();
    const newsMap = Object.fromEntries(newsArticles.map((n: any) => [String(n._id), n.headline]));

    const comments = docs.map((c: any) => ({
      id:          String(c._id),
      author:      c.userName,
      avatar:      getInitials(c.userName),
      profilePic:  c.userProfilePic ?? null,
      text:        c.content,
      time:        c.createdAt,
      newsId:      c.newsId,
      newsHeadline: newsMap[c.newsId] || "Story Headline", 
      status:      c.status,
      reportCount: c.reportedBy ? c.reportedBy.length : 0,
      isReported:  c.reportedBy ? c.reportedBy.length > 0 : false,
      likes:       c.reactions ? c.reactions.filter((r: any) => r.type === "like").length : 0,
    }));

    return res.status(200).json({ comments, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("adminGetComments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  ADMIN: GET /api/admin/comments/stats
// ══════════════════════════════════════════════════════════════
export const adminCommentStats = async (_req: any, res: Response) => {
  try {
    const [total, pending, reported, approvedToday] = await Promise.all([
      Comment.countDocuments(),
      Comment.countDocuments({ status: "pending" }),
      Comment.countDocuments({ "reportedBy.0": { $exists: true } }),
      Comment.countDocuments({
        status:    "approved",
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    return res.status(200).json({ total, pending, reported, approvedToday });
  } catch (err) {
    console.error("adminCommentStats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  ADMIN: PATCH /api/admin/comments/:id
// ══════════════════════════════════════════════════════════════
export const adminUpdateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body as { status: "approved" | "rejected" };

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be approved or rejected." });
    }

    const comment = await Comment.findByIdAndUpdate(
      String(req.params.id),
      { status, reportedBy: [] },
      { new: true }
    );

    if (!comment) return res.status(404).json({ message: "Comment not found." });

    return res.status(200).json({ message: `Comment ${status}.`, id: String(comment._id) });
  } catch (err) {
    console.error("adminUpdateComment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  ADMIN: DELETE /api/admin/comments/:id   (also deletes replies)
// ══════════════════════════════════════════════════════════════
export const adminDeleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const id     = String(req.params.id);
    const result = await Comment.deleteMany({ $or: [{ _id: id }, { parentId: id }] });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Comment not found." });
    }

    return res.status(200).json({ message: "Comment and its replies deleted." });
  } catch (err) {
    console.error("adminDeleteComment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  ADMIN: POST /api/admin/comments/:id/reply   (official LocalNewz reply)
// ══════════════════════════════════════════════════════════════
export const adminReplyToComment = async (req: AuthRequest, res: Response) => {
  try {
    const parentId = String(req.params.id);
    const { newsId, content } = req.body;

    if (!newsId || !content?.trim()) {
      return res.status(400).json({ message: "newsId and content are required." });
    }

    const parent = await Comment.findById(parentId);
    if (!parent) return res.status(404).json({ message: "Parent comment not found." });

    const reply = await Comment.create({
      newsId,
      content:        content.trim(),
      userId:         String(req.user!.id),
      userName:       "LocalNewz",
      userProfilePic: undefined,
      parentId:       parentId, 
      status:         "approved",
      isVerified:     true,
    });

    return res.status(201).json({ comment: formatComment(reply) });
  } catch (err) {
    console.error("adminReplyToComment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};