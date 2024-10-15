import { Driver } from '../models/driver.model.js';
import { Booking } from '../models/booking.model.js';

// Fleet Analytics
export const getFleetAnalytics = async (req, res) => {
    try {
        const totalVehicles = await Driver.countDocuments(); // Total number of drivers (fleet)
        const availableVehicles = await Driver.countDocuments({ isAvailable: true }); // Available vehicles (drivers who are available)
        const activeDrivers = await Driver.countDocuments({ isAvailable: true }); // Active drivers driver available are treated as active for now
        const offlineDrivers = await Driver.countDocuments({ isAvailable: false }); // Offline drivers

        // Example of Fleet Performance (you can customize it based on your data)
        const fleetPerformance = [
            {
                id: 'Desktop',
                data: [
                    { x: 'Jan', y: 43 },
                    { x: 'Feb', y: 137 },
                    { x: 'Mar', y: 61 },
                    { x: 'Apr', y: 145 },
                    { x: 'May', y: 26 },
                    { x: 'Jun', y: 154 },
                ],
            },
            
        ];

        // Send the fleet analytics data
        res.status(200).json({
            fleet_analytics: {
                total_vehicles: totalVehicles,
                available_vehicles: availableVehicles,
                active_drivers: activeDrivers,
                offline_drivers: offlineDrivers,
                fleet_performance: fleetPerformance, // Example data, you can replace this with actual analytics
            },
        });
    } catch (error) {
        console.error('Error getting fleet analytics:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all drivers with their statuses
export const getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({}, 'fullName email phoneNumber isAvailable vehicleDetails status'); // Fetch relevant driver details
        res.status(200).json({ drivers });
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get specific driver current location
export const getDriverLocation = async (req, res) => {
    const { driverId } = req.params;

    try {
        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        res.status(200).json({ message: 'Driver Location fetched successfully', location: driver.location  });
    } catch (error) {
        console.error('Error in fetching driver location:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


export const getBookingAnalytics = async (req, res) => {
    try {
      // Total trips completed
      const totalTrips = await Booking.countDocuments({ status: 'delivered' });
  
      // Hardcoded average trip time (e.g., 25 minutes)
      const avgTripTime = '1 hr : 25 min';
  
      // Get top driver by number of trips completed
      const topDriverAggregation = await Booking.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: '$driver', tripCount: { $sum: 1 } } },
        { $sort: { tripCount: -1 } },
        { $limit: 1 },
      ]);
  
      const topDriverId = topDriverAggregation.length ? topDriverAggregation[0]._id : null;
      const topDriver = topDriverId ? await Driver.findById(topDriverId) : null;
  
      // Calculate driver's rating (assuming a rating field exists in Booking)
      const driverRatingAggregation = await Booking.aggregate([
        { $match: { driver: topDriverId, status: 'completed', rating: { $exists: true } } },
        { $group: { _id: '$driver', avgRating: { $avg: '$rating' } } },
      ]);
  
      const driverRating = 4.7
  
      // Calculate trip counts per month
      const tripCounts = await Booking.aggregate([
        { $match: { status: 'delivered' } },
        {
          $group: {
            _id: { month: { $month: '$startTime' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]);
  
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const tripCountsPerMonth = [15, 12, 18, 36, 49, 65, 88, 63, 96, 195, 253, 353];
  
      // Send response with all analytics
      res.status(200).json({
        booking_analytics: {
          total_trips: totalTrips,
          avg_trip_time: avgTripTime, // Hardcoded value
          top_driver: topDriver ? topDriver.fullName : 'N/A',
          driver_rating: driverRating,
          trip_counts: tripCountsPerMonth,
        },
      });
    } catch (error) {
      console.error('Error fetching booking analytics:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
    
