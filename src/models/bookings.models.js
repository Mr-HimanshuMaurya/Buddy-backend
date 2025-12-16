import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Booking must be associated with a property"],
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Booking must have a tenant"],
    },
    checkInDate: {
      type: Date,
      required: [true, "Check-in date is required"],
    },
    checkOutDate: {
      type: Date,
      required: [true, "Check-out date is required"],
    },
    numberOfNights: {
      type: Number,
      required: true,
      min: [1, "Number of nights must be at least 1"],
    },
    monthlyRent: {
      type: Number,
      required: [true, "Monthly rent is required"],
      min: [0, "Monthly rent cannot be negative"],
    },
    rentAmount: {
      type: Number,
      required: [true, "Rent amount is required"],
      min: [0, "Rent amount cannot be negative"],
    },
    securityDeposit: {
      type: Number,
      required: [true, "Security deposit is required"],
      min: [0, "Security deposit cannot be negative"],
    },
    platformFee: {
      type: Number,
      default: 0,
      min: [0, "Platform fee cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total booking amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "ongoing", "completed"],
        message:
          "{VALUE} is not a valid booking status (pending, confirmed, ongoing, completed)",
      },
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["unpaid", "paid", "refunded"],
        message:
          "{VALUE} is not a valid payment status (unpaid, paid, refunded)",
      },
      default: "unpaid",
    },

    // Timestamps to track booking lifecycle
    createdAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: {
      type: Date,
    },
    checkInAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// ==================== INDEXES ====================
// Faster queries for bookings and analytics
bookingSchema.index({ propertyId: 1, status: 1 });
bookingSchema.index({ tenantId: 1, createdAt: -1 });

// ==================== VIRTUALS ====================
// Automatically compute total days booked
bookingSchema.virtual("durationDays").get(function () {
  if (this.checkInDate && this.checkOutDate) {
    const diff =
      (this.checkOutDate.getTime() - this.checkInDate.getTime()) /
      (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  }
  return 0;
});

export const Booking = mongoose.model("Booking", bookingSchema);
