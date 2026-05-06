import { Request, Response } from "express";
import bcrypt   from "bcryptjs";
import crypto   from "crypto";
import { Resend } from "resend";
import prisma         from "../config/db";
import { generateToken } from "../utils/generateToken";

// ── Cookie config ──────────────────────────────────────────────────────────────
const cookieOptions = {
  httpOnly: true,
  secure:   false,
  sameSite: "lax" as const,
};

// ── OTP expire time from .env (default 10 min) ────────────────────────────────
const OTP_EXPIRE_MS = parseInt(process.env.OTP_EXPIRE_MINUTES ?? "10", 10) * 60 * 1000;

// ── In-memory OTP store ────────────────────────────────────────────────────────
interface OtpEntry {
  otp:       string;
  expiresAt: number;
  method:    "email" | "phone";
  contact:   string;
}
const otpStore = new Map<string, OtpEntry>();

setInterval(() => {
  const now = Date.now();
  otpStore.forEach((entry, key) => {
    if (entry.expiresAt < now) otpStore.delete(key);
  });
}, 5 * 60 * 1000);

// ── In-memory reset-token store ───────────────────────────────────────────────
interface ResetEntry {
  userId:    string;
  expiresAt: number;
}
const resetStore = new Map<string, ResetEntry>();

setInterval(() => {
  const now = Date.now();
  resetStore.forEach((entry, key) => {
    if (entry.expiresAt < now) resetStore.delete(key);
  });
}, 5 * 60 * 1000);

// ── Resend client (lazy init) ──────────────────────────────────────────────────
let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) throw new Error("RESEND_API_KEY is not set in .env");
    resendClient = new Resend(key);
  }
  return resendClient;
}

// ── Secure OTP via crypto.randomInt (NOT Math.random) ─────────────────────────
function generateOtp(): string {
  return (100_000 + crypto.randomInt(0, 900_000)).toString();
}

