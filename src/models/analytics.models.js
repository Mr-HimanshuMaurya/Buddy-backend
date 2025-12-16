import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    // ===== BASIC IDENTIFIERS =====
    date: {
      type: Date,
      required: [true, "Analytics date is required"],
      index: true,
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
      required: [true, "Analytics period is required"],
    },

    // ===== RELATIONSHIP =====
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Analytics must reference a property"],
      index: true,
    },

    // ===== METRICS SECTION =====
    metrics: {
      views: { type: Number, default: 0, min: 0 },
      clicks: { type: Number, default: 0, min: 0 },
      inquiries: { type: Number, default: 0, min: 0 },
      bookings: { type: Number, default: 0, min: 0 },
      conversion: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        // Represents % of clicks converted to bookings
      },
    },

    // ===== FINANCIAL SECTION =====
    financial: {
      revenue: { type: Number, default: 0, min: 0 },
      commission: { type: Number, default: 0, min: 0 },
      netRevenue: { type: Number, default: 0, min: 0 },
    },

    // ===== OCCUPANCY SECTION =====
    occupancy: {
      daysBooked: { type: Number, default: 0, min: 0 },
      daysAvailable: { type: Number, default: 0, min: 0 },
      occupancyRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        // % of days booked out of total available
      },
      revenuePerAvailableDay: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// ==================== INDEXES ====================
// Fast lookups for time-based and property analytics
analyticsSchema.index({ propertyId: 1, date: -1 });
analyticsSchema.index({ period: 1, date: -1 });

// ==================== VIRTUALS ====================
// Auto-compute conversion rate if not manually provided
analyticsSchema.virtual("computedConversion").get(function () {
  if (this.metrics.clicks > 0) {
    return ((this.metrics.bookings / this.metrics.clicks) * 100).toFixed(2);
  }
  return 0;
});

export const Analytics = mongoose.model("Analytics", analyticsSchema);
