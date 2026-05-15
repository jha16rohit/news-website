// server/src/middleware/siteUserAuth.middleware.ts
// ──────────────────────────────────────────────────
// Yeh middleware /api/users/me jaisi protected routes ke liye use karo

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const protectSiteUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Token cookie se lo, ya Authorization header se
  const token =
    req.cookies?.site_token ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Login karo pehle." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    if (decoded.role !== "USER") {
      return res.status(403).json({ message: "Access allowed nahi hai." });
    }

    (req as any).userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalid ya expire ho gaya." });
  }
};