// server/src/routes/siteUser.routes.ts
import { Router } from "express";
import {
  registerUser,
  loginUser,
  googleAuthUser,
  logoutUser,
  getMe,
  updateMe,
  changePassword,
} from "../controllers/siteusercontroller";
import { protectSiteUser } from "../middleware/Siteuserauth.middleware";

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.post("/register", registerUser);    // POST /api/users/register
router.post("/login",    loginUser);       // POST /api/users/login
router.post("/google",   googleAuthUser);  // POST /api/users/google  ← Google OAuth
router.post("/logout",   logoutUser);      // POST /api/users/logout

// ── Protected routes (JWT required) ──────────────────────────────────────────
router.get("/me",               protectSiteUser, getMe);           // GET  /api/users/me
router.put("/me",               protectSiteUser, updateMe);        // PUT  /api/users/me
router.put("/change-password",  protectSiteUser, changePassword);  // PUT  /api/users/change-password

export default router;