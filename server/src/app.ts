// server/src/app.ts  (updated — sirf naya line add hua hai, baaki same)

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import newsRoutes from "./routes/news.routes";
import topicProfileRoutes from "./routes/topicProfile.routes";
import categoryRoutes from "./routes/category.routes";
import tagsRoutes from "./routes/tags.routes";
import footerRoutes from "./routes/footer.routes";
import advertisementRoutes from "./routes/advertisement.routes";
import contactUsRoutes from "./routes/contactus.routes";
import siteUserRoutes from "./routes/siteuser.routes"; // ← NEW (frontend users)
import { startScheduler } from "./scheduler";
import path from "path";

const app = express();

// ✅ 1. CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ✅ 2. PREFLIGHT FIX
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ 3. MIDDLEWARE
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

startScheduler();

// ✅ 4. ROUTES
// ── Admin / Author section ──────────────────────
app.use("/api/auth",            authRoutes);
app.use("/api/news",            newsRoutes);
app.use("/api/topic-profiles",  topicProfileRoutes);
app.use("/api/categories",      categoryRoutes);
app.use("/api/tags",            tagsRoutes);
app.use("/api/footer-settings", footerRoutes);
app.use("/api/advertisement",   advertisementRoutes);
app.use("/api/contact",         contactUsRoutes);

// ── Frontend User section ───────────────────────
app.use("/api/users",           siteUserRoutes); // ← NEW

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

export default app;