import { Router } from "express";
import { 
  requestBooking, 
  confirmBooking, 
  updateDriverLocation, 
  PriceCal,
  updateBookingStatus
} from "../controllers/booking.controller.js";
import { cacheDriverLocation, cachePriceCalculation } from "../middlewares/redis.middleware.js";
const router = Router();


// Route to calculate price with Redis caching middleware
router.route("/create").post(requestBooking);
router.route("/confirm").post(confirmBooking);
router.route("/update-location").post(updateDriverLocation);
// router.route("/update-location").post(cacheDriverLocation, updateDriverLocation);
router.route("/updateStatus").post(updateBookingStatus);
router.route('/price').post(cachePriceCalculation, PriceCal);
// router.route('/price').post(PriceCal);
export default router;
