import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Analytics } from "../models/analytics.models.js";

// Create Analytics
export const createAnalytics = asyncHandler(async (req, res) => {
  const analyticsData = req.body;

  if (
    !analyticsData.propertyId ||
    !analyticsData.date ||
    !analyticsData.period
  ) {
    throw new ApiError(400, "Property ID, date, and period are required");
  }

  const analytics = await Analytics.create(analyticsData);

  const populatedAnalytics = await Analytics.findById(analytics._id)
    .populate("propertyId", "title address owner");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedAnalytics, "Analytics created successfully"));
});

// Get All Analytics
export const getAllAnalytics = asyncHandler(async (req, res) => {
  const { period, propertyId, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (period) query.period = period;
  if (propertyId) query.propertyId = propertyId;

  const analytics = await Analytics.find(query)
    .populate("propertyId", "title address owner")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ date: -1 });

  const total = await Analytics.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      analytics,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Analytics fetched successfully")
  );
});

// Get Analytics By ID
export const getAnalyticsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const analytics = await Analytics.findById(id)
    .populate("propertyId", "title address owner");

  if (!analytics) {
    throw new ApiError(404, "Analytics not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, analytics, "Analytics fetched successfully"));
});

// Update Analytics
export const updateAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Don't allow updating certain fields
  delete updateData.propertyId;

  const analytics = await Analytics.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("propertyId", "title address owner");

  if (!analytics) {
    throw new ApiError(404, "Analytics not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, analytics, "Analytics updated successfully"));
});

// Delete Analytics
export const deleteAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const analytics = await Analytics.findByIdAndDelete(id);

  if (!analytics) {
    throw new ApiError(404, "Analytics not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Analytics deleted successfully"));
});

// Get Analytics By Property
export const getAnalyticsByProperty = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { period, startDate, endDate, page = 1, limit = 30 } = req.query;
  const skip = (page - 1) * limit;

  const query = { propertyId };
  if (period) query.period = period;

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const analytics = await Analytics.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ date: -1 });

  const total = await Analytics.countDocuments(query);

  // Calculate aggregate metrics
  const aggregateMetrics = await Analytics.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$metrics.views" },
        totalClicks: { $sum: "$metrics.clicks" },
        totalInquiries: { $sum: "$metrics.inquiries" },
        totalBookings: { $sum: "$metrics.bookings" },
        totalRevenue: { $sum: "$financial.revenue" },
        totalCommission: { $sum: "$financial.commission" },
        totalNetRevenue: { $sum: "$financial.netRevenue" },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      analytics,
      aggregateMetrics: aggregateMetrics[0] || {},
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Analytics fetched successfully")
  );
});

// Get Analytics By Date Range
export const getAnalyticsByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, period, propertyId } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Start date and end date are required");
  }

  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };

  if (period) query.period = period;
  if (propertyId) query.propertyId = propertyId;

  const analytics = await Analytics.find(query)
    .populate("propertyId", "title address owner")
    .sort({ date: 1 });

  // Calculate aggregate metrics
  const aggregateMetrics = await Analytics.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$metrics.views" },
        totalClicks: { $sum: "$metrics.clicks" },
        totalInquiries: { $sum: "$metrics.inquiries" },
        totalBookings: { $sum: "$metrics.bookings" },
        totalRevenue: { $sum: "$financial.revenue" },
        totalCommission: { $sum: "$financial.commission" },
        totalNetRevenue: { $sum: "$financial.netRevenue" },
        avgConversion: { $avg: "$metrics.conversion" },
        avgOccupancyRate: { $avg: "$occupancy.occupancyRate" },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      analytics,
      aggregateMetrics: aggregateMetrics[0] || {},
      total: analytics.length,
    }, "Analytics fetched successfully")
  );
});

