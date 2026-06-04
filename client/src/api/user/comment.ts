// src/api/user/comments.ts
// ─────────────────────────────────────────────
// All comment-related API calls for the frontend

const BASE = "http://localhost:5001/api";

/** Fetch all approved comments for a news article */
export async function fetchComments(newsId: string) {
  const res = await fetch(`${BASE}/comments?newsId=${newsId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json(); // { comments, total }
}

/** Post a top-level comment (user must be logged in) */
export async function postComment(newsId: string, content: string) {
  const res = await fetch(`${BASE}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ newsId, content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to post comment");
  }
  return res.json(); // { comment }
}

/** Reply to an existing comment */
export async function postReply(parentId: string, newsId: string, content: string) {
  const res = await fetch(`${BASE}/comments/${parentId}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ newsId, content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to post reply");
  }
  return res.json(); // { comment }
}

/** Like or dislike a comment */
export async function reactComment(commentId: string, type: "like" | "dislike") {
  const res = await fetch(`${BASE}/comments/${commentId}/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ type }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to react");
  }
  return res.json(); // { likes, dislikes, userVote }
}

/** Report a comment */
export async function reportComment(commentId: string) {
  const res = await fetch(`${BASE}/comments/${commentId}/report`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to report");
  }
  return res.json();
}

/** Delete own comment */
export async function deleteComment(commentId: string) {
  const res = await fetch(`${BASE}/comments/${commentId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to delete");
  }
  return res.json();
}

// ─── ADMIN ────────────────────────────────────────────────────

const ADMIN_BASE = "http://localhost:5001/api/admin";

export async function adminFetchCommentStats() {
  const res = await fetch(`${ADMIN_BASE}/comments/stats`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json(); // { total, pending, reported, approvedToday }
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

  const res = await fetch(`${ADMIN_BASE}/comments?${q}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function adminApproveComment(id: string) {
  const res = await fetch(`${ADMIN_BASE}/comments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: "approved" }),
  });
  if (!res.ok) throw new Error("Failed to approve");
  return res.json();
}

export async function adminRejectComment(id: string) {
  const res = await fetch(`${ADMIN_BASE}/comments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: "rejected" }),
  });
  if (!res.ok) throw new Error("Failed to reject");
  return res.json();
}

export async function adminDeleteComment(id: string) {
  const res = await fetch(`${ADMIN_BASE}/comments/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete");
  return res.json();
}

export async function adminReplyComment(id: string, newsId: string, content: string) {
  const res = await fetch(`${ADMIN_BASE}/comments/${id}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ newsId, content }),
  });
  if (!res.ok) throw new Error("Failed to reply");
  return res.json();
}