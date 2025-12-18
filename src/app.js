import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/apiError.js";

// Import routes
import userRoutes from "./routes/user.routes.js";
import propertyRoutes from "./routes/property.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import messageRoutes from "./routes/message.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/properties", propertyRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

// Health check route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res, next) => {
  throw new ApiError(404, `Route ${req.originalUrl} not found`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      data: err.data || null,
    });
  }

  // Handle mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
      data: null,
    });
  }

  // Handle mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      errors: [],
      data: null,
    });
  }

  // Handle mongoose cast errors (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
      errors: [],
      data: null,
    });
  }

  // Default error
  console.error("Error:", err);
  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: [],
    data: null,
  });
});

export { app };
