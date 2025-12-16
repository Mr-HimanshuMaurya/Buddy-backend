import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Notification } from "../models/notifications.models.js";

// Create Notification
export const createNotification = asyncHandler(async (req, res) => {
  const notificationData = req.body;

  if (
    !notificationData.userId ||
    !notificationData.type ||
    !notificationData.title ||
    !notificationData.message
  ) {
    throw new ApiError(400, "All required notification fields must be provided");
  }

  const notification = await Notification.create(notificationData);

  const populatedNotification = await Notification.findById(notification._id)
    .populate("userId", "firstname lastname email");

  return res
    .status(201)
    .json(
      new ApiResponse(201, populatedNotification, "Notification created successfully")
    );
});

// Get All Notifications
export const getAllNotifications = asyncHandler(async (req, res) => {
  const { type, read, priority, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (type) query.type = type;
  if (read !== undefined) query.read = read === "true";
  if (priority) query.priority = priority;

  const notifications = await Notification.find(query)
    .populate("userId", "firstname lastname email")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Notification.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      notifications,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Notifications fetched successfully")
  );
});

// Get Notification By ID
export const getNotificationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findById(id)
    .populate("userId", "firstname lastname email");

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification fetched successfully"));
});

// Update Notification
export const updateNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const notification = await Notification.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("userId", "firstname lastname email");

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification updated successfully"));
});

// Mark Notification As Read
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    id,
    { read: true },
    { new: true }
  ).populate("userId", "firstname lastname email");

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

// Mark All Notifications As Read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await Notification.updateMany(
    { userId, read: false },
    { read: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { updated: result.modifiedCount }, "All notifications marked as read")
    );
});

// Delete Notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndDelete(id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Notification deleted successfully"));
});

// Get Notifications By User
export const getNotificationsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { read, type, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const query = { userId };
  if (read !== undefined) query.read = read === "true";
  if (type) query.type = type;

  const notifications = await Notification.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ userId, read: false });

  return res.status(200).json(
    new ApiResponse(200, {
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Notifications fetched successfully")
  );
});

