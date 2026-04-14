import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";

const app = express();

// ✅ 1. CORS FIRST
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ✅ 2. HANDLE PREFLIGHT (THIS IS YOUR MAIN ISSUE)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(cookieParser());
app.use(express.json());

// ✅ 3. ROUTES
app.use("/api/auth", authRoutes);

export default app;