import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Property } from "../models/properties.models.js";

// Create Property
export const createProperty = asyncHandler(async (req, res) => {
  const propertyData = req.body;

  if (!propertyData.owner || !propertyData.title || !propertyData.description) {
    throw new ApiError(400, "Owner, title, and description are required");
  }

  const property = await Property.create(propertyData);

  return res
    .status(201)
    .json(new ApiResponse(201, property, "Property created successfully"));
});

// Get All Properties
export const getAllProperties = asyncHandler(async (req, res) => {
  const {
    city,
    propertyType,
    status,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const skip = (page - 1) * limit;
  const query = {};

  if (city) query["address.city"] = city;
  if (propertyType) query.propertyType = propertyType;
  if (status) query.status = status;
  if (minPrice || maxPrice) {
    query["price.amount"] = {};
    if (minPrice) query["price.amount"].$gte = parseFloat(minPrice);
    if (maxPrice) query["price.amount"].$lte = parseFloat(maxPrice);
  }

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const properties = await Property.find(query)
    .populate("owner", "firstname lastname email phone")
    .skip(skip)
    .limit(parseInt(limit))
    .sort(sort);

  const total = await Property.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      properties,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Properties fetched successfully")
  );
});

// Get Property By ID
export const getPropertyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id)
    .populate("owner", "firstname lastname email phone avatar")
    .populate("savedBy", "firstname lastname");

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  // Increment views
  property.views += 1;
  await property.save();

  return res
    .status(200)
    .json(new ApiResponse(200, property, "Property fetched successfully"));
});

// Get Property By Slug
export const getPropertyBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const property = await Property.findOne({ slug })
    .populate("owner", "firstname lastname email phone avatar")
    .populate("savedBy", "firstname lastname");

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  // Increment views
  property.views += 1;
  await property.save();

  return res
    .status(200)
    .json(new ApiResponse(200, property, "Property fetched successfully"));
});

// Update Property
export const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const property = await Property.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("owner", "firstname lastname email phone");

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, property, "Property updated successfully"));
});

// Delete Property
export const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findByIdAndDelete(id);

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Property deleted successfully"));
});

// Search Properties
export const searchProperties = asyncHandler(async (req, res) => {
  const {
    q,
    city,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    amenities,
    page = 1,
    limit = 10,
  } = req.query;

  const skip = (page - 1) * limit;
  const query = {};

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { "address.locality": { $regex: q, $options: "i" } },
      { "address.city": { $regex: q, $options: "i" } },
    ];
  }

  if (city) query["address.city"] = city;
  if (propertyType) query.propertyType = propertyType;
  if (bedrooms) query.bedrooms = parseInt(bedrooms);
  if (bathrooms) query.bathrooms = parseInt(bathrooms);
  if (amenities) {
    const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
    query.amenities = { $in: amenityArray };
  }

  if (minPrice || maxPrice) {
    query["price.amount"] = {};
    if (minPrice) query["price.amount"].$gte = parseFloat(minPrice);
    if (maxPrice) query["price.amount"].$lte = parseFloat(maxPrice);
  }

  const properties = await Property.find(query)
    .populate("owner", "firstname lastname email phone")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      properties,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Properties searched successfully")
  );
});

// Get Properties By Owner
export const getPropertiesByOwner = asyncHandler(async (req, res) => {
  const { ownerId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const properties = await Property.find({ owner: ownerId })
    .populate("owner", "firstname lastname email phone")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments({ owner: ownerId });

  return res.status(200).json(
    new ApiResponse(200, {
      properties,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Properties fetched successfully")
  );
});

// Get Nearby Properties
export const getNearbyProperties = asyncHandler(async (req, res) => {
  const { longitude, latitude, maxDistance = 10000 } = req.query;

  if (!longitude || !latitude) {
    throw new ApiError(400, "Longitude and latitude are required");
  }

  const properties = await Property.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        $maxDistance: parseInt(maxDistance), // in meters
      },
    },
    status: "Available",
  })
    .populate("owner", "firstname lastname email phone")
    .limit(20);

  return res
    .status(200)
    .json(new ApiResponse(200, properties, "Nearby properties fetched successfully"));
});

