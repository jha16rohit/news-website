// src/api/user/comments.ts
// ─────────────────────────────────────────────
// All comment-related API calls for the frontend
//
// FIX: previously this file used raw `fetch(...)` calls with
// `credentials: "include"` and never attached the site-user's
// Bearer token. Every protected route (post/reply/react/report/
// delete/mine, and all admin actions) therefore hit the backend
// with NO Authorization header, and `protectSiteUser` / `protect`
// correctly rejected them with 401 "Not authorized, no token" —
// exactly the errors visible in the console.
//
// The rest of the app (advertise.ts, AdvertisementManager.tsx,
// ContactUsAdmin.tsx) already solves this correctly by going
// through `apiClient`, which reads the token from sessionStorage
// and attaches `Authorization: Bearer <token>` automatically.
// This file now does the same, so logged-in users (and admins)
// are actually authenticated on every request.
// ─────────────────────────────────────────────

import { apiClient } from "../client";

/** Fetch all approved comments for a news article */
export async function fetchComments(newsId: string) {
  return apiClient(`/api/comments?newsId=${encodeURIComponent(newsId)}`);
  // -> { comments, total }
}

/** Post a top-level comment (user must be logged in) */
export async function postComment(newsId: string, content: string) {
  return apiClient("/api/comments", {
    method: "POST",
    body: { newsId, content },
  });
  // -> { comment }
}

/** Reply to an existing comment */
export async function postReply(parentId: string, newsId: string, content: string) {
  return apiClient(`/api/comments/${parentId}/reply`, {
    method: "POST",
    body: { newsId, content },
  });
  // -> { comment }
}

/** Like or dislike a comment */
export async function reactComment(commentId: string, type: "like" | "dislike") {
  return apiClient(`/api/comments/${commentId}/react`, {
    method: "POST",
    body: { type },
  });
  // -> { likes, dislikes, userVote }
}

/** Fetch the logged-in user's own comments (for the profile page) */
export interface MyComment {
  id: string;
  text: string;
  time: string;
  newsId: string;
  newsSlug: string | null;
  newsHeadline: string;
  status: "pending" | "approved" | "rejected";
  likes: number;
  dislikes: number;
  isReply: boolean;
}

export async function fetchMyComments(): Promise<{ comments: MyComment[] }> {
  return apiClient("/api/comments/mine");
}

/** Report a comment */
export async function reportComment(commentId: string) {
  return apiClient(`/api/comments/${commentId}/report`, {
    method: "POST",
  });
}

/** Delete own comment */
export async function deleteComment(commentId: string) {
  return apiClient(`/api/comments/${commentId}`, {
    method: "DELETE",
  });
}

// ─── ADMIN ────────────────────────────────────────────────────
// These also go through apiClient now — the admin panel uses the
// same Bearer-token session as everything else in the app (see
// AdvertisementManager.tsx / ContactUsAdmin.tsx), there is no
// separate cookie-session for admins.

export async function adminFetchCommentStats() {
  return apiClient("/api/admin/comments/stats");
  // -> { total, pending, reported, approvedToday }
}

export async function adminFetchComments(params: {
  status?: "pending" | "reported" | "approved" | "all";
  search?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  if (params.page)   q.set("page",   String(params.page));
  if (params.limit)  q.set("limit",  String(params.limit));

  return apiClient(`/api/admin/comments?${q}`);
}

export async function adminApproveComment(id: string) {
  return apiClient(`/api/admin/comments/${id}`, {
    method: "PATCH",
    body: { status: "approved" },
  });
}

export async function adminRejectComment(id: string) {
  return apiClient(`/api/admin/comments/${id}`, {
    method: "PATCH",
    body: { status: "rejected" },
  });
}

export async function adminDeleteComment(id: string) {
  return apiClient(`/api/admin/comments/${id}`, {
    method: "DELETE",
  });
}

export async function adminReplyComment(id: string, newsId: string, content: string) {
  return apiClient(`/api/admin/comments/${id}/reply`, {
    method: "POST",
    body: { newsId, content },
  });
}