import express from "express";
import {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/", createNotification);
router.get("/", getAllNotifications);
router.get("/user/:userId", getNotificationsByUser);
router.get("/:id", getNotificationById);
router.put("/:id", updateNotification);
router.put("/:id/read", markAsRead);
router.put("/user/:userId/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

export default router;

