import express from "express";
import {
  createAnalytics,
  getAllAnalytics,
  getAnalyticsById,
  updateAnalytics,
  deleteAnalytics,
  getAnalyticsByProperty,
  getAnalyticsByDateRange,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.post("/", createAnalytics);
router.get("/", getAllAnalytics);
router.get("/property/:propertyId", getAnalyticsByProperty);
router.get("/date-range", getAnalyticsByDateRange);
router.get("/:id", getAnalyticsById);
router.put("/:id", updateAnalytics);
router.delete("/:id", deleteAnalytics);

export default router;

