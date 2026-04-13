import { Router } from "express";
import { register, login, logout, getMe , changePassword } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// ✅ ADD THIS LINE (IMPORTANT)
router.get("/me", protect, getMe);

router.put("/change-password", protect, changePassword);

export default router;