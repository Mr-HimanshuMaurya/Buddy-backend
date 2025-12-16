import express from "express";
import {
  createMessage,
  getAllMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
  getMessagesByBooking,
  markAsRead,
} from "../controllers/message.controller.js";

const router = express.Router();

router.post("/", createMessage);
router.get("/", getAllMessages);
router.get("/booking/:bookingId", getMessagesByBooking);
router.get("/:id", getMessageById);
router.put("/:id", updateMessage);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteMessage);

export default router;

