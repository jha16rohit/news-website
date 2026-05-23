// server/src/middleware/siteUserAuth.middleware.ts
// Protects /api/users/* routes.
// Accepts token from:
//   1. Authorization: Bearer <token>  (in-memory token from frontend)
//   2. req.cookies.site_token          (cookie fallback)

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface SiteUserRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const protectSiteUser = (
  req: SiteUserRequest,
  res: Response,
  next: NextFunction
) => {
  // Prefer Authorization header (in-memory token), fall back to cookie
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

    // Allow USER role only — block admins from user-facing routes
    if (decoded.role !== "USER") {
      return res
        .status(403)
        .json({ message: "Access denied: user account required" });
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};