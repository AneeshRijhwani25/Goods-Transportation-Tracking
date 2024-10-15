// driverController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Driver } from "../models/driver.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import * as socketManager from '../db/socketManager.js';
// Generate Access and Refresh Tokens for Driver
const generateAccessAndRefreshTokens = async (driverId) => {
  try {
    const driver = await Driver.findById(driverId);
    const accessToken = await driver.generateAccessToken();
    const refreshToken = await driver.generateRefreshToken();

    driver.refreshToken = refreshToken;
    await driver.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

// Register new driver
const registerDriver = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    phoneNumber,
    vehicleDetails: { numberPlate, licenceNumber, vehicleType, capacity },
  } = req.body;

  // Validation
  if (
    [
      fullName,
      email,
      password,
      phoneNumber,
      numberPlate,
      licenceNumber,
      vehicleType,
      capacity,
    ].includes(undefined)
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if driver already exists
  const existedDriver = await Driver.findOne({
    $or: [
      { email },
      { phoneNumber },
      { "vehicleDetails.numberPlate": numberPlate },
      { "vehicleDetails.licenceNumber": licenceNumber },
    ],
  });

  if (existedDriver) {
    throw new ApiError(
      409,
      "Driver with this email, phone, vehicle, or licence number already exists"
    );
  }

  // Creating new Driver
  const driver = await Driver.create({
    fullName,
    email,
    phoneNumber,
    password,
    vehicleDetails: {
      numberPlate,
      licenceNumber,
      vehicleType,
      capacity,
    },
  });

  // Remove sensitive data before responding
  const createdDriver = await Driver.findById(driver._id).select(
    "-password -refreshToken"
  );

  if (!createdDriver) {
    throw new ApiError(
      500,
      "Something went wrong while registering the driver"
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdDriver, "Driver registered successfully")
    );
});

// Login driver
const loginDriver = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const driver = await Driver.findOne({ email });

  if (!driver) {
    throw new ApiError(404, "Driver does not exist");
  }

  // Validate password
  const isPasswordValid = await driver.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  // Generate Access and Refresh Tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    driver._id
  );

  // Remove sensitive data before responding
  const loggedInDriver = await Driver.findById(driver._id).select(
    "-password -refreshToken"
  );

  // Set cookie options
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { driver: loggedInDriver, accessToken },
        "Driver logged in successfully"
      )
    );
});

// Refresh access token for driver
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request from refreshToken");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const driver = await Driver.findById(decodedToken?._id);

    if (!driver) {
      throw new ApiError(401, "Invalid access token");
    }

    if (incomingRefreshToken !== driver?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(driver._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid refresh token in error catch block"
    );
  }
});

// Logout driver
const logoutDriver = asyncHandler(async (req, res) => {
  try {
    await Driver.findByIdAndUpdate(
      req.driver._id,
      {
        $set: { refreshToken: undefined },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "Driver logged out"));
  } catch (error) {
    throw new ApiError(501, error);
  }
});

const Availabe = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.driver._id);

  // Toggle the availability
  driver.isAvailable = true;
  await driver.save();

  socketManager.updateDriverAvailability(driver._id, driver.isAvailable);


  return res.status(200).json(
      new ApiResponse(
          200,
          { isAvailable: driver.isAvailable },
          "Driver availability updated"
      )
  );
});


const updateDriverLocation = async (req, res) => {
  try {
      const { location } = req.body; 

      // Update the driver's location in the DB
      await Driver.findByIdAndUpdate(req.driver._id, {
          location: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude]
          }
      });

      res.status(200).json({ message: 'Driver location updated successfully' });
  } catch (error) {
      console.error('Error updating driver location:', error);
      res.status(500).json({ error: 'Server error' });
  }
};

export {
  registerDriver,
  refreshAccessToken,
  loginDriver,
  logoutDriver,
  updateDriverLocation,
  Availabe,
};
