import { Router } from "express";
import {
  registerDriver,
  loginDriver,
  logoutDriver,
  refreshAccessToken,
  Availabe,
  updateDriverLocation
} from "../controllers/driver.controller.js";
import { verifyDriverJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Driver Registration
router.route("/register").post(registerDriver);

// Driver Login
router.route("/login").post(loginDriver);

// Driver Logout (Requires Authentication)
router.route("/logout").post(verifyDriverJWT, logoutDriver);

// Refresh Access Token
router.route("/refresh-token").post(refreshAccessToken);

// Driver Availability (Requires Authentication)
router.route("/available").post(verifyDriverJWT, Availabe);

// Update Driver Location 
router.route("/update").post(verifyDriverJWT, updateDriverLocation);
export default router;
