// server/src/controllers/siteUser.controller.ts
// ─────────────────────────────────────────────
// Frontend users: Register, Login, Google OAuth, Get Profile, Update Profile, Change Password

import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import SiteUser from "../models/SiteUser";
import LoginLog from "../models/LoginLog";
import UserReadHistory from "../models/UserReadHistory";
import ShareLog from "../models/ShareLog";
import News from "../models/News";
import Category from "../models/Category";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES = "7d";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// ── Decode Google JWT payload without google-auth-library ─────────────────────
function decodeGoogleJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ── helper: sign our own JWT ──────────────────────────────────────────────────
function signToken(userId: string) {
  return jwt.sign({ id: userId, role: "USER" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });
}

// ── helper: resolve News.categoryId values -> Category.name, in bulk ──────────
// `categoryId` on News stores the Category document's _id (as a string), not a
// display name. Given a set of News docs, build a { categoryId -> name } map
// with a single query so callers can turn raw IDs into readable labels.
async function resolveCategoryNames(categoryIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(categoryIds.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map();

  const validIds = uniqueIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const cats = await Category.find({ _id: { $in: validIds } }).select("name").lean();
  return new Map(cats.map((c) => [String(c._id), c.name]));
}

// ── helper: set httpOnly cookie ───────────────────────────────────────────────
function setAuthCookie(res: Response, token: string) {
  res.cookie("site_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// ══════════════════════════════════════════════════════════════
//  POST /api/users/register
// ══════════════════════════════════════════════════════════════
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    const existing = await SiteUser.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: "This email is already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await SiteUser.create({
      name,
      email,
      password: hashed,
      phone: phone || null,
    });

    const token = signToken(String(user._id));
    setAuthCookie(res, token);

    // Fire-and-forget activity log — never blocks the response
    LoginLog.create({ userId: user._id, email: user.email, method: "register" }).catch(() => {});

    return res.status(201).json({
      message: "Account ban gaya!",
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("registerUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  POST /api/users/login
// ══════════════════════════════════════════════════════════════
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Both Email and Passwords are required." });
    }

    const user = await SiteUser.findOne({ email });
    if (!user || !user.password) {
      return res
        .status(401)
        .json({ message: "Email or Password is Wrong." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email or Password is Wrong." });
    }

    const token = signToken(String(user._id));
    setAuthCookie(res, token);

    // Fire-and-forget activity log — never blocks the response
    LoginLog.create({ userId: user._id, email: user.email, method: "password" }).catch(() => {});

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  POST /api/users/google
// ══════════════════════════════════════════════════════════════
export const googleAuthUser = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res
        .status(400)
        .json({ message: "Google credential missing." });
    }

    // 1. Decode Google JWT payload (no external library needed)
    const payload = decodeGoogleJwt(credential);
    if (!payload || !payload.email) {
      return res
        .status(401)
        .json({ message: "Invalid Google token. Please try again." });
    }

    const { sub: googleId, email, name, picture } = payload as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
    };

    // 2. Find or create user
    let user = await SiteUser.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      if (!user.googleId) {
        user = await SiteUser.findByIdAndUpdate(
          user._id,
          {
            googleId,
profilePic: user.profilePic || picture || undefined,
          },
          { returnDocument: 'after' }
        );
      }
    } else {
      user = await SiteUser.create({
        name: name || email.split("@")[0],
        email,
        googleId,
profilePic: picture || undefined,
      });
    }

    const token = signToken(String(user!._id));
    setAuthCookie(res, token);

    // Fire-and-forget activity log — never blocks the response
    LoginLog.create({ userId: user!._id, email: user!.email, method: "google" }).catch(() => {});

    return res.status(200).json({
      message: "Google login successful!",
      token,
      user: {
        id: String(user!._id),
        name: user!.name,
        email: user!.email,
        phone: user!.phone,
        profilePic: user!.profilePic,
        role: user!.role,
      },
    });
  } catch (err) {
    console.error("googleAuthUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  POST /api/users/logout
// ══════════════════════════════════════════════════════════════
export const logoutUser = (_req: Request, res: Response) => {
  res.clearCookie("site_token");
  return res.status(200).json({ message: "You have been logged out successfully." });
};

// ══════════════════════════════════════════════════════════════
//  GET /api/users/me  (protected)
// ══════════════════════════════════════════════════════════════
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;

    const user = await SiteUser.findById(userId).select(
      "name email phone profilePic role createdAt"
    );

    if (!user) return res.status(404).json({ message: "User not found ." });
    return res.status(200).json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  PUT /api/users/me  (protected)
// ══════════════════════════════════════════════════════════════
export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const { name, email, phone, profilePic } = req.body;

    if (email) {
      const emailTaken = await SiteUser.findOne({
        email,
        _id: { $ne: userId },
      });
      if (emailTaken) {
        return res
          .status(409)
          .json({ message: "This email is already registered to another account." });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    const updated = await SiteUser.findByIdAndUpdate(userId, updateData, {
      returnDocument: 'after',
    }).select("name email phone profilePic role");

    return res.status(200).json({
      message: "Profile update ho gaya!",
      user: {
        id: String(updated?._id),
        name: updated?.name,
        email: updated?.email,
        phone: updated?.phone,
        profilePic: updated?.profilePic,
        role: updated?.role,
      },
    });
  } catch (err) {
    console.error("updateMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  PUT /api/users/change-password  (protected)
// ══════════════════════════════════════════════════════════════
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "The new password must be at least 6 characters long.",
      });
    }

    const user = await SiteUser.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.password) {
      return res.status(400).json({
        message:
          "Your account is linked to Google, so the password cannot be changed here.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "The current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password changed successfully!" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
// ══════════════════════════════════════════════════════════════
//  POST /api/users/track-read  (protected) — call this from the article page
// ══════════════════════════════════════════════════════════════
export const trackRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const { newsId, durationSeconds } = req.body;

    if (!newsId) {
      return res.status(400).json({ message: "newsId zaroori hai." });
    }

    await UserReadHistory.findOneAndUpdate(
      { userId, newsId },
      {
        $set: { readAt: new Date() },
        $inc: { durationSeconds: Number(durationSeconds) > 0 ? Number(durationSeconds) : 0 },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: "Read tracked." });
  } catch (err) {
    console.error("trackRead error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  POST /api/users/track-share  (protected) — call this from the share buttons
// ══════════════════════════════════════════════════════════════
const KNOWN_SHARE_PLATFORMS = ["whatsapp", "facebook", "twitter", "linkedin", "instagram", "other"] as const;
type SharePlatform = typeof KNOWN_SHARE_PLATFORMS[number];

export const trackShare = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const { newsId, platform } = req.body;

    if (!newsId || !platform) {
      return res.status(400).json({ message: "newsId aur platform zaroori hai." });
    }

    // Normalize casing (e.g. "Instagram" -> "instagram") and fall back to
    // "other" for anything not in our known list, instead of letting the
    // mongoose enum reject the write and silently dropping the share.
    const normalizedPlatform = String(platform).toLowerCase().trim();
    const finalPlatform: SharePlatform = (KNOWN_SHARE_PLATFORMS as readonly string[]).includes(
      normalizedPlatform
    )
      ? (normalizedPlatform as SharePlatform)
      : "other";

    await ShareLog.create({ userId, newsId, platform: finalPlatform });
    return res.status(201).json({ message: "Share tracked." });
  } catch (err) {
    console.error("trackShare error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  GET /api/users/reading-history  (protected) — LAST 7 DAYS ONLY
// ══════════════════════════════════════════════════════════════
export const getReadingHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const rows = await UserReadHistory.find({
      userId,
      readAt: { $gte: sevenDaysAgo },
    })
      .sort({ readAt: -1 })
      .limit(20)
      .lean();

    if (rows.length === 0) {
      return res.status(200).json({ history: [] });
    }

    const newsIds = rows.map((r) => r.newsId);
    const newsDocs = await News.find({ _id: { $in: newsIds } })
      .select("headline shortTitle slug featuredImage categories categoryId")
      .lean();

    const newsMap = new Map(newsDocs.map((n) => [String(n._id), n]));
    const categoryNames = await resolveCategoryNames(newsDocs.map((n) => n.categoryId));

    const history = rows
      .map((r) => {
        const news = newsMap.get(r.newsId);
        if (!news) return null; // article deleted since — skip it
        return {
          id: String(news._id),
          slug: news.slug,
          headline: news.shortTitle || news.headline,
          category: news.categories?.[0] || categoryNames.get(news.categoryId) || "General",
          image: news.featuredImage || null,
          readAt: r.readAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ history });
  } catch (err) {
    console.error("getReadingHistory error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  GET /api/users/analytics  (protected)
// ══════════════════════════════════════════════════════════════
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;

    // Start of the current calendar week (Sunday, 00:00). getDay() returns
    // 0 for Sunday ... 6 for Saturday, so subtracting that many days from
    // today always lands on this week's Sunday.
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // ── All-time totals (hero stats) ──
    const [totalReads, totalShares, totalTimeAgg] = await Promise.all([
      UserReadHistory.countDocuments({ userId }),
      ShareLog.countDocuments({ userId }),
      UserReadHistory.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: "$durationSeconds" } } },
      ]),
    ]);

    const totalSeconds = totalTimeAgg[0]?.total || 0;
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.round((totalSeconds % 3600) / 60);
    const timeLabel = totalHours > 0 ? `${totalHours}h` : `${totalMinutes}m`;

    // ── Daily reading, current calendar week (Sun → Sat) ──
    const dailyRaw = await UserReadHistory.aggregate([
      { $match: { userId, readAt: { $gte: weekStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$readAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const dailyMap = new Map(dailyRaw.map((d) => [d._id, d.count]));

    const dailyReading = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().split("T")[0];
      dailyReading.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }), // "Sun", "Mon", ... "Sat"
        date: key,
        reads: dailyMap.get(key) || 0,
      });
    }

    // ── Category breakdown (all-time) ──
    // NOTE: `categories` (string[]) is left empty on every article at creation
    // time — the field that's actually populated is `categoryId`, which stores
    // a Category._id, not a readable name. Resolve those IDs to Category.name
    // via resolveCategoryNames() so the chart shows real category labels
    // instead of raw IDs (falling back to "categories[0]" first, in case that
    // array is populated going forward, and to "General" if nothing resolves).
    const allHistory = await UserReadHistory.find({ userId }).select("newsId").lean();
    const newsDocsAll = await News.find({ _id: { $in: allHistory.map((h) => h.newsId) } })
      .select("categories categoryId")
      .lean();
    const categoryNames = await resolveCategoryNames(newsDocsAll.map((n) => n.categoryId));
    const catCounts: Record<string, number> = {};
    newsDocsAll.forEach((n) => {
      const cat = n.categories?.[0] || categoryNames.get(n.categoryId) || "General";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    const catTotal = Object.values(catCounts).reduce((a, b) => a + b, 0) || 1;
    const categories = Object.entries(catCounts)
      .map(([label, count]) => ({ label, value: Math.round((count / catTotal) * 100) }))
      .sort((a, b) => b.value - a.value);

    // ── Platform breakdown (all-time) ──
    const platformRaw = await ShareLog.aggregate([
      { $match: { userId } },
      { $group: { _id: "$platform", count: { $sum: 1 } } },
    ]);
    const platTotal = platformRaw.reduce((a, p) => a + p.count, 0) || 1;
    const platforms = platformRaw
      .map((p) => ({ name: p._id, pct: Math.round((p.count / platTotal) * 100) }))
      .sort((a, b) => b.pct - a.pct);

    return res.status(200).json({
      totals: { reads: totalReads, shares: totalShares, timeLabel },
      dailyReading,
      categories,
      platforms,
    });
  } catch (err) {
    console.error("getAnalytics error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};