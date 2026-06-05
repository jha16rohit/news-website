import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import http from "http";
import { Server as SocketServer } from "socket.io";
import { initAnalyticsSocket } from "./socket/analyticssocket"; // adjust path if needed

import app from "./app";
import connectDB from "./config/db";

console.log(process.env.MONGO_URI);

const PORT = process.env.PORT || 5001;

connectDB();

// 1. Create a raw HTTP server using your Express app
const httpServer = http.createServer(app);

// 2. Initialize Socket.IO with that server
const io = new SocketServer(httpServer, {
  cors: { 
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173", 
    credentials: true 
  },
});

// 3. Attach your analytics socket logic
initAnalyticsSocket(io);

// 4. Call listen on the httpServer, NOT app.listen
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});