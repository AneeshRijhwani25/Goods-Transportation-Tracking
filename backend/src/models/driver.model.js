import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const driverSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    refreshToken: {
      type: String,
    },

    // Vehicle Details
    vehicleDetails: {
      numberPlate: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      licenceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      vehicleType: {
        type: String,
        enum: ["small", "medium", "large"],
        required: true,
      },
    },

    // Driver's current location (GeoJSON format)
    location: {
      type: {
        type: String,
        enum: ['Point'], // 'location.type' must be 'Point'
        required: true,
      },
      coordinates: {
        type: [Number], // Array of numbers [longitude, latitude]
        required: true,
      },
    },
  },
  { timestamps: true }
);

// Create a 2dsphere index for geo queries on the location field
driverSchema.index({ location: '2dsphere' });

// Hash password before saving
driverSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to check if password is correct
driverSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate access token
driverSchema.methods.generateAccessToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
      email: this.email,
      number: this.number,
      fullName: this.fullName,
      vehicleType: this.vehicleDetails.vehicleType,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Method to generate refresh token
driverSchema.methods.generateRefreshToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export  const  Driver = mongoose.model("Driver", driverSchema);