// ── Email OTP via Resend ───────────────────────────────────────────────────────
async function sendEmailOtp(email: string, otp: string): Promise<void> {
  const expireMinutes = process.env.OTP_EXPIRE_MINUTES?.trim() ?? "10";

  const { error } = await getResend().emails.send({
    from:    "Local Newz <onboarding@resend.dev>",
    // Resend test mode: onboarding@resend.dev only delivers to YOUR verified Resend email.
    // Set RESEND_TO_EMAIL=your_resend_verified_email in .env for local testing.
    to:      [process.env.RESEND_TO_EMAIL?.trim() || email],
    subject: "Your OTP for Local Newz Password Reset",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:36px;
                  border:1px solid #e8e8e8;border-radius:14px;background:#fff">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <div style="width:36px;height:36px;background:#e10600;border-radius:8px;
                      display:flex;align-items:center;justify-content:center">
            <span style="color:#fff;font-size:18px;font-weight:700">L</span>
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:#111">Local Newz</div>
            <div style="font-size:12px;color:#999">sach, sahas aur sarokar</div>
          </div>
        </div>
        <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0"/>
        <p style="color:#333;font-size:15px;margin:0 0 8px">
          Hi there, we received a request to reset your password.
        </p>
        <p style="color:#555;font-size:14px;margin:0 0 24px">
          Use the OTP below to proceed. Do <strong>not</strong> share this with anyone.
        </p>
        <div style="background:#f9f9f9;border:2px dashed #e10600;border-radius:12px;
                    padding:24px;text-align:center;margin-bottom:24px">
          <div style="font-size:13px;color:#888;margin-bottom:8px;
                      text-transform:uppercase;letter-spacing:1px">
            Your One-Time Password
          </div>
          <div style="font-size:44px;font-weight:800;letter-spacing:14px;color:#111">
            ${otp}
          </div>
          <div style="font-size:12px;color:#aaa;margin-top:10px">
            Expires in <strong style="color:#e10600">${expireMinutes} minutes</strong>
          </div>
        </div>
        <p style="color:#999;font-size:12px;margin:0">
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0"/>
        <p style="color:#ccc;font-size:11px;text-align:center;margin:0">
          &copy; ${new Date().getFullYear()} Local Newz
        </p>
      </div>
    `,
  });

  if (error) {
    const resendMsg = (error as any)?.message || JSON.stringify(error);
    console.error(`[EMAIL OTP] Resend error for ${email}:`, resendMsg, error);
    throw new Error(`Resend error: ${(error as any)?.message || "unknown"}. If testing locally, set RESEND_TO_EMAIL in .env to your verified Resend email.`);
  }
  console.log(`[EMAIL OTP] Sent to ${email}`);
}

// ── SMS OTP via MSG91 (Indian SMS — msg91.com) ────────────────────────────────
async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  const authKey       = process.env.MSG91_AUTH_KEY?.trim();
  const templateId    = process.env.MSG91_TEMPLATE_ID?.trim();
  const expireMinutes = process.env.OTP_EXPIRE_MINUTES?.trim() ?? "10";

  if (!authKey || !templateId) {
    // Dev fallback — OTP printed to server console when MSG91 not configured
    console.warn(
      `\n[SMS OTP - DEV MODE — set MSG91_AUTH_KEY + MSG91_TEMPLATE_ID in .env]\n` +
      `  Phone  : ${phone}\n` +
      `  OTP    : ${otp}\n` +
      `  Expires: ${expireMinutes} minutes\n`
    );
    return;
  }

  // Normalize to 91XXXXXXXXXX (MSG91 expects country code, no + prefix)
  const digits = phone.replace(/[^0-9]/g, "");
  const mobile = digits.startsWith("91") && digits.length === 12
    ? digits
    : `91${digits.slice(-10)}`;

  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "accept":       "application/json",
      "authkey":      authKey,
    },
    body: JSON.stringify({
      template_id: templateId,
      mobile,
      otp,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.type === "error") {
    const msg = data?.message || `HTTP ${res.status}`;
    console.error("[SMS OTP] MSG91 error:", msg, data);
    throw new Error(`Failed to send SMS OTP: ${msg}`);
  }

  console.log(`[SMS OTP] MSG91 sent to ${mobile} — response:`, data?.type);
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const token = generateToken({ id: user.id, role: user.role });
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken({ id: user.id, role: user.role });
    res.cookie("token", token, cookieOptions);

    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export const logout = (_req: Request, res: Response) => {
  try {
    res.clearCookie("token", cookieOptions);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ME
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ user });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = async (req: Request & { user?: any }, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data:  { name, email, phone },
    });

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (req: Request & { user?: any }, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "All fields are required" });
    if (!req.user)
      return res.status(401).json({ message: "Not authorized" });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { password: hashedPassword },
    });

    res.clearCookie("token", cookieOptions);
    res.json({ message: "Password updated successfully. Please login again." });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — Step 1
// POST /api/auth/forgot-password
// Body: { method: "email" | "phone", contact: string }
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { method, contact } = req.body as {
      method:  "email" | "phone";
      contact: string;
    };

    if (!method || !contact?.trim())
      return res.status(400).json({ message: "Method and contact are required" });

    if (!["email", "phone"].includes(method))
      return res.status(400).json({ message: "Method must be 'email' or 'phone'" });

    const contactTrimmed = contact.trim().toLowerCase();

    let user: { id: string; email: string; phone: string | null } | null = null;

    if (method === "email") {
      user = await prisma.user.findUnique({
        where:  { email: contactTrimmed },
        select: { id: true, email: true, phone: true },
      });
    } else {
      user = await prisma.user.findFirst({
        where:  { phone: contactTrimmed },
        select: { id: true, email: true, phone: true },
      });
    }

    if (!user) {
      return res.json({ success: true, message: "If this account exists, an OTP has been sent." });
    }

    const otp       = generateOtp();
    const storeKey  = `${method}:${contactTrimmed}`;
    const expiresAt = Date.now() + OTP_EXPIRE_MS;

    otpStore.set(storeKey, { otp, expiresAt, method, contact: contactTrimmed });

    if (method === "email") {
      await sendEmailOtp(contactTrimmed, otp);
    } else {
      await sendSmsOtp(contactTrimmed, otp);
    }

    console.log(`[OTP SENT] method=${method} contact=${contactTrimmed} otp=${otp}`);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY OTP — Step 2
// POST /api/auth/verify-otp
// Body: { method: "email"|"phone", contact: string, otp: string }
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { method, contact, otp } = req.body as {
      method:  "email" | "phone";
      contact: string;
      otp:     string;
    };

    if (!method || !contact || !otp)
      return res.status(400).json({ message: "All fields are required" });

    const contactTrimmed = contact.trim().toLowerCase();
    const storeKey       = `${method}:${contactTrimmed}`;
    const entry          = otpStore.get(storeKey);

    if (!entry)
      return res.status(400).json({ message: "No OTP found. Please request a new one." });

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(storeKey);
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (entry.otp !== otp.trim())
      return res.status(400).json({ message: "Invalid OTP. Please try again." });

    otpStore.delete(storeKey); // one-time use

    let user: { id: string } | null = null;

    if (method === "email") {
      user = await prisma.user.findUnique({
        where:  { email: contactTrimmed },
        select: { id: true },
      });
    } else {
      user = await prisma.user.findFirst({
        where:  { phone: contactTrimmed },
        select: { id: true },
      });
    }

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const resetToken  = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 15 * 60 * 1000; // 15 min

    resetStore.set(resetToken, { userId: user.id, expiresAt: tokenExpiry });

    res.json({ success: true, resetToken, message: "OTP verified" });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD — Step 3
// POST /api/auth/reset-password
// Body: { resetToken: string, newPassword: string }
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body as {
      resetToken:  string;
      newPassword: string;
    };

    if (!resetToken || !newPassword)
      return res.status(400).json({ message: "Reset token and new password are required" });

    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const entry = resetStore.get(resetToken);

    if (!entry)
      return res.status(400).json({ message: "Invalid or expired reset token. Please start over." });

    if (Date.now() > entry.expiresAt) {
      resetStore.delete(resetToken);
      return res.status(400).json({ message: "Reset token has expired. Please start over." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: entry.userId },
      data:  { password: hashedPassword },
    });

    resetStore.delete(resetToken); // one-time use
    res.clearCookie("token", cookieOptions);

    res.json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};