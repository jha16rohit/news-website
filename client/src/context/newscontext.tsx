/**
 * NewsContext.tsx
 *
 * Shared context that broadcasts news status/type changes across all admin
 * pages (AllNews, BreakingNews, ScheduledPosts, LiveStories).
 *
 * Usage:
 *   1. Wrap your admin router/layout with <NewsProvider>
 *   2. Call useNewsEvent() to dispatch or listen for changes
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
// ─── Event shape ──────────────────────────────────────────────────────────────
export type NewsEventType =
  | "STATUS_CHANGED"   // status updated (Published/Draft/Scheduled/Deleted)
  | "TYPE_CHANGED"     // articleType updated (STANDARD/BREAKING/LIVE)
  | "CONTENT_UPDATED"  // headline, content, liveUpdates etc. updated
  | "DELETED";         // article deleted

export interface NewsEvent {
  type:        NewsEventType;
  id:          string;          // article UUID
  changes?:    Record<string, unknown>; // the fields that changed
}

type Listener = (event: NewsEvent) => void;

// ─── Context ──────────────────────────────────────────────────────────────────
interface NewsContextValue {
  /** Dispatch an event — call this after a successful API mutation */
  dispatch: (event: NewsEvent) => void;
  /** Subscribe to events — returns an unsubscribe function */
  subscribe: (listener: Listener) => () => void;
}

const NewsContext = createContext<NewsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const NewsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const listeners = useRef<Set<Listener>>(new Set());

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);

  const dispatch = useCallback((event: NewsEvent) => {
    listeners.current.forEach(fn => fn(event));
  }, []);

  return (
    <NewsContext.Provider value={{ dispatch, subscribe }}>
      {children}
    </NewsContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNewsEvent() {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNewsEvent must be used inside <NewsProvider>");
  return ctx;
}

/**
 * Convenience hook: subscribe to news events in a component.
 * Re-runs `handler` whenever an event arrives; cleaned up on unmount.
 *
 * Example:
 *   useNewsSubscription(event => {
 *     if (event.type === "STATUS_CHANGED") loadData();
 *   });
 */
export function useNewsSubscription(handler: Listener) {
  const { subscribe } = useNewsEvent();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    return subscribe(event => handlerRef.current(event));
  }, [subscribe]);
}