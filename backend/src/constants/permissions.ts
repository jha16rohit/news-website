export const EDITOR_PERMISSIONS = [
  // News
  "news",
  "create-news",
  "breaking-news",
  "live-news",

  // Content management
  "scheduled",
  "categories",
  "tags",
  "topic-profile",
  "media-library",

] as const;

export type EditorPermission =
  (typeof EDITOR_PERMISSIONS)[number];