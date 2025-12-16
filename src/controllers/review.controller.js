import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Review } from "../models/reviews.models.js";
import { Property } from "../models/properties.models.js";
import { Booking } from "../models/bookings.models.js";

// Create Review
export const createReview = asyncHandler(async (req, res) => {
  const reviewData = req.body;

  if (
    !reviewData.propertyId ||
    !reviewData.bookingId ||
    !reviewData.tenantId ||
    !reviewData.overallRating
  ) {
    throw new ApiError(400, "All required review fields must be provided");
  }

  // Check if booking exists and is completed
  const booking = await Booking.findById(reviewData.bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }
  if (booking.status !== "completed") {
    throw new ApiError(400, "Can only review completed bookings");
  }
  if (booking.tenantId.toString() !== reviewData.tenantId) {
    throw new ApiError(403, "You can only review your own bookings");
  }

  // Check if review already exists for this booking
  const existingReview = await Review.findOne({ bookingId: reviewData.bookingId });
  if (existingReview) {
    throw new ApiError(409, "Review already exists for this booking");
  }

  reviewData.verified = true;

  const review = await Review.create(reviewData);

  // Update property ratings
  const property = await Property.findById(reviewData.propertyId);
  if (property) {
    const allReviews = await Review.find({ propertyId: reviewData.propertyId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.overallRating, 0);
    property.averageRating = (totalRating / allReviews.length).toFixed(1);
    property.totalReviews = allReviews.length;
    await property.save();
  }

  const populatedReview = await Review.findById(review._id)
    .populate("propertyId", "title address")
    .populate("tenantId", "firstname lastname avatar")
    .populate("bookingId");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedReview, "Review created successfully"));
});

// Get All Reviews
export const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, verified } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (verified !== undefined) query.verified = verified === "true";

  const reviews = await Review.find(query)
    .populate("propertyId", "title address images")
    .populate("tenantId", "firstname lastname avatar")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Review.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      reviews,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Reviews fetched successfully")
  );
});

// Get Review By ID
export const getReviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id)
    .populate("propertyId")
    .populate("tenantId", "firstname lastname avatar")
    .populate("bookingId");

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Review fetched successfully"));
});

// Update Review
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Don't allow updating certain fields
  delete updateData.propertyId;
  delete updateData.bookingId;
  delete updateData.tenantId;
  delete updateData.verified;

  const review = await Review.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("propertyId", "title address")
    .populate("tenantId", "firstname lastname avatar");

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Recalculate property ratings
  const property = await Property.findById(review.propertyId);
  if (property) {
    const allReviews = await Review.find({ propertyId: review.propertyId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.overallRating, 0);
    property.averageRating = (totalRating / allReviews.length).toFixed(1);
    await property.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated successfully"));
});

// Delete Review
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const propertyId = review.propertyId;

  await Review.findByIdAndDelete(id);

  // Recalculate property ratings
  const property = await Property.findById(propertyId);
  if (property) {
    const allReviews = await Review.find({ propertyId });
    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.overallRating, 0);
      property.averageRating = (totalRating / allReviews.length).toFixed(1);
      property.totalReviews = allReviews.length;
    } else {
      property.averageRating = 0;
      property.totalReviews = 0;
    }
    await property.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Review deleted successfully"));
});

// Get Reviews By Property
export const getReviewsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ propertyId })
    .populate("tenantId", "firstname lastname avatar")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Review.countDocuments({ propertyId });

  return res.status(200).json(
    new ApiResponse(200, {
      reviews,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Reviews fetched successfully")
  );
});

// Get Reviews By Tenant
export const getReviewsByTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ tenantId })
    .populate("propertyId", "title address images")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Review.countDocuments({ tenantId });

  return res.status(200).json(
    new ApiResponse(200, {
      reviews,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Reviews fetched successfully")
  );
});

