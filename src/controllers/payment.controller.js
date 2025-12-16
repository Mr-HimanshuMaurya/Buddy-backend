import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Payment } from "../models/payments.models.js";
import { Booking } from "../models/bookings.models.js";

// Create Payment
export const createPayment = asyncHandler(async (req, res) => {
  const paymentData = req.body;

  if (
    !paymentData.bookingId ||
    !paymentData.userId ||
    !paymentData.amount ||
    !paymentData.razorpayOrderId ||
    !paymentData.method
  ) {
    throw new ApiError(400, "All required payment fields must be provided");
  }

  // Check if booking exists
  const booking = await Booking.findById(paymentData.bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const payment = await Payment.create(paymentData);

  const populatedPayment = await Payment.findById(payment._id)
    .populate("bookingId")
    .populate("userId", "firstname lastname email phone");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedPayment, "Payment created successfully"));
});

// Get All Payments
export const getAllPayments = asyncHandler(async (req, res) => {
  const { status, method, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (status) query.status = status;
  if (method) query.method = method;

  const payments = await Payment.find(query)
    .populate("bookingId", "propertyId tenantId checkInDate checkOutDate")
    .populate("userId", "firstname lastname email")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Payment.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      payments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Payments fetched successfully")
  );
});

// Get Payment By ID
export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate("bookingId")
    .populate("userId", "firstname lastname email phone");

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment fetched successfully"));
});

// Update Payment
export const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Don't allow updating certain fields
  delete updateData.bookingId;
  delete updateData.userId;

  const payment = await Payment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("bookingId")
    .populate("userId", "firstname lastname email");

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment updated successfully"));
});

// Update Payment Status
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, razorpayPaymentId } = req.body;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const validStatuses = ["pending", "completed", "failed", "refunded"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid payment status");
  }

  const updateData = { status };
  if (status === "completed") {
    updateData.completedAt = new Date();
    if (razorpayPaymentId) {
      updateData.razorpayPaymentId = razorpayPaymentId;
    }
  }

  const payment = await Payment.findByIdAndUpdate(id, updateData, {
    new: true,
  })
    .populate("bookingId")
    .populate("userId", "firstname lastname email");

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  // Update booking payment status
  if (status === "completed") {
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: "paid",
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment status updated successfully"));
});

// Process Refund
export const processRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { refundAmount, refundId } = req.body;

  const payment = await Payment.findById(id);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  if (payment.status !== "completed") {
    throw new ApiError(400, "Can only refund completed payments");
  }

  const refund = {
    amount: refundAmount || payment.amount,
    status: "initiated",
    refundId: refundId || null,
  };

  payment.refund = refund;
  payment.status = "refunded";
  await payment.save();

  // Update booking payment status
  await Booking.findByIdAndUpdate(payment.bookingId, {
    paymentStatus: "refunded",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Refund processed successfully"));
});

// Delete Payment
export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findByIdAndDelete(id);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Payment deleted successfully"));
});

// Get Payments By Booking
export const getPaymentsByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const payments = await Payment.find({ bookingId })
    .populate("userId", "firstname lastname email")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, payments, "Payments fetched successfully"));
});

// Get Payments By User
export const getPaymentsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = { userId };
  if (status) query.status = status;

  const payments = await Payment.find(query)
    .populate("bookingId", "propertyId tenantId checkInDate checkOutDate")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Payment.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      payments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Payments fetched successfully")
  );
});

