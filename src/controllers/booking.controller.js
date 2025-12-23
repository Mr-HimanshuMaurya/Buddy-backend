import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Booking } from "../models/bookings.models.js";
import { Property } from "../models/properties.models.js";
import { Visit } from "../models/visit.model.js";
import sendEmail from "../utils/sendEmail.js";
import { visitEmailTemplate, enquiryEmailTemplate } from "../utils/emailTemplates.js";

// Schedule a Visit
export const scheduleVisit = asyncHandler(async (req, res) => {
  const { propertyId, name, email, phone, date, time, message } = req.body;

  if (!propertyId || !name || !email || !phone || !date || !time) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const property = await Property.findById(propertyId).populate("owner");
  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  const visit = await Visit.create({
    propertyId,
    userId: req.user?._id,
    name,
    email,
    phone,
    date,
    time,
    message,
  });

  // Send Email to Owner
  if (property.owner && property.owner.email) {
    try {
      await sendEmail({
        email: property.owner.email,
        subject: `New Visit Scheduled for ${property.title}`,
        html: visitEmailTemplate({
          propertyTitle: property.title,
          name,
          email,
          phone,
          date,
          time,
          message
        })
      });
    } catch (error) {
      console.error("Failed to send visit email:", error);
      // Don't fail the request if email fails, but log it
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, visit, "Visit scheduled successfully"));
});

// Send Property Enquiry
export const sendPropertyEnquiry = asyncHandler(async (req, res) => {
    const { propertyId, name, email, number, city, message } = req.body;

    if (!propertyId || !name || !email || !number || !message) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const property = await Property.findById(propertyId).populate("owner");
    if (!property) {
        throw new ApiError(404, "Property not found");
    }

    // Send Email to Owner
    if (property.owner && property.owner.email) {
        try {
            await sendEmail({
                email: property.owner.email,
                subject: `New Enquiry for ${property.title}`,
                html: enquiryEmailTemplate({
                    propertyTitle: property.title,
                    name,
                    email,
                    number,
                    city,
                    message
                })
            });
        } catch (error) {
            console.error("Failed to send enquiry email:", error);
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Enquiry sent successfully"));
});

// Create Booking
export const createBooking = asyncHandler(async (req, res) => {
  const bookingData = req.body;

  if (
    !bookingData.propertyId ||
    !bookingData.tenantId ||
    !bookingData.checkInDate ||
    !bookingData.checkOutDate
  ) {
    throw new ApiError(400, "All required booking fields must be provided");
  }

  // Check if property exists and is available
  const property = await Property.findById(bookingData.propertyId);
  if (!property) {
    throw new ApiError(404, "Property not found");
  }
  if (property.status !== "Available") {
    throw new ApiError(400, "Property is not available for booking");
  }

  // Calculate number of nights
  const checkIn = new Date(bookingData.checkInDate);
  const checkOut = new Date(bookingData.checkOutDate);
  const diffTime = Math.abs(checkOut - checkIn);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    throw new ApiError(400, "Check-out date must be after check-in date");
  }

  bookingData.numberOfNights = diffDays;

  // Calculate amounts if not provided
  if (!bookingData.monthlyRent) {
    bookingData.monthlyRent = property.price.amount;
  }
  if (!bookingData.securityDeposit) {
    bookingData.securityDeposit = property.securityDeposit || 0;
  }

  // Calculate rent amount based on nights
  if (!bookingData.rentAmount) {
    const dailyRate = bookingData.monthlyRent / 30;
    bookingData.rentAmount = dailyRate * diffDays;
  }

  // Calculate total amount
  if (!bookingData.totalAmount) {
    bookingData.totalAmount =
      bookingData.rentAmount +
      bookingData.securityDeposit +
      (bookingData.platformFee || 0);
  }

  const booking = await Booking.create(bookingData);

  // Update property bookings count
  property.bookings += 1;
  await property.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate("propertyId")
    .populate("tenantId", "firstname lastname email phone");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedBooking, "Booking created successfully"));
});

// Get All Bookings
export const getAllBookings = asyncHandler(async (req, res) => {
  const { status, paymentStatus, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const bookings = await Booking.find(query)
    .populate("propertyId", "title address images price")
    .populate("tenantId", "firstname lastname email phone")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Booking.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      bookings,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Bookings fetched successfully")
  );
});

// Get Booking By ID
export const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await Booking.findById(id)
    .populate("propertyId")
    .populate("tenantId", "firstname lastname email phone avatar");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking fetched successfully"));
});

// Update Booking
export const updateBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Don't allow updating certain fields directly
  delete updateData.propertyId;
  delete updateData.tenantId;

  const booking = await Booking.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("propertyId")
    .populate("tenantId", "firstname lastname email phone");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking updated successfully"));
});

// Update Booking Status
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const validStatuses = ["pending", "confirmed", "ongoing", "completed"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const updateData = { status };
  if (status === "confirmed") {
    updateData.confirmedAt = new Date();
  }
  if (status === "ongoing") {
    updateData.checkInAt = new Date();
  }

  const booking = await Booking.findByIdAndUpdate(id, updateData, {
    new: true,
  })
    .populate("propertyId")
    .populate("tenantId", "firstname lastname email phone");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Update property status if booking is confirmed
  if (status === "confirmed") {
    await Property.findByIdAndUpdate(booking.propertyId, { status: "Booked" });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking status updated successfully"));
});

// Delete Booking
export const deleteBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await Booking.findByIdAndDelete(id);

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Booking deleted successfully"));
});

// Get Bookings By Tenant
export const getBookingsByTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = { tenantId };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate("propertyId", "title address images price")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Booking.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      bookings,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Bookings fetched successfully")
  );
});

// Get Bookings By Property
export const getBookingsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = { propertyId };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate("tenantId", "firstname lastname email phone")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Booking.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      bookings,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Bookings fetched successfully")
  );
});

