import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    number: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["contact", "enquiry"], default: "contact" },
  },
  { timestamps: true }
);

export const Contact = mongoose.model("Contact", contactSchema);
