import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";

// Extend Request
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// 🔐 PROTECT ROUTE (JWT BASED)
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    // Authentication is intentionally header-based. Do NOT fall back to the
    // shared `token` cookie because Admin and Editor sessions must be
    // independent per browser tab.
    const token = bearerToken;

    // 1. Token check
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token",
      });
    }

    // 2. Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      id: string;
      role: string;
    };

    // 3. Make sure user still exists
    const user = await User.findById(decoded.id).select(
      "_id role permissions status"
    );

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    // 4. Block inactive/deleted Editors
    if (user.role === "EDITOR") {
      if (user.status === "Inactive") {
        return res.status(403).json({
          message: "Your Editor account is inactive. Please contact an Admin.",
        });
      }

      if (user.status === "Deleted") {
        return res.status(403).json({
          message: "Your Editor account has been deleted. Please contact an Admin.",
        });
      }
    }

    // 5. Attach authenticated user
    req.user = {
      id: String(user._id),
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error);

    return res.status(401).json({
      message: "Not authorized, invalid token",
    });
  }
};

// 👑 ADMIN ONLY
export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authorized",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Access denied, admin only",
    });
  }

  next();
};

// 🔐 PERMISSION CHECK
export const hasPermission = (permission: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Not authorized",
        });
      }

      // Admin has access to everything
      if (req.user.role === "ADMIN") {
        return next();
      }

      const user = await User.findById(req.user.id).select(
        "role permissions status"
      );

      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      // Block inactive/deleted Editors
      if (user.role === "EDITOR") {
        if (user.status === "Inactive") {
          return res.status(403).json({
            message: "Your Editor account is inactive. Please contact an Admin.",
          });
        }

        if (user.status === "Deleted") {
          return res.status(403).json({
            message: "Your Editor account has been deleted. Please contact an Admin.",
          });
        }
      }

      if (!user.permissions.includes(permission)) {
        return res.status(403).json({
          message: "Access denied, permission required",
          permission,
        });
      }

      next();
    } catch (error) {
      console.error("PERMISSION ERROR:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  };
};