import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Message } from "../models/messages.models.js";

// Create Message
export const createMessage = asyncHandler(async (req, res) => {
  const messageData = req.body;

  if (
    !messageData.bookingId ||
    !messageData.sender ||
    !messageData.recipient ||
    !messageData.content
  ) {
    throw new ApiError(400, "All required message fields must be provided");
  }

  const message = await Message.create(messageData);

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "firstname lastname avatar")
    .populate("recipient", "firstname lastname avatar")
    .populate("bookingId", "propertyId tenantId");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedMessage, "Message created successfully"));
});

// Get All Messages
export const getAllMessages = asyncHandler(async (req, res) => {
  const { bookingId, sender, recipient, read, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (bookingId) query.bookingId = bookingId;
  if (sender) query.sender = sender;
  if (recipient) query.recipient = recipient;
  if (read !== undefined) query.read = read === "true";

  const messages = await Message.find(query)
    .populate("sender", "firstname lastname avatar")
    .populate("recipient", "firstname lastname avatar")
    .populate("bookingId", "propertyId tenantId")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Message.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      messages,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Messages fetched successfully")
  );
});

// Get Message By ID
export const getMessageById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await Message.findById(id)
    .populate("sender", "firstname lastname avatar")
    .populate("recipient", "firstname lastname avatar")
    .populate("bookingId");

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message fetched successfully"));
});

// Update Message
export const updateMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Don't allow updating certain fields
  delete updateData.bookingId;
  delete updateData.sender;
  delete updateData.recipient;

  const message = await Message.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("sender", "firstname lastname avatar")
    .populate("recipient", "firstname lastname avatar");

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message updated successfully"));
});

// Mark Message As Read
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await Message.findByIdAndUpdate(
    id,
    { read: true },
    { new: true }
  )
    .populate("sender", "firstname lastname avatar")
    .populate("recipient", "firstname lastname avatar");

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, message, "Message marked as read"));
});

// Delete Message
export const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await Message.findByIdAndDelete(id);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Message deleted successfully"));
});

// Get Messages By Booking
export const getMessagesByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const messages = await Message.find({ bookingId })
    .populate("sender", "firstname lastname avatar")
    .populate("recipient", "firstname lastname avatar")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: 1 }); // Oldest first for conversation view

  const total = await Message.countDocuments({ bookingId });

  return res.status(200).json(
    new ApiResponse(200, {
      messages,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Messages fetched successfully")
  );
});

