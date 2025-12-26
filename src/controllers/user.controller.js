import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { OTP } from "../models/otp.models.js";
import sendEmail from "../utils/sendEmail.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/generateToken.js";

// Register User
export const registerUser = asyncHandler(async (req, res) => {
  const { firstname, lastname, email, phone, password, role } = req.body;

  if (!firstname || !lastname || !email || !phone || !password) {
    throw new ApiError(400, "All required fields must be provided");
  }

  // Check if user is trying to register as admin
  const userRole = role || "tenant";
  if (userRole === "admin") {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      throw new ApiError(403, "Admin account already exists. Only one admin is allowed.");
    }
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with email or phone already exists");
  }

  const user = new User({
    firstname,
    lastname,
    email,
    phone,
    password,
    role: userRole,
  });

  await user.save();

  // Generate and save OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  await OTP.create({
    email,
    otp: otpCode,
  });

  try {
    await sendEmail({
      email: user.email,
      subject: " Verify your email",
      message: `Your verification code is: ${otpCode}. Valid for 10 minutes.`,
    });
  } catch (error) {
    // If email fails, we might want to delete the user or handle it. 
    // For now, we'll log it, but user is created.
    console.error("Email sending failed:", error);
    // throw new ApiError(500, "Error sending verification email");
  }

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          user: { email: createdUser.email },
        },
        "User registered successfully. Please verify your email with the OTP sent."
      )
    );
});

// Verify OTP
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User is already verified. Please login."));
  }

  // Find OTP in OTP collection
  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.isEmailVerified = true;
  await user.save();

  // Delete the OTP record after successful verification
  await OTP.deleteOne({ _id: otpRecord._id });

  const verifiedUser = await User.findById(user._id).select("-password");

  // Generate tokens
  const accessToken = generateAccessToken(verifiedUser._id);
  const refreshToken = generateRefreshToken(verifiedUser._id);

  // Set tokens in cookies
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: verifiedUser,
          accessToken,
          refreshToken,
        },
        "Email verified successfully"
      )
    );
});

// Login User (Step 1: Validate credentials & Send OTP)
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Check if user account is active (not terminated)
  if (!user.isActive) {
    throw new ApiError(403, "Your account has been terminated. Please contact support.");
  }

  // Check if user is verified
  if (!user.isEmailVerified) {
    // User is not verified, send OTP for verification
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });
    
    await OTP.create({
      email,
      otp: otpCode,
    });

    try {
      await sendEmail({
        email: user.email,
        subject: "Email Verification Required",
        message: `Your verification code is: ${otpCode}. Valid for 10 minutes. Please verify your email to login.`,
      });
    } catch (error) {
      throw new ApiError(500, "Error sending verification OTP. Please try again.");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { email: user.email, requiresVerification: true },
          "Please verify your email first. OTP sent to your email."
        )
      );
  }

  // User is verified, login directly without OTP
  user.lastLogin = new Date();
  await user.save();

  const loggedInUser = await User.findById(user._id).select("-password");

  // Generate tokens
  const accessToken = generateAccessToken(loggedInUser._id);
  const refreshToken = generateRefreshToken(loggedInUser._id);

  // Set tokens in cookies
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// Verify Login OTP (Step 2: Verify OTP & Issue Tokens)
export const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if user account is active (not terminated)
  if (!user.isActive) {
    throw new ApiError(403, "Your account has been terminated. Please contact support.");
  }

  // Check if user is verified - must be verified to login
  if (!user.isEmailVerified) {
    // If OTP is correct but user not verified, mark as verified and login
    user.isEmailVerified = true;
    await user.save();
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Delete the OTP record
  await OTP.deleteOne({ _id: otpRecord._id });

  const loggedInUser = await User.findById(user._id).select("-password");

  // Generate tokens
  const accessToken = generateAccessToken(loggedInUser._id);
  const refreshToken = generateRefreshToken(loggedInUser._id);

  // Set tokens in cookies
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// Logout User
export const logoutUser = asyncHandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Refresh Access Token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(incomingRefreshToken);

  if (!decoded) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // Get user
  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (!user.isActive) {
    throw new ApiError(401, "User account is deactivated");
  }

  // Generate new tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set tokens in cookies
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
        },
        "Access token refreshed successfully"
      )
    );
});

// Get Current User
export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.params.id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

// Get All Users
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (role) {
    query.role = role;
  }

  const users = await User.find(query)
    .select("-password")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    }, "Users fetched successfully")
  );
});

// Get User By ID
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .select("-password")
    .populate("savedProperties")
    .populate("bookingHistory");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

// Update User
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData.password;
  delete updateData.email;
  delete updateData.phone;

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

// Delete User (Soft Delete)
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

// Forgot Password - Send OTP
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  // Generate and save OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Delete any existing OTP for this email
  await OTP.deleteMany({ email });
  
  await OTP.create({
    email,
    otp: otpCode,
  });

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Verification Code",
      message: `Your password reset verification code is: ${otpCode}. Valid for 10 minutes.`,
    });
  } catch (error) {
    throw new ApiError(500, "Error sending reset OTP. Please try again.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email },
        "OTP sent to your email. Please verify to reset password."
      )
    );
});

// Verify Forgot Password OTP
export const verifyForgotPasswordOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // OTP verified successfully, return success
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email },
        "OTP verified successfully. You can now reset your password."
      )
    );
});

// Reset Password (After OTP verification)
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, OTP, and new password are required");
  }

  // Verify OTP again for security
  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Delete the OTP record
  await OTP.deleteOne({ _id: otpRecord._id });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully. You can now login with your new password."));
});

// Update Password (for logged in users)
export const updatePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  const user = await User.findById(id).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.comparePassword(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

// Save Property
export const saveProperty = asyncHandler(async (req, res) => {
  const { id, propertyId } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.savedProperties.includes(propertyId)) {
    throw new ApiError(400, "Property already saved");
  }

  user.savedProperties.push(propertyId);
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Property saved successfully"));
});

// Unsave Property
export const unsaveProperty = asyncHandler(async (req, res) => {
  const { id, propertyId } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.savedProperties = user.savedProperties.filter(
    (id) => id.toString() !== propertyId
  );
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Property unsaved successfully"));
});

// Get Saved Properties
export const getSavedProperties = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).populate("savedProperties");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user.savedProperties, "Saved properties fetched successfully")
    );
});

