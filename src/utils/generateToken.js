import jwt from "jsonwebtoken";

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production",
    {
      expiresIn: process.env.JWT_EXPIRY || "7d",
    }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-this-in-production",
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || "30d",
    }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production"
    );
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-this-in-production"
    );
  } catch (error) {
    return null;
  }
};

