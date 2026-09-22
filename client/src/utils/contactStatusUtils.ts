// client/src/utils/contactStatusUtils.ts
// Shared utilities for Contact Us message status handling

export interface ContactMessage {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  receivedAt: string;
  read: boolean;
  replied: boolean;
  replyText?: string;
  receivedAtFormatted?: string;
}

export type MessageStatus = "pending" | "replied";

/**
 * Get the current status of a contact message
 */
export function getMessageStatus(message: { replied?: boolean }): "pending" | "replied" {
  return message.replied ? "replied" : "pending";
}

/**
 * Get human-readable label for message status
 */
export function getStatusLabel(status: "pending" | "replied"): string {
  return status === "replied" ? "Replied" : "Pending";
}

/**
 * Get CSS class for status badge
 */
export function getStatusClass(status: "pending" | "replied"): string {
  return status === "replied" ? "status-badge--replied" : "status-badge--pending";
}

/**
 * Get status color for UI elements
 */
export function getStatusColor(status: "pending" | "replied"): string {
  return status === "replied" ? "#16a34a" : "#f59e0b";
}

/**
 * Get status badge configuration
 */
export function getStatusConfig(status: "pending" | "replied"): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
} {
  if (status === "replied") {
    return {
      label: "Replied",
      color: "#16a34a",
      bgColor: "#dcfce7",
      borderColor: "#bbf7d0",
      icon: "✓",
    };
  }
  return {
    label: "Pending",
    color: "#f59e0b",
    bgColor: "#fef9c3",
    borderColor: "#fde68a",
    icon: "⏳",
  };
}

/**
 * Format message received date for display
 */
export function formatReceivedDate(receivedAt: string): string {
  if (!receivedAt) return "—";
  const date = new Date(receivedAt);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format message received date with time for detail view
 */
export function formatReceivedDateTime(receivedAt: string): string {
  if (!receivedAt) return "—";
  const date = new Date(receivedAt);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Check if message has a reply
 */
export function hasReply(message: { replyText?: string; replied?: boolean }): boolean {
  return message.replied === true && !!message.replyText;
}

/**
 * Get message preview text (truncated)
 */
export function getMessagePreview(message: string, maxLength: number = 90): string {
  if (!message) return "";
  const plainText = message.replace(/<[^>]*>/g, "").trim();
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + "…";
}

/**
 * Format message date for message list
 */
export function formatMessageDate(receivedAt: string): string {
  if (!receivedAt) return "—";
  const date = new Date(receivedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}