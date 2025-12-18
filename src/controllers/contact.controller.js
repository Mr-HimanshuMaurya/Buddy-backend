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

export const getDetails = asyncHandler(async (req, res) => {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, contacts, "Contacts fetched successfully"));
});
