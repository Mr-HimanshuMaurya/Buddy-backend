import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { verifyAccessToken } from "../utils/generateToken.js";
import { User } from "../models/user.models.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from cookies or Authorization header
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Access token is required");
  }

  // Verify token
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  // Get user from database
  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (!user.isActive) {
    throw new ApiError(401, "User account is deactivated");
  }

  // Attach user to request object
  req.user = user;
  next();
});

// Optional: Middleware to check if user has specific role
export const authorize = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "You don't have permission to access this resource");
    }

    next();
  });
};

