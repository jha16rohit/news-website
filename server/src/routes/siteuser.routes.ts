// server/src/routes/siteUser.routes.ts
// ──────────────────────────────────────────────────────────────

import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateMe,
  changePassword, // ✅ New: added missing changePassword controller
} from "../controllers/siteusercontroller";
import { protectSiteUser } from "../middleware/siteuserauth.middleware";

const router = Router();

// Public routes
router.post("/register", registerUser);   // POST /api/users/register
router.post("/login",    loginUser);      // POST /api/users/login
router.post("/logout",   logoutUser);     // POST /api/users/logout

// Protected routes (JWT required)
router.get ("/me",              protectSiteUser, getMe);            // GET  /api/users/me
router.put ("/me",              protectSiteUser, updateMe);         // PUT  /api/users/me
router.put ("/change-password", protectSiteUser, changePassword);   // PUT  /api/users/change-password ✅ New

export default router;