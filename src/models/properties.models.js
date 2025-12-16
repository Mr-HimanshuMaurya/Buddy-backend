import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Property must have an owner"],
    },
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
      trim: true,
      },
      locality: {
      type: String,
      required: [true, 'Locality is required'],
      trim: true,
      // Example: "Connaught Place"
    },
       city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,                                   // Index for filtering by city
      // Example: "New Delhi"
    },
      state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      // Example: "Delhi"
    },
    
    // Sub-field 21e: Pincode
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[0-9]{6}$/, 'Pincode must be 6 digits (India)'],
      // Example: "110001"
    },
     country: {
      type: String,
      default: 'India'
    },
    
    // Sub-field 21g: Landmark
    landmark: {
      type: String,
      // Optional landmark for easy identification
      // Example: "Near Delhi Metro Station"
    }
    },
    propertyType: {
      type: String,
      enum: {
        values: [
          "PG", // Paying Guest
          "1BHK", // 1 Bedroom Hall Kitchen
          "2BHK",
          "3BHK",
          "Villa",
          "Studio",
          "Shared Room", // Room sharing/coliving
          "Independent House",
        ],
        message: "{VALUE} is not a valid property type",
      },
      required: [true, "Property type is required"],
    },
    bedrooms: {
      type: Number,
      required: function() {
      return this.propertyType !== 'Shared Room';   // Skip for shared rooms
    },
    min: [0, 'Bedrooms cannot be negative'],
    max: [20, 'Bedrooms cannot exceed 20'],
    },
    bathrooms: {
      type: Number,
      required: [true, 'Number of bathrooms is required'],
      min: [1, 'At least 1 bathroom is required'],
      max: [10, 'Bathrooms cannot exceed 10'],
    },
    balconies: {
    type: Number,
    default: 0,
    min: [0, 'Balconies cannot be negative'],
  },

   images: [{
    
    // Sub-field 30a: Image URL
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      // Cloudinary HTTPS URL
      // Format: https://res.cloudinary.com/{cloud_name}/image/upload/...
      // Auto-optimized by Cloudinary
    },
    
    // Sub-field 30b: Cloudinary Public ID
    publicId: {
      type: String,
      required: [true, 'Image public ID is required'],
      // Used to delete image: cloudinary.uploader.destroy(publicId)
      // Example: "properties/507f1f77bcf86cd799439011/img1"
    },
    
    // Sub-field 30c: Thumbnail URL
    thumbnail: {
      type: String,
      // Compressed version for list views
      // Dimensions: 400x300 pixels
      // Quality: 70% (smaller file size)
      // URL: Same as main but with c_fill,h_300,q_70,w_400 params
    },
    
    // Sub-field 30d: Image Order
    order: {
      type: Number,
      default: 0
      // Used to sort images: 0 = primary, 1 = secondary, etc.
      // Primary image displayed in search results
    }
  }],

  floor: {
    type: Number,
    min: [0, 'Floor cannot be negative (0 is ground floor)'],
    // Example: 5 (means 5th floor)
  },

   totalFloors: {
    type: Number,
    min: [1, 'Building must have at least 1 floor'],
    // Example: 15
  },

  furnishingStatus: {
    type: String,
    enum: {
      values: [
        'Fully Furnished',                          // All furniture, appliances included
        'Semi Furnished',                           // Some furniture (bed, sofa)
        'Unfurnished'                               // No furniture
      ],
      message: '{VALUE} is not a valid furnishing status'
    },
    required: [true, 'Furnishing status is required'],
  },

    totalArea: {
      type: Number,
      required: [true, "Property area is required"],
      min: [50, "Area must be at least 50 square feet"],
      max: [100000, "Area cannot exceed 100000"],
    },
    areaUnit: {
      type: String,
      enum: ["sqft", "sqm"],
      default: "sqft",
    },
    amenities: [{
    type: String,
    enum: [
      // Basic Amenities
      'WiFi', 'Parking', 'Lift', 'Power Backup', 'Security Guard', 'CCTV',
      // Kitchen Amenities
      'Kitchen', 'Modular Kitchen', 'Gas Pipeline', 'Refrigerator', 'Microwave',
      // Comfort Amenities
      'AC', 'Heating', 'Geyser', 'Washing Machine', 'TV', 'Sofa', 'Bed', 'Wardrobe',
      // Outdoor
      'Garden', 'Swimming Pool', 'Gym', 'Club House', 'Kids Play Area',
      // Services
      'Water Supply', 'Waste Disposal', 'Housekeeping', 'Laundry',
      // Other
      'Pet Friendly', 'Visitor Parking', 'Intercom', 'Fire Safety'
    ]
    // Example: ['WiFi', 'AC', 'Parking', 'Gym']
  }],
    price: {
    
    // Sub-field 13a: Amount
    amount: {
      type: Number,
      required: [true, 'Price amount is required'],
      min: [0, 'Price cannot be negative'],
      // Example: 45000 (rent per month)
    },
    
    // Sub-field 13b: Currency
    currency: {
      type: String,
      default: 'INR',
      // Default is Indian Rupees
    },
    
    // Sub-field 13c: Period/Frequency
    period: {
      type: String,
      enum: {
        values: [
          'month',                                   // Monthly rent
          'year',                                    // Yearly rent
          'one-time'                                // Purchase price
        ],
        message: '{VALUE} is not a valid price period'
      },
      default: 'month'
      // Most common: monthly rent
    }
  },
    securityDeposit: {
      type: Number,
      default: 0,
    min: [0, 'Security deposit cannot be negative'],
    },

    maintenanceCharges: {
    type: Number,
    default: 0,
    min: [0, 'Maintenance charges cannot be negative'],
    // Example: 2000 per month
    // Covers: Water, electricity common areas, security, etc.
  },

  location: {
    type: {
      type: String,
      enum: ['Point'],                              // Always 'Point'
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],                               // [longitude, latitude]
      required: [true, 'Property coordinates are required'],
      // Format: [77.2273, 28.6139] for New Delhi
      // IMPORTANT: longitude first, then latitude
      // This is opposite of typical lat-long in maps!
      // Coordinates must be within valid ranges:
      // Longitude: -180 to 180
      // Latitude: -90 to 90
    }
  },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableTo: {
      type: Date,
      required: true,
    },
    status: {
    type: String,
    enum: {
      values: [
        'Available',                                 // Vacant and ready
        'Booked',                                    // Tenant has booked
        'Maintenance',                               // Under repair
        'Sold',                                      // Property sold (for BUY listings)
        'Inactive'                                   // Owner deactivated
      ],
      message: '{VALUE} is not a valid property status'
    },
    default: 'Available',
    index: true,                                     // Index for filtering
  },

  pgDetails: {
    
    // Sub-field 39a: Food Included
    foodIncluded: {
      type: Boolean,
      default: false
      // true = Meals included in rent
      // false = Meals not included (user cooks own)
    },
    
    // Sub-field 39b: Food Type (if included)
    foodType: {
      type: String,
      enum: ['Veg', 'Non-Veg', 'Both']
      // Veg = Vegetarian only
      // Non-Veg = Non-vegetarian allowed
      // Both = Mixed meals
    },
    
    // Sub-field 39c: Preferred Tenant
    preferredTenant: {
      type: String,
      enum: ['Boys', 'Girls', 'Both']
      // Boys = Only male tenants
      // Girls = Only female tenants
      // Both = Either gender
    },
    
    // Sub-field 39d: Notice Period
    noticePeriod: {
      type: Number,
      default: 30
      // Days notice required before leaving
      // Example: 30 (1 month notice)
    },
    
    // Sub-field 39e: Shared Room
    sharedRoom: {
      type: Boolean,
      default: false
      // true = Room shared with others
      // false = Private/individual room
    },
    
    // Sub-field 39f: Number of Roommates
    roommates: {
      type: Number
      // Number of other people in the room
      // Only filled if sharedRoom = true
      // Example: 2 (shared with 2 other people)
    }
  },

  rules: {
    
    // Sub-field 45a: Smoking Allowed
    smokingAllowed: {
      type: Boolean,
      default: false
      // true = Smoking permitted
      // false = No smoking
    },
    
    // Sub-field 45b: Pets Allowed
    petsAllowed: {
      type: Boolean,
      default: false
      // true = Can keep pets (dogs, cats, etc.)
      // false = No pets
    },
    
    // Sub-field 45c: Non-Vegetarian Allowed
    nonVegAllowed: {
      type: Boolean,
      default: true
      // true = Non-veg food allowed
      // false = Vegetarian only (common in some PGs)
    },
    
    // Sub-field 45d: Guests Allowed
    guestsAllowed: {
      type: Boolean,
      default: true
      // true = Friends/family can visit
      // false = No visitors
    },
    
    // Sub-field 45e: Gate Closing Time
    gateClosingTime: {
      type: String
      // Time when main gate closes
      // Format: "10:00 PM" or "22:00"
      // Example: "11:00 PM" means no entry after 11 PM
    }
  },

    Verified: {
    type: Boolean,
    default: false
    // true = Admin has verified property details
    // false = Not yet verified (might be spam/fake)
  },

   verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // ObjectId of admin user who verified
  },

   verifiedAt: {
    type: Date
    // When admin verified the property
    // Example: ISODate("2025-11-11T10:00:00Z")
  },

  // Purpose: SEO-friendly URL for property
  // Unique: Yes - Each property has unique slug
  // Auto-generated: From title + property ID
  // Format: Lowercase, hyphens instead of spaces

  slug: {
    type: String,
    unique: true,
    lowercase: true
    // Example: "spacious-2bhk-in-connaught-place-439012"
    // Used in URL: /properties/spacious-2bhk-in-connaught-place-439012
    // Better for SEO than /properties/507f1f77bcf86cd799439012
  },

    averageRating: {
      type: Number,
      default: 0,
      min: 0, 
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
       default: 0, // Example: 234 (means 234 people viewed this property)
    // Helps identify popular listings
    },

    savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Example: [ObjectId("...020"), ObjectId("...021")]
    // Auto-added when user clicks "Save"
    // Auto-removed when user clicks "Unsave"
  }],
    clicks: {
      type: Number,
      default: 0,
    },
    inquiries: {
      type: Number,
      default: 0,
    },
    bookings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, toJSON: { virtuals: true  }}
);

// ==================== GEOSPATIAL INDEX ====================
propertySchema.index({ location: '2dsphere' });    // For "find nearby" queries

// ==================== COMPOUND INDEXES ====================
// Speed up multi-field searches
propertySchema.index({ 'address.city': 1, status: 1, propertyType: 1 });
propertySchema.index({ 'price.amount': 1, status: 1 });
propertySchema.index({ owner: 1, status: 1 });

// ==================== VIRTUAL FIELDS (Calculated, Not Stored) ====================
// Price per day calculated from monthly rent
propertySchema.virtual('pricePerDay').get(function() {
  if (this.price.period === 'month') {
    return Math.round(this.price.amount / 30);
    // If rent is 45000/month, daily rate is 1500
  }
  return this.price.amount;
});

// ==================== PRE-SAVE MIDDLEWARE ====================
// Auto-generate slug from title
propertySchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')                 // Replace non-alphanumeric with hyphen
      .replace(/(^-|-$)/g, '') +                   // Remove leading/trailing hyphens
      '-' + this._id.toString().slice(-6);         // Add last 6 chars of ID
    // Example: "Spacious 2BHK" → "spacious-2bhk-439012"
  }
  next();
});

export const Property = mongoose.model("Property", propertySchema);
