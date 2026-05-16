// server/src/controllers/siteUser.controller.ts
// ─────────────────────────────────────────────
// Frontend users: Register, Login, Google OAuth, Get Profile, Update Profile, Change Password

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";   // npm i google-auth-library
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const JWT_SECRET  = process.env.JWT_SECRET        || "your_jwt_secret";
const JWT_EXPIRES = "7d";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";  // same as VITE_GOOGLE_CLIENT_ID

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ── helper: sign our own JWT ────────────────────────────────────
function signToken(userId: string) {
  return jwt.sign({ id: userId, role: "USER" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });
}

// ── helper: set httpOnly cookie ─────────────────────────────────
function setAuthCookie(res: Response, token: string) {
  res.cookie("site_token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ══════════════════════════════════════════════════════════════
//  POST /api/users/register
// ══════════════════════════════════════════════════════════════
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email aur password zaroori hai." });
    }

    const existing = await prisma.siteUser.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Yeh email already registered hai." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user   = await prisma.siteUser.create({
      data: { name, email, password: hashed, phone: phone || null },
    });

    const token = signToken(user.id);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Account ban gaya!",
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        phone:      user.phone,
        profilePic: user.profilePic,
        role:       user.role,
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
      return res.status(400).json({ message: "Both Email and Passwords are reuired." });
    }

    const user = await prisma.siteUser.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ message: "Email or Password is Wrong." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email or Password is Wrong." });
    }

    const token = signToken(user.id);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        phone:      user.phone,
        profilePic: user.profilePic,
        role:       user.role,
      },
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  POST /api/users/google        ← NEW
//
//  Body: { credential: "<Google id_token JWT>" }
//
//  Flow:
//   1. Verify the credential with Google's public keys
//   2. Extract { sub (googleId), email, name, picture }
//   3. Find existing user by googleId OR email
//      - If found by email but googleId missing → link the account
//      - If not found → create a new SiteUser (no password)
//   4. Return our own JWT + user object (same shape as login)
// ══════════════════════════════════════════════════════════════
export const googleAuthUser = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential missing." });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google OAuth is not configured on the server." });
    }

    // ── 1. Verify credential ──────────────────────────────────
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken:  credential,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch {
      return res.status(401).json({ message: "Invalid Google token. Please try again." });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Could not read Google account info." });
    }

    const { sub: googleId, email, name, picture } = payload;

    // ── 2. Find or create user ────────────────────────────────
    let user = await prisma.siteUser.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    });

    if (user) {
      // Link googleId if this email was registered normally before
      if (!user.googleId) {
        user = await prisma.siteUser.update({
          where: { id: user.id },
          data:  { googleId, profilePic: user.profilePic || picture || null },
        });
      }
    } else {
      // Brand new user — create without a password
      user = await prisma.siteUser.create({
        data: {
          name:       name || email.split("@")[0],
          email,
          googleId,
          profilePic: picture || null,
          // password intentionally left null — Google users don't need one
        },
      });
    }

    const token = signToken(user.id);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Google login successful!",
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        phone:      user.phone,
        profilePic: user.profilePic,
        role:       user.role,
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
//  GET /api/users/me        (protected)
// ══════════════════════════════════════════════════════════════
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;

    const user = await prisma.siteUser.findUnique({
      where:  { id: userId },
      select: {
        id:         true,
        name:       true,
        email:      true,
        phone:      true,
        profilePic: true,
        role:       true,
        createdAt:  true,
      },
    });

    if (!user) return res.status(404).json({ message: "User nahi mila." });
    return res.status(200).json({ user });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  PUT /api/users/me        (protected)
// ══════════════════════════════════════════════════════════════
export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const { name, email, phone, profilePic } = req.body;

    if (email) {
      const emailTaken = await prisma.siteUser.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (emailTaken) {
        return res.status(409).json({ message: "Yeh email already kisi aur ka hai." });
      }
    }

    const updated = await prisma.siteUser.update({
      where: { id: userId },
      data:  {
        ...(name       !== undefined && { name }),
        ...(email      !== undefined && { email }),
        ...(phone      !== undefined && { phone }),
        ...(profilePic !== undefined && { profilePic }),
      },
      select: {
        id:         true,
        name:       true,
        email:      true,
        phone:      true,
        profilePic: true,
        role:       true,
      },
    });

    return res.status(200).json({ message: "Profile update ho gaya!", user: updated });
  } catch (err) {
    console.error("updateMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ══════════════════════════════════════════════════════════════
//  PUT /api/users/change-password    (protected)
// ══════════════════════════════════════════════════════════════
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current aur new password dono chahiye." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password kam se kam 6 characters ka hona chahiye." });
    }

    const user = await prisma.siteUser.findUnique({ where: { id: userId } });

    if (!user || !user.password) {
      // Google-only users have no password — give a helpful message
      if (user && !user.password) {
        return res.status(400).json({
          message: "Aapka account Google se linked hai. Password change nahi ho sakta.",
        });
      }
      return res.status(404).json({ message: "User nahi mila." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password galat hai." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.siteUser.update({
      where: { id: userId },
      data:  { password: hashed },
    });

    return res.status(200).json({ message: "Password badal gaya!" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};