// server/src/socket/analyticssocket.ts
//
// Referenced in server.ts as `initAnalyticsSocket(io)`.
// Admin dashboard clients join the "admin-analytics" room and receive
// periodic + event-driven live-visitor-count pushes.

import { Server as SocketServer, Socket } from "socket.io";
import PageView from "../models/Pageview";

const ADMIN_ROOM = "admin-analytics";
const LIVE_WINDOW_MS = 5 * 60 * 1000; // consider a visitor "live" for 5 minutes
const POLL_INTERVAL_MS = 15_000;

let ioRef: SocketServer | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function computeLiveVisitorCount(): Promise<number> {
  const since = new Date(Date.now() - LIVE_WINDOW_MS);
  const distinctVisitors = await PageView.distinct("visitorId", {
    createdAt: { $gte: since },
  });
  return distinctVisitors.length;
}

/**
 * Push the current live-visitor count to every admin dashboard client.
 * Safe to call often — it's a lightweight distinct() query.
 */
export async function broadcastLiveVisitorCount(): Promise<void> {
  if (!ioRef) return;
  try {
    const count = await computeLiveVisitorCount();
    ioRef.to(ADMIN_ROOM).emit("analytics:live-visitors", { count });
  } catch (error) {
    console.error("broadcastLiveVisitorCount error:", error);
  }
}

export function initAnalyticsSocket(io: SocketServer): void {
  ioRef = io;

  io.on("connection", (socket: Socket) => {
    socket.on("admin:subscribe-analytics", () => {
      socket.join(ADMIN_ROOM);
      // Send an immediate snapshot on subscribe
      broadcastLiveVisitorCount().catch(() => {});
    });

    socket.on("admin:unsubscribe-analytics", () => {
      socket.leave(ADMIN_ROOM);
    });

    socket.on("disconnect", () => {
      socket.leave(ADMIN_ROOM);
    });
  });

  // Periodic heartbeat so the count stays fresh even with no new pageviews
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    broadcastLiveVisitorCount().catch(() => {});
  }, POLL_INTERVAL_MS);
}