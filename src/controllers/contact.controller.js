import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Contact } from "../models/contact.models.js";

export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, number, city, message } = req.body;
  if (!name || !number || !message) throw new ApiError(400, "Name, Number and Message are required");
  const contact = await Contact.create({ name, email, number, city, message, type: "contact" });
  return res.status(201).json(new ApiResponse(201, contact, "Contact form submitted successfully"));
});

export const submitEnquiry = asyncHandler(async (req, res) => {
    const { name, email, number, city, message } = req.body;
    if (!name || !number || !message) throw new ApiError(400, "Name, Number and Message are required");
    const contact = await Contact.create({ name, email, number, city, message, type: "enquiry" });
    return res.status(201).json(new ApiResponse(201, contact, "Enquiry submitted successfully"));
});

// Get All Contacts (Admin Only) - with pagination
export const getDetails = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = {};
  if (type) query.type = type;

  const contacts = await Contact.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Contact.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      contacts,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Contacts fetched successfully")
  );
});

// Delete Contact (Admin Only)
export const deleteContact = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contact = await Contact.findByIdAndDelete(id);

  if (!contact) {
    throw new ApiError(404, "Contact not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Contact deleted successfully"));
});
