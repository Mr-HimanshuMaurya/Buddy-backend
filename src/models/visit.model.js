import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Visit must be associated with a property"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Optional, in case we allow guest visits or just capture form data
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
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Visit date is required"],
    },
    time: {
      type: String,
      required: [true, "Visit time is required"],
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Visit = mongoose.model("Visit", visitSchema);
