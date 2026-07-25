// server/src/controllers/siteUser.controller.ts
// ─────────────────────────────────────────────
// Frontend users: Register, Login, Google OAuth, Get Profile, Update Profile, Change Password

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import SiteUser from "../models/SiteUser";
import LoginLog from "../models/LoginLog";

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
        .json({ message: "Name, email aur password zaroori hai." });
    }

    const existing = await SiteUser.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Yeh email already registered hai." });
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
          { new: true }
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
  return res.status(200).json({ message: "Logout ho gaye." });
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

    if (!user) return res.status(404).json({ message: "User nahi mila." });
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
          .json({ message: "Yeh email already kisi aur ka hai." });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    const updated = await SiteUser.findByIdAndUpdate(userId, updateData, {
      new: true,
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
        .json({ message: "Current aur new password dono chahiye." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "New password kam se kam 6 characters ka hona chahiye.",
      });
    }

    const user = await SiteUser.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User nahi mila." });
    }

    if (!user.password) {
      return res.status(400).json({
        message:
          "Aapka account Google se linked hai. Password change nahi ho sakta.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Current password galat hai." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password badal gaya!" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};