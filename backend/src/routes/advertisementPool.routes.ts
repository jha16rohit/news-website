import express from "express";

import {
  getAdvertisementPool,
} from "../controllers/advertisementPool.controller";

const router = express.Router();

/**
 * User Advertisement Pool
 *
 * Example:
 * GET /api/advertisement/pool?cards=2&strips=1
 *
 * Public endpoint — used by the website to load advertisements.
 */

router.get(
  "/pool",
  getAdvertisementPool
);

export default router;