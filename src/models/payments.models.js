import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Payment must be linked to a booking"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Payment must be linked to a user"],
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      // ISO currency code, default Indian Rupee
    },
    razorpayOrderId: {
      type: String,
      required: [true, "Razorpay order ID is required"],
    },
    razorpayPaymentId: {
      type: String,
      // Set after successful payment
    },
    method: {
      type: String,
      enum: ["card", "netbanking", "upi", "wallet"],
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "failed", "refunded"],
        message:
          "{VALUE} is not a valid payment status (pending, completed, failed, refunded)",
      },
      default: "pending",
      index: true,
    },

    // ===== Refund Information =====
    refund: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ["none", "initiated", "completed", "failed"],
        default: "none",
      },
      refundId: { type: String }, // Razorpay refund ID
    },

    // ===== Tax Details =====
    tax: {
      type: Number,
      default: 0,
    },
    gst: {
      type: Number,
      default: 0,
    },

    // ===== Time Tracking =====
    createdAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      // Set when payment is confirmed
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// ==================== INDEXES ====================
paymentSchema.index({ bookingId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });

// ==================== VIRTUALS ====================
// Compute total after tax and GST
paymentSchema.virtual("totalWithTax").get(function () {
  return this.amount + (this.tax || 0) + (this.gst || 0);
});

export const Payment = mongoose.model("Payment", paymentSchema);
