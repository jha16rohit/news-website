// server/src/socket/analyticsSocket.ts
import { Server as SocketServer } from "socket.io";
import PageView from "../models/Pageview";

const activeSessions = new Map<string, { visitorId: string; newsId?: string }>();

async function broadcastLiveCount(io: SocketServer) {
  try {
    const since = new Date(Date.now() - 5 * 60 * 1000); // last 5 min
    const dbCount = await PageView.distinct("visitorId", { createdAt: { $gte: since } });

    // FIX: Filter out admins from the socket count!
    const publicSockets = [...activeSessions.values()].filter(s => !s.visitorId.startsWith("admin-"));
    const socketCount = new Set(publicSockets.map((s) => s.visitorId)).size;

    const count = Math.max(dbCount.length, socketCount);
    io.emit("live:visitors", { count });
  } catch (err) {
    console.error("broadcastLiveCount error:", err);
  }
}

export function initAnalyticsSocket(io: SocketServer) {
  const interval = setInterval(() => broadcastLiveCount(io), 10_000);

  io.on("connection", (socket) => {
    const visitorId = (socket.handshake.query.visitorId as string) ?? socket.id;
    const newsId    = (socket.handshake.query.newsId as string) ?? undefined;

    activeSessions.set(socket.id, { visitorId, newsId });
    broadcastLiveCount(io);

    socket.on("disconnect", () => {
      activeSessions.delete(socket.id);
      broadcastLiveCount(io);
    });
  });

  process.on("SIGTERM", () => clearInterval(interval));
}