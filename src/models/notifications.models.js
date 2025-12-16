import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification must belong to a user"],
      index: true,
    },

    // ===== CORE FIELDS =====
    type: {
      type: String,
      required: [true, "Notification type is required"],
      trim: true,
      // Examples: "booking", "payment", "review", "system", "property"
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },

    
    relatedResource: {
      type: {
        type: String,
        // Example: "Booking", "Property", "Payment"
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        // Example: ObjectId("booking123...")
      },
    },

    // ===== DELIVERY CHANNELS =====
    channels: {
      email: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
      },
      sms: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
      },
      push: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
      },
      inApp: {
        sent: { type: Boolean, default: true },
        sentAt: { type: Date, default: Date.now },
      },
    },

    // ===== STATUS =====
    read: {
      type: Boolean,
      default: false,
      // true = user has opened it, false = new
    },

    // ===== PRIORITY =====
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// ==================== INDEXES ====================
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

// ==================== VIRTUALS ====================
// Example: Simple text summary
notificationSchema.virtual("summary").get(function () {
  return `${this.title} - ${this.message.substring(0, 80)}...`;
});

export const Notification = mongoose.model("Notification", notificationSchema);
