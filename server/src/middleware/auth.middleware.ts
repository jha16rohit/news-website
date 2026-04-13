import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Request type
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// 🔐 PROTECT ROUTE
export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    // 1. Check token
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // 2. Verify token
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

// 👑 ADMIN ONLY (NO DB CALL)
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