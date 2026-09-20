// client/src/utils/statusUtils.ts
// Shared utilities for LIVE/BREAKING news status detection

// Generic article type that works with various article types in the codebase
export interface StatusArticle {
  articleType?: "STANDARD" | "BREAKING" | "LIVE";
  statusType?: string;
  breakingNewsTicker?: boolean;
}

/**
 * Check if an article is currently LIVE
 * LIVE articles have articleType === "LIVE" and statusType !== "ended"
 */
export function isLiveArticle(article: StatusArticle | null | undefined): boolean {
  if (!article) return false;
  return article.articleType === "LIVE" && article.statusType !== "ended";
}

/**
 * Check if an article is currently BREAKING
 * BREAKING articles have articleType === "BREAKING" and statusType === "published"
 */
export function isBreakingArticle(article: StatusArticle | null | undefined): boolean {
  if (!article) return false;
  return article.articleType === "BREAKING" && article.statusType === "published";
}

/**
 * Get the display status for a LIVE article
 * Returns "LIVE" if active, "ENDED" if statusType === "ended", otherwise empty string
 */
export function getLiveStatus(article: StatusArticle | null | undefined): "LIVE" | "ENDED" | "" {
  if (!article || article.articleType !== "LIVE") return "";
  return article.statusType === "ended" ? "ENDED" : "LIVE";
}

/**
 * Get all active status labels for an article
 * Returns array of active status labels (e.g., ["LIVE"], ["BREAKING"], ["LIVE", "BREAKING"], [])
 */
export function getActiveStatusLabels(article: StatusArticle | null | undefined): string[] {
  if (!article) return [];
  
  const labels: string[] = [];
  
  if (isLiveArticle(article)) {
    labels.push("LIVE");
  }
  
  if (isBreakingArticle(article)) {
    labels.push("BREAKING");
  }
  
  return labels;
}

/**
 * Check if article has any special status (LIVE or BREAKING)
 */
export function hasSpecialStatus(article: StatusArticle | null | undefined): boolean {
  return isLiveArticle(article) || isBreakingArticle(article);
}

/**
 * Get the primary status for display priority
 * Returns the highest priority status for compact display
 */
export function getPrimaryStatus(article: StatusArticle | null | undefined): "LIVE" | "BREAKING" | "" {
  if (!article) return "";
  
  // Both statuses can coexist - prioritize LIVE for live updates, BREAKING for breaking news
  if (isLiveArticle(article)) return "LIVE";
  if (isBreakingArticle(article)) return "BREAKING";
  return "";
}