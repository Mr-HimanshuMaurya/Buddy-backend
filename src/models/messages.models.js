import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // ===== RELATIONSHIPS =====
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Message must be linked to a booking"],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message must have a sender"],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message must have a recipient"],
    },

    // ===== MESSAGE CONTENT =====
    content: {
      type: String,
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },

    // ===== ATTACHMENTS (optional) =====
    attachments: [
      {
        type: {
          type: String, // image / file / video
          enum: ["image", "file", "video"],
        },
        url: {
          type: String,
          required: [true, "Attachment URL is required"],
        },
        size: {
          type: Number, // in bytes
        },
      },
    ],

    // ===== STATUS =====
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// ==================== INDEXES ====================
// For faster conversation loading
messageSchema.index({ bookingId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1 });

// ==================== VIRTUALS ====================
// Format timestamp for UI
messageSchema.virtual("formattedTime").get(function () {
  return this.createdAt
    ? this.createdAt.toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      })
    : "";
});

export const Message = mongoose.model("Message", messageSchema);
