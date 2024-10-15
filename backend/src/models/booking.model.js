import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",  
      required: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver", 
    },
    
    pickupLocation: {
      type: { type: String, default: "Point" },  // GeoJSON Point type for tracking
        coordinates: [Number]
    },
    dropoffLocation: {
      type: { type: String, default: "Point" },  // GeoJSON Point type for tracking
        coordinates: [Number], 
    },
    packageDetails: {
      description: String,
      weight: {
        type: Number, 
      },
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "picked-up", "on-the-way", "delivered"],
      default: "pending",
    },
    realTimeTracking: {
      driverLocation: {
        type: { type: String, default: "Point" },  // GeoJSON Point type for tracking
        coordinates: [Number],  // [longitude, latitude]
      },
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
