import express from "express";
import {
  registerUser,
  loginUser,
  verifyOTP,
  verifyLoginOTP,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updatePassword,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  saveProperty,
  unsaveProperty,
  getSavedProperties,
} from "../controllers/user.controller.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/login", loginUser);
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOTP);
router.post("/reset-password", resetPassword);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshAccessToken);

// Protected routes (add auth middleware later)
router.get("/me", getCurrentUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.put("/password/:id", updatePassword);

// Saved properties routes
router.post("/:id/save-property/:propertyId", saveProperty);
router.delete("/:id/unsave-property/:propertyId", unsaveProperty);
router.get("/:id/saved-properties", getSavedProperties);

export default router;

