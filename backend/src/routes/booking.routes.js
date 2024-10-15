import { Router } from "express";
import { 
  requestBooking, 
  confirmBooking, 
  updateDriverLocation, 
  PriceCal,
  updateBookingStatus
} from "../controllers/booking.controller.js";
const router = Router();

router.route("/create").post(requestBooking);
router.route("/confirm").post(confirmBooking);
router.route("/update-location").post(updateDriverLocation);
router.route("/updateStatus").post(updateBookingStatus);
router.route('/price').post(PriceCal);
export default router;
