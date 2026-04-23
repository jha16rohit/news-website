import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Request
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// 🔐 PROTECT ROUTE (JWT BASED)
export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    // 1. Token check
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // 2. Verify
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: string; role: string };

    // 3. Attach user
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

// 👑 ADMIN ONLY
export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied, admin only" });
  }

  next();
};