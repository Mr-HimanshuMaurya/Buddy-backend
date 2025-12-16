import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Review must belong to a property"],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Review must be linked to a booking"],
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a tenant"],
    },

    // ======= RATING FIELDS =======
    overallRating: {
      type: Number,
      required: [true, "Overall rating is required"],
      min: [1, "Minimum rating is 1"],
      max: [5, "Maximum rating is 5"],
    },

    ratingDetails: {
      cleanliness: { type: Number, min: 1, max: 5, default: 0 },
      communication: { type: Number, min: 1, max: 5, default: 0 },
      amenities: { type: Number, min: 1, max: 5, default: 0 },
      value: { type: Number, min: 1, max: 5, default: 0 },
    },

    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },

    verified: {
      type: Boolean,
      default: false,
      // True = Review verified against completed booking
    },

    // ======= USER FEEDBACK =======
    helpful: {
      type: Number,
      default: 0,
      min: [0, "Helpful count cannot be negative"],
    },
    unhelpful: {
      type: Number,
      default: 0,
      min: [0, "Unhelpful count cannot be negative"],
    },

    // ======= PHOTO ATTACHMENTS =======
    photos: [
      {
        url: {
          type: String,
          required: [true, "Photo URL is required"],
        },
      },
    ],

    // ======= OWNER RESPONSE =======
    ownerResponse: {
      comment: { type: String, trim: true },
      respondedAt: { type: Date },
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// ==================== INDEXES ====================
// Faster queries for property reviews
reviewSchema.index({ propertyId: 1, createdAt: -1 });
reviewSchema.index({ tenantId: 1 });

// ==================== VIRTUALS ====================
// Calculate average from ratingDetails
reviewSchema.virtual("averageSubRating").get(function () {
  const { cleanliness, communication, amenities, value } = this.ratingDetails || {};
  const ratings = [cleanliness, communication, amenities, value].filter(r => r > 0);
  if (!ratings.length) return 0;
  return (
    ratings.reduce((sum, r) => sum + r, 0) / ratings.length
  ).toFixed(1);
});

export const Review = mongoose.model("Review", reviewSchema);
