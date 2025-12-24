import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // The document will be automatically deleted after 600 seconds (10 minutes)
    },
  },
  { timestamps: true }
);

// Send email before saving OTP (Optional, but usually logic is in controller)
// otpSchema.pre("save", async function (next) {
//   // Send email here if needed
//   next();
// });

export const OTP = mongoose.model("OTP", otpSchema);
