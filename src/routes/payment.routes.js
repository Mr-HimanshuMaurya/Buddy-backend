import express from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentsByBooking,
  getPaymentsByUser,
  updatePaymentStatus,
  processRefund,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/", createPayment);
router.get("/", getAllPayments);
router.get("/booking/:bookingId", getPaymentsByBooking);
router.get("/user/:userId", getPaymentsByUser);
router.get("/:id", getPaymentById);
router.put("/:id", updatePayment);
router.put("/:id/status", updatePaymentStatus);
router.post("/:id/refund", processRefund);
router.delete("/:id", deletePayment);

export default router;

