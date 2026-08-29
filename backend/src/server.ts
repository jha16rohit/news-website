import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import http from "http";
import { Server as SocketServer } from "socket.io";
import cron from "node-cron";

import app from "./app";
import connectDB from "./config/db";
import { initAnalyticsSocket } from "./socket/analyticssocket";
import { initNotificationSocket } from "./socket/notificationsocket";
import { cleanupPendingInquiries } from "./services/cleanup.service";

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create HTTP Server
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    const io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
        credentials: true,
      },
    });

    // Initialize sockets
    initAnalyticsSocket(io);
    initNotificationSocket(io);

    // Daily Cleanup Job
    cron.schedule("0 2 * * *", async () => {
      console.log("Running scheduled cleanup...");
      await cleanupPendingInquiries();
    });

    console.log("Cleanup scheduler started.");

    // Start Server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();