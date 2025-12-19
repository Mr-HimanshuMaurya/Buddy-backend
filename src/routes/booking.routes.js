import express from "express";
import {
  createBooking,
  scheduleVisit,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingsByTenant,
  getBookingsByProperty,
  updateBookingStatus,
} from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/visit", scheduleVisit);
router.post("/", createBooking);
router.get("/", getAllBookings);
router.get("/tenant/:tenantId", getBookingsByTenant);
router.get("/property/:propertyId", getBookingsByProperty);
router.get("/:id", getBookingById);
router.put("/:id", updateBooking);
router.put("/:id/status", updateBookingStatus);
router.delete("/:id", deleteBooking);

export default router;

