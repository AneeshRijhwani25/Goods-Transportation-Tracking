import { Booking } from '../models/booking.model.js';
import { Driver } from '../models/driver.model.js';
import { socketManager } from '../db/socketManager.js';
import axios from 'axios';
import { redisClient } from "../app.js";

export const requestBooking = async (req, res) => {
    try {
        const { userId, pickupLocation, dropoffLocation, vehicleDetails, price } = req.body;
        // validate all data
        if (!userId || !pickupLocation || !dropoffLocation || !vehicleDetails || !price){
            return res.status(400).json({ message: "Please fill all fields" });
        }
        
        // Find nearby available drivers based on location and vehicle type
        const drivers = await Driver.find({
            isAvailable: true,
            'vehicleDetails.vehicleType': vehicleDetails.vehicleType,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [pickupLocation.coordinates[1], pickupLocation.coordinates[0]],
                    },
                    $maxDistance: 500000 // Example: 5 km radius
                }
            }
        });
        console.log(drivers)
        if (drivers.length === 0) {
            return res.status(404).json({ error: 'No nearby drivers available' });
        }

        // Create a new booking request (status: pending)
        const booking = await Booking.create({
            user: userId,
            pickupLocation,
            dropoffLocation,
            price,
            vehicleDetails,
            status: 'pending' // Mark as pending until a driver accepts
        });
        console.log(booking)
        // Notify all nearby drivers of the new booking request
        socketManager.notifyNearbyDrivers(drivers, 'newBookingRequest', {
            bookingId: booking._id,
            pickupLocation,
            dropoffLocation,
            price,
            userId
        });

        // Return the booking details to the client while waiting for driver acceptance
        return res.status(200).json({
            message: 'Booking request sent to drivers',
            bookingId: booking._id
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};


// Confirm booking after a driver accepts
export const confirmBooking = async (req, res) => {
    try {
        const { driverId, userId, bookingId } = req.body;
        // Find the driver and ensure they are available
        const driver = await Driver.findById(driverId);
        if (!driver || !driver.isAvailable) {
            return res.status(400).json({ error: 'Driver not available' });
        }

        // Find and update the existing booking
        const booking = await Booking.findById(bookingId);
        if (!booking || booking.status !== 'pending') {
            return res.status(400).json({ error: 'Invalid booking or booking already accepted' });
        }

        // Update booking status and assign driver
        booking.driver = driverId;
        booking.status = 'on-the-way';
        await booking.save();

        // Mark the driver as unavailable
        driver.isAvailable = false;
        await driver.save();

        const io = socketManager.io();
        const room = `booking_${booking._id}`;

        const userSocket = socketManager.connectedUsers.get(userId);
        const driverSocket = socketManager.connectedDrivers.get(driverId);

        // Let both the driver and user join the booking room
        if (userSocket) {
            io.to(userSocket).emit('joinBookingRoom', {
                bookingId: booking._id.toString(),
                driverDetails: {
                    name: driver.fullName,
                    vehicleNumber: driver.vehicleDetails.numberPlate,
                    currentLocation: driver.location
                }
            });
        }

        if (driverSocket) {
            io.to(driverSocket).emit('joinBookingRoom', {
                bookingId: booking._id.toString(),
                userId,
                driverId
            });
        }

        // Notify both user and driver about the booking confirmation
        socketManager.notifyUser(userId, 'bookingConfirmed', {
            bookingId: booking._id,
            driverDetails: {
                name: driver.fullName,
                vehicleNumber: driver.vehicleDetails.numberPlate,
                currentLocation: driver.location
            }
        });

        socketManager.notifyDriver(driverId, 'bookingConfirmed', {
            bookingId: booking._id,
            userId,
        });

        return res.status(200).json({
            message: 'Booking confirmed',
            booking
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

// Update driver's real-time location
export const updateDriverLocation = async (req, res) => {
    try {

        const { bookingId, driverLocation } = req.body;

        const booking = await Booking.findById(bookingId.toString());
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found or not in progress' });
        }
        // Update driver's real-time location using GeoJSON to booking
        booking.realTimeTracking.driverLocation = {
            type: 'Point',
            coordinates: [driverLocation.longitude, driverLocation.latitude]
        };
        await booking.save();
        // update driver location also 
        const driver = await Driver.findById(booking.driver);
        driver.location = {
            type: 'Point',
            coordinates: [driverLocation.longitude, driverLocation.latitude]
        };
        await driver.save();
        // Notify the user via socket
        socketManager.notifyUser(booking.user.toString(), 'driverLocationUpdate', booking.realTimeTracking.driverLocation);

        // await redisClient.set(`driverLocation_${bookingId}`, JSON.stringify(booking.realTimeTracking.driverLocation), 'EX', 60 * 5); // Cache for 5 minutes
        
        res.status(200).json({ message: 'Driver location updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId, status } = req.body;
        // Find the booking by ID
        const booking = await Booking.findById(bookingId.toString());
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }


        // Update the booking status
        booking.status = status;
        await booking.save();
        // Notify the user via socket
        const room = `booking_${bookingId}`;
        socketManager.notifyUser(booking.user.toString(), 'packageStatusUpdate', {
            message: `Package status updated to ${status}`,
            status,
            bookingId
        });

        res.status(200).json({ message: `Booking status updated to ${status}` });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const calculateBookingCost = async (pickupLocation, dropoffLocation, vehicleType) => {
    const apiKey = process.env.DISTANCE_MATRIX_API_KEY;

    // Format the origin and destination for the request
    const origin = `${pickupLocation.coordinates[0]},${pickupLocation.coordinates[1]}`;
    const destination = `${dropoffLocation.coordinates[0]},${dropoffLocation.coordinates[1]}`;


    // console.log("Origin:", origin, "Destination:", destination);

    const url = `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;
    // console.log("API URL:", url);

    try {
        const response = await axios.get(url);
        // console.log("API Response:", JSON.stringify(response.data, null, 2));

        // Check if the response status is OK and elements exist
        if (response.data.status === "OK" && response.data.rows[0].elements[0].status === "OK") {
            const distanceInMeters = response.data.rows[0].elements[0].distance.value;
            const durationInSeconds = response.data.rows[0].elements[0].duration.value;

            const distanceInKilometers = distanceInMeters / 1000;
            const durationInMinutes = durationInSeconds / 60;

            // Calculate surge multiplier
            const surgeMultiplier = await getSurgeMultiplier();

            // Calculate final booking cost
            const cost = computeCost(distanceInKilometers, durationInMinutes, vehicleType, surgeMultiplier);

            return {
                distance: distanceInKilometers,
                duration: durationInMinutes,
                cost: cost,
            };
        } else {
            console.log("Unexpected response from DistanceMatrix API:", response.data);
            throw new Error("Invalid response from DistanceMatrix API");
        }
    } catch (error) {
        console.error("Error fetching distance:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        }
        throw new Error("Failed to fetch distance and duration.");
    }
};

// Surge pricing logic
const getSurgeMultiplier = async () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 7 && currentHour < 10) {
        return 1.5; // Morning rush hour
    } else if (currentHour >= 16 && currentHour < 19) {
        return 1.3; // Evening rush hour
    } else {
        return 1.0; // Normal pricing
    }
};

// Cost calculation based on distance, duration, and vehicle type
const computeCost = (distanceInKilometers, durationInMinutes, vehicleType, surgeMultiplier) => {
    const basePrice = 5; // Base price
    let pricePerKm, pricePerMin;

    // Pricing based on vehicle type
    switch (vehicleType) {
        case 'truck':
            pricePerKm = 3;
            pricePerMin = 0.7;
            break;
        case 'van':
            pricePerKm = 2.5;
            pricePerMin = 0.6;
            break;
        default: // For car or others
            pricePerKm = 2;
            pricePerMin = 0.5;
            break;
    }

    // Final cost calculation with surge pricing
    const cost = (basePrice + (pricePerKm * distanceInKilometers) + (pricePerMin * durationInMinutes)) * surgeMultiplier;
    return cost.toFixed(2); // Return formatted price
};

export const PriceCal = async (req, res) => {
    const { pickupLocation, dropoffLocation, vehicleDetails } = req.body;


    if (!pickupLocation || !dropoffLocation || !vehicleDetails) {

        return res.status(400).json({ error: 'Pickup location, dropoff location, and vehicle type are required.' });
    }

    try {
        const result = await calculateBookingCost(pickupLocation, dropoffLocation, vehicleDetails.vehicleType);
        // Cache the calculated price in Redis
        const cacheKey = `price_${pickupLocation.coordinates[0]}_${pickupLocation.coordinates[1]}_${dropoffLocation.coordinates[0]}_${dropoffLocation.coordinates[1]}_${vehicleDetails.vehicleType}`;
        await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 60 * 60);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error calculating booking cost:", error.message);
        return res.status(500).json({ error: error.message });
    }
};
