// server/src/middleware/siteUserAuth.middleware.ts
// DROP-IN REPLACEMENT — extends your existing protectSiteUser
// to also attach userName and userProfilePic (needed by the comment system).
//
// REPLACE your existing Siteuserauth.middleware.ts with this file.
// The export name is kept as `protectSiteUser` so nothing else breaks.

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import SiteUser from "../models/SiteUser";

// Extended request — superset of your original SiteUserRequest
export interface SiteUserRequest extends Request {
  userId?:         string;
  userRole?:       string;
  userName?:       string;      // ← NEW: needed by comment controller
  userProfilePic?: string | null; // ← NEW: needed by comment controller
}

export const protectSiteUser = async (
  req: SiteUserRequest,
  res: Response,
  next: NextFunction
) => {
  // Prefer Authorization: Bearer header, fall back to cookie
  const authHeader = req.headers.authorization;
  const token =
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) ||
    req.cookies?.site_token ||
    null;

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");

    const decoded = jwt.verify(token, secret) as { id: string; role: string };

    // Block admins from user-facing routes (same as before)
    if (decoded.role !== "USER") {
      return res
        .status(403)
        .json({ message: "Access denied: user account required" });
    }

    // Fetch the user so we always have the latest name / profilePic
    const user = await SiteUser.findById(decoded.id).select("name profilePic role");
    if (!user) {
      return res.status(401).json({ message: "User not found. Please login again." });
    }

    req.userId         = String(user._id);
    req.userRole       = user.role;
    req.userName       = user.name;
    req.userProfilePic = user.profilePic ?? null;

    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};