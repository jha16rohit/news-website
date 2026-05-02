import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import newsRoutes from "./routes/news.routes";
import topicProfileRoutes from "./routes/topicProfile.routes";
import categoryRoutes from "./routes/category.routes";
import tagsRoutes from "./routes/tags.routes";
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
app.use(express.json());

// ✅ 4. ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes); // 🔥 IMPORTANT
app.use("/api/topic-profiles", topicProfileRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagsRoutes);
export default app;