import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/db";
import { generateToken } from "../utils/generateToken";

// 🔐 Cookie config helper
const cookieOptions = {
  httpOnly: true,
  secure: false,      // ✅ VERY IMPORTANT (for localhost)
  sameSite: "lax" as const, // ✅ works for localhost
};
// ✅ REGISTER USER
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // 5. Generate token (include role)
    const token = generateToken({
      id: user.id,
      role: user.role,
    });

    // 6. Set cookie
    res.cookie("token", token, cookieOptions);

    // 7. Send response
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ LOGIN USER
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Check user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 4. Generate token
    const token = generateToken({
      id: user.id,
      role: user.role,
    });

    // 5. Set cookie
    res.cookie("token", token, cookieOptions);

    // 6. Send response
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ LOGOUT USER
export const logout = (_req: Request, res: Response) => {
  try {
    res.clearCookie("token", cookieOptions);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET CURRENT USER (Protected)
export const getMe = async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// ✅ CHANGE PASSWORD (Protected)
export const changePassword = async (
  req: Request & { user?: any },
  res: Response
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Validate input
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "All fields are required" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const userId = req.user.id;

    // 2. Get user from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Check current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update password in DB
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // 🔥 6. FORCE LOGOUT AFTER PASSWORD CHANGE
    res.clearCookie("token", cookieOptions);

    res.json({
      message: "Password updated successfully. Please login again.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};