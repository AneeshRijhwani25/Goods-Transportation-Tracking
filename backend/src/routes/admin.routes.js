import {Router} from 'express';
import { getFleetAnalytics, getAllDrivers, getDriverLocation, getBookingAnalytics } from '../controllers/admin.controller.js';

const adminRouter = Router();

// Get fleet analytics (number of vehicles, active drivers, etc.)
adminRouter.get('/fleet-analytics', getFleetAnalytics);

// Get all drivers with their status
adminRouter.get('/drivers', getAllDrivers);

// Update driver status (e.g., active, offline, etc.)
adminRouter.get('/drivers/:driverId/location', getDriverLocation);

// Get booking analytics
adminRouter.get('/booking-analytics', getBookingAnalytics);
export default adminRouter;
