import { redisClient } from "../app.js"; 

// Middleware for generalized cache management
export const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  redisClient.get(key, (err, data) => {
    if (err) {
      console.error("Redis get error:", err);
      return next();
    }
    if (data) {
      return res.status(200).json(JSON.parse(data)); 
    }
    next(); 
  });
};


// Middleware to cache price calculation
export const cachePriceCalculation = async (req, res, next) => {
    const { pickupLocation, dropoffLocation, vehicleDetails } = req.body;

    // Create a unique key for this request
    const cacheKey = `price_${pickupLocation.coordinates[0]}_${pickupLocation.coordinates[1]}_${dropoffLocation.coordinates[0]}_${dropoffLocation.coordinates[1]}_${vehicleDetails.vehicleType}`;

    // Try to get cached data from Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        // If cached data exists, return it directly
        return res.status(200).json({ message: 'Price from cache', ...JSON.parse(cachedData) });
    }

    // If no cached data, continue to the next middleware
    next();
};


// For future
// Middleware to cache driver location
export const cacheDriverLocation = async (req, res, next) => {
    const { bookingId } = req.body;

    // Try to get cached data from Redis
    const cachedData = await redisClient.get(`driverLocation_${bookingId}`);
    if (cachedData) {
        // If cached data exists, return it directly
        return res.status(200).json({ message: 'Driver location from cache', location: JSON.parse(cachedData) });
    }

    // If no cached data, continue to the next middleware
    next();
};