import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Enquiry must be associated with a property"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Optional, in case user is logged in
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    number: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "responded", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
enquirySchema.index({ propertyId: 1, createdAt: -1 });
enquirySchema.index({ status: 1, createdAt: -1 });

export const Enquiry = mongoose.model("Enquiry", enquirySchema);

