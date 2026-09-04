// server/src/routes/adminUser.routes.ts

import { Router } from "express";

import {
  getEditors,
  createEditor,
  updateEditor,
  updateEditorPermissions,
  updateEditorStatus,
  deleteEditor,
} from "../controllers/adminUser.controller";

import {
  protect,
  isAdmin,
} from "../middleware/auth.middleware";

const router = Router();

// ─── All Admin User Management routes ────────────────────────────────────────

// Only ADMIN can create, edit, assign permissions, change status, or delete Editors.
router.use(
  protect,
  isAdmin
);

// ─── GET ALL EDITORS ─────────────────────────────────────────────────────────

router.get(
  "/",
  getEditors
);

// ─── CREATE EDITOR ───────────────────────────────────────────────────────────

router.post(
  "/",
  createEditor
);

// ─── UPDATE EDITOR ───────────────────────────────────────────────────────────

router.put(
  "/:id",
  updateEditor
);

// ─── UPDATE EDITOR PERMISSIONS ───────────────────────────────────────────────

router.put(
  "/:id/permissions",
  updateEditorPermissions
);

// ─── UPDATE EDITOR STATUS ────────────────────────────────────────────────────

router.patch(
  "/:id/status",
  updateEditorStatus
);

// ─── DELETE EDITOR ───────────────────────────────────────────────────────────

router.delete(
  "/:id",
  deleteEditor
);

export default router;