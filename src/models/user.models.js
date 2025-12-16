import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "Firstname is required"],
      trim: true, //removes leading/trailing whitespaces
      minlength: [2, "Name must be atleast 2 charaters"],
      maxlength: [20, "Name cannot exceeds 20 character"],
      match: [/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces"],
    },
    lastname: {
      type: String,
      required: [true, "Lastname  is required"],
      trim: true,
      minlength: [2, "Name must be atleast 2 charaters"],
      maxlength: [20, "Name cannot exceeds 20 character"],
      match: [/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already registered"], //MongoDb
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Valid email regex
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: [true, "Phone number already registered"],
      trim: true,
      match: [
        /^[6-9]\d{9}$/, // 10 digit phone, starts with 6-9
        "Please provide a valid 10 digit phone number",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't return password in queries
    },
    role: {
      type: String,
      enum: {
        values: ["owner", "tenant", "admin"],
        message: "{VALUE} is not a valid role. Choose: owner, tenant, or admin",
      },
      default: "tenant",
      required: true,
    },
    avatar: {
      // Sub-field 6a: Avatar URL
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/demo/image/upload/default-avatar.png",
        // This is a Cloudinary CDN URL
        // Cloudinary auto-optimizes: WebP for modern browsers, JPEG for old
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.jpg
      },
      publicId: {
        type: String,
        // Used to delete old avatar when user uploads new one
        // Example: "avatars/user_507f1f77bcf86cd799439011"
        // Cloudinary needs this ID to delete images
      },
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
      // false = Not verified yet
      // true = Email verified via OTP
      // Required for login in strict mode
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
      // false = Phone not verified
      // true = Phone verified via SMS OTP (from Twilio)
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
      // false = Profile incomplete (missing address, phone verified, etc)
      // true = All required fields filled
    },

    emailOTP: {
      code: String, // 6-digit OTP like "123456"
      expiresAt: Date, // Expires in 10 minutes
      // Auto-deleted after verification
      // Example flow:
      // 1. User registers → code: "423891", expiresAt: 2025-11-12T12:40:00Z
      // 2. User enters OTP → Server verifies
      // 3. If correct → emailOTP set to undefined
    },

    phoneOTP: {
      code: String, // 6-digit SMS OTP
      expiresAt: Date, // 10 minutes validity
      // Sent via Twilio API
      // User receives SMS: "Your OTP is: 954832"
    },

    passwordResetToken: {
      type: String,
      // This is SHA256 hash of random token sent in email
      // Never stored as plain text
      // Example email link: /reset-password/7c6e84c1a3e5f2b9d8a4c6e3f1b5a9d7
      // Hashed version stored in DB for security
    },
    passwordResetExpires: {
      type: Date,
      // Set to Date.now() + 30 minutes when user clicks "Forgot Password"
      // If token used after this time: "Token expired, request new reset"
    },
    googleId: {
      type: String,
      // Unique Google account identifier
      // Example: "118364165166123456789"
      // Retrieved from Google OAuth response
    },

    facebookId: {
      type: String,
      // Unique Facebook account identifier
      // Example: "1234567890123456"
    },

    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      pincode: {
        type: String,
        match: [/^[0-9]{6}$/, "Pincode must be 6 digits"],
      },
      country: {
        type: String,
        default: "India",
      },
    },
    savedProperties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'                                 // Links to Property model
    // Populated when user clicks "Save" button
    // Removed when user clicks "Unsave"
  }],
  bookingHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
    // Will store: PropertyID, Dates booked, Status
  }],
  isActive: {
    type: Boolean,
    default: true
    // true = Account active and working
    // false = Account deactivated (soft delete)
    // Allows data recovery if user wants to reactivate
  },
  lastLogin: {
    type: Date
    // Example: ISODate("2025-11-12T12:30:00Z")
    // If null: User has never logged in (just registered)
  },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// ==================== INDEXES FOR PERFORMANCE ====================
userSchema.index({ email: 1 });                    // Faster email lookups
userSchema.index({ phone: 1 });                    // Faster phone lookups
userSchema.index({ createdAt: -1 });               // Sort users by newest first

// ==================== PRE-SAVE MIDDLEWARE ====================
// Hash password before saving to database
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const saltRounds = 10;                            // Higher = more secure but slower
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ==================== INSTANCE METHODS ====================
// Compare password during login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
  // Returns true if passwords match, false if don't
};

// Generate 6-digit OTP
userSchema.methods.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
  // Returns random 6-digit string like "423891"
};

export const User = mongoose.model("User", userSchema);
