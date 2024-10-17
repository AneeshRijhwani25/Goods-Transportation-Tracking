import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import io from "socket.io-client";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { FiHome, FiSettings, FiBarChart2, FiUsers } from "react-icons/fi";

const SOCKET_SERVER_URL = "http://localhost:8000";
const API_BASE_URL = "http://localhost:8000/api"; // Adjust the API base URL as needed

const DriverBooking = ({data}) => {
  const [socket, setSocket] = useState(null);
  const [driverLocation, setDriverLocation] = useState({
  longitude: null,
  latitude: null,
  });
  const [error, setError] = useState(null);
  const driverId = data.driver._id;
  const [isAvailable, setIsAvailable] = useState(false);
  const [rideRequest, setRideRequest] = useState(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [rideStatus, setRideStatus] = useState("");
  const [showRideRequest, setShowRideRequest] = useState(false);
  const [paymentCollected, setPaymentCollected] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate

  // Toggle driver availability and notify the backend
  const toggleAvailability = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { longitude, latitude } = position.coords;
          const driverLocation = { longitude, latitude };
  
          try {
            const response = await axios.post(
              `${API_BASE_URL}/v1/drivers/available`,
              {
                driverId,
                available: !isAvailable, // Toggle availability
                location: driverLocation, // Add location to the request
              }
            );
            setIsAvailable(!isAvailable);
            console.log(response.data.message);
          } catch (error) {
            setError("Error toggling availability: " + error.message);
          }
        },
        (error) => {
          setError("Error fetching location: " + error.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };
  
  // Confirm booking and notify backend and the socket
  const confirmBooking = async (rideRequest) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/book/confirm`, {
    bookingId: rideRequest.bookingId,
    userId: rideRequest.userId,
    driverId,
    });

    const bookingData = response.data.booking;
    setRideStatus("accepted");

    // Set pickup and dropoff locations from ride request
    setPickupLocation(rideRequest.pickupLocation);
    setDropoffLocation(rideRequest.dropoffLocation);

    // Join a specific room (locking the driver in the room)
    socket.emit("joinBookingRoom", {
    bookingId: bookingData._id,
    userId: rideRequest.userId,
    driverId,
    });
    return bookingData;
  } catch (error) {
    setError("Error confirming booking: " + error.message);
  }
  };

  // Handle pickup
  const handlePickup = async () => {
  setRideStatus("picked-up");

  if (rideRequest && rideRequest.bookingId) {
    // E

    // Send an API request to update the booking status in the backend
    try {
    await axios.post(
      `${API_BASE_URL}/v1/book/updateStatus`,
      {
      
      bookingId: rideRequest.bookingId,
      status: "picked-up", 
      }
    );
    console.log("Package status updated to 'Picked up'");
    } catch (error) {
    console.error("Error updating package status: ", error.message);
    }
  }
  };

  // Handle dropoff
  const handleDropoff = async () => {
  setRideStatus("delivered");

  if (rideRequest && rideRequest.bookingId) {
    socket.emit("packageDelivered", {
    bookingId: rideRequest.bookingId,
    driverId,
    userId: rideRequest.userId,
    });

    // Send an API request to update the booking status in the backend
    try {
    await axios.post(
      `${API_BASE_URL}/v1/book/updateStatus`,
      {
      bookingId: rideRequest.bookingId,
      status: "delivered", 
      }
    );
    console.log("Package status updated to 'Delivered'");
    } catch (error) {
    console.error("Error updating package status: ", error.message);
    }
  }
  };

  const handleCollectPayment = () => {
  setPaymentCollected(true);
  // Reset ride details after collecting payment
  setRideRequest(null);
  setRideStatus("");
  setPickupLocation(null);
  setDropoffLocation(null);
  };

  // Use a callback to ensure the function does not get redefined on each render
  const getCurrentLocation = useCallback(
  ({ rideRequest }) => {
    if (!rideRequest || !rideRequest.bookingId) {
    console.error("Ride request or bookingId is missing.");
    return;
    }

    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
      const { longitude, latitude } = position.coords;
      const driverLocation = { longitude, latitude };

      setDriverLocation(driverLocation);

      // Emit location update to the socket
      socket.emit("sendLocation", {
        driverId,
        location: driverLocation,
        bookingId: rideRequest.bookingId,
      });

      // Also update the backend
      axios.post(
        `${API_BASE_URL}/v1/book/update-location`,
        {
        bookingId: rideRequest.bookingId,
        driverLocation,
        }
      );

      console.log("Driver location emitted:", driverLocation);
      },
      (error) => {
      setError("Error fetching location: " + error.message);
      }
    );
    } else {
    setError("Geolocation is not supported by this browser.");
    }
  },
  [socket, driverId]
  );

  // Socket setup
  useEffect(() => {
  const newSocket = io(SOCKET_SERVER_URL, {
    transports: ["websocket"], // Ensure WebSocket transport is used
    reconnection: true, // Enable reconnection in case of disconnection
    reconnectionAttempts: Infinity,
    timeout: 300000
  });

  setSocket(newSocket); // Set the socket instance

  // Register the driver on the server
  const registerDriver = () => {
    newSocket.emit("registerDriver", driverId);
  };

  // Register driver on connect and reconnect events
  newSocket.on("connect", registerDriver);
  newSocket.on("reconnect", registerDriver);

  // Handle socket disconnection
  newSocket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  // Listen for new booking requests
  newSocket.on("newBookingRequest", (data) => {
    console.log("New booking request received:", data);
    setRideRequest(data); // Store the ride request
    setShowRideRequest(true); // Show the ride request to the driver

    // Hide the request after 60 seconds if not accepted
    setTimeout(() => {
    setShowRideRequest(false);
    setRideRequest(null);
    }, 2*60000);
  });

  return () => {
    if (newSocket) newSocket.disconnect(); // Clean up socket connection
  };
  }, [driverId]); // Only connect/disconnect socket on initial mount/unmount

  // Periodic location updates
  useEffect(() => {
  const locationInterval = setInterval(() => {
    if (isAvailable && rideRequest) {
    getCurrentLocation({ rideRequest }); // Fetch and send location periodically
    }
  }, 10000); // Every 10 seconds

  return () => {
    clearInterval(locationInterval); // Clean up on component unmount
  };
  }, [isAvailable, rideRequest, getCurrentLocation]); // Depend only on the availability, ride request, and location callback

  // Accept ride request and notify socket
  const acceptRide = async () => {
  if (rideRequest) {
    const booking = await confirmBooking(rideRequest); // Confirm the booking
    setShowRideRequest(false);
    socket.emit("driverAccepted", {
    driverId: booking.driver,
    userId: booking.user,
    bookingId: booking._id,
    });
    console.log("Ride accepted and user notified.");
  }
  };

  // Logout handler
  const handleLogout = () => {
  // Perform any necessary cleanup here
  navigate("/login"); // Navigate to the login page
  };

  return (
  <div className="flex min-h-screen">
    {/* Sidebar */}
    <aside className="w-64 bg-gray-800 text-white">
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Driver Panel</h2>
    </div>
    <nav className="px-4">
      <ul className="space-y-4">
      <li>
        <a
        href="#"
        className="flex items-center space-x-2 text-sm hover:bg-gray-700 p-2 rounded"
        >
        <FiHome />
        <span>Dashboard</span>
        </a>
      </li>
      <li>
        <a
        href="#"
        className="flex items-center space-x-2 text-sm hover:bg-gray-700 p-2 rounded"
        >
        <FiBarChart2 />
        <span>Analytics</span>
        </a>
      </li>
      <li>
        <a
        href="#"
        className="flex items-center space-x-2 text-sm hover:bg-gray-700 p-2 rounded"
        >
        <FiUsers />
        <span>Profile</span>
        </a>
      </li>
      <li>
        <a
        href="#"
        className="flex items-center space-x-2 text-sm hover:bg-gray-700 p-2 rounded"
        >
        <FiSettings />
        <span>Settings</span>
        </a>
      </li>
      </ul>
    </nav>
    </aside>

    {/* Main Content */}
    <div className="flex-1 flex flex-col bg-muted/40">
    {/* Header */}
    <header className="bg-white shadow-md py-4 px-6">
      <div className="flex justify-between items-center">
      <h1 className="text-xl font-bold">Driver Dashboard</h1>
      <div className="flex items-center space-x-4">
        <span>Welcome, Driver</span>
        <button
        onClick={handleLogout} // Attach the logout handler
        className="px-4 py-2 bg-blue-600 text-white rounded"
        >
        Log out
        </button>
      </div>
      </div>
    </header>

    <main className="grid flex-1 items-start gap-4 p-6 lg:grid-cols-2 xl:grid-cols-3">
      {/* Driver Control Panel */}
      <Card className="col-span-2 xl:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle>Driver Control</CardTitle>
        <CardDescription className="max-w-lg text-balance leading-relaxed">
        Manage your availability and accept ride requests.
        </CardDescription>
        {error && <p className="text-red-600">{error}</p>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
        <button
          onClick={toggleAvailability}
          className={`w-full py-2 rounded-md shadow-sm text-white focus:ring-2 focus:ring-blue-400 ${
          isAvailable ? "bg-red-500" : "bg-blue-500"
          }`}
        >
          {isAvailable ? "Set Unavailable" : "Set Available"}
        </button>
        </div>
      </CardContent>
      </Card>

      {/* Ride Request */}
      {showRideRequest && rideRequest && rideStatus === "" && (
      <Card className="col-span-2 xl:col-span-1 bg-yellow-100">
        <CardHeader>
        <CardTitle>Ride Request</CardTitle>
        <CardDescription>Incoming ride details:</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="space-y-2 text-sm text-gray-700">
          <p>Price: {rideRequest?.price}</p>
          <p>Pickup Location: {rideRequest?.pickupLocation.coordinates[0]} , {rideRequest?.pickupLocation.coordinates[1]}</p>
          <p>Dropoff Location: {rideRequest?.dropoffLocation.coordinates[0]} , {rideRequest?.dropoffLocation.coordinates[1]}</p>
        </div>
        <button
          onClick={acceptRide}
          className="mt-4 w-full bg-green-500 text-white py-2 rounded-md shadow-sm hover:bg-green-600 focus:ring-2 focus:ring-green-400"
        >
          Accept Ride
        </button>
        </CardContent>
      </Card>
      )}

      {/* Ride Accepted */}
      {rideStatus === "accepted" && pickupLocation && (
      <Card className="col-span-2 xl:col-span-1 bg-green-100">
        <CardHeader>
        <CardTitle>Ride Accepted!</CardTitle>
        <CardDescription>Proceed to pickup the package.</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="text-gray-700">
          Directions to Pickup: {pickupLocation.coordinates[0]} , {pickupLocation.coordinates[1]}
        </div>
        <button
          onClick={handlePickup}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md shadow-sm hover:bg-blue-600 focus:ring-2 focus:ring-blue-400"
        >
          Pickup Package
        </button>
        </CardContent>
      </Card>
      )}

      {/* Package Picked Up */}
      {rideStatus === "picked-up" && dropoffLocation && (
      <Card className="col-span-2 xl:col-span-1 bg-blue-100">
        <CardHeader>
        <CardTitle>Package Picked Up</CardTitle>
        <CardDescription>Proceed to drop off the package.</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="text-gray-700">
          Directions to Dropoff: {dropoffLocation.coordinates[0]} , {dropoffLocation.coordinates[1]}
        </div>
        <button
          onClick={handleDropoff}
          className="mt-4 w-full bg-green-500 text-white py-2 rounded-md shadow-sm hover:bg-green-600 focus:ring-2 focus:ring-green-400"
        >
          Deliver Package
        </button>
        </CardContent>
      </Card>
      )}

      {/* Delivery Completed */}
      {rideStatus === "delivered" && !paymentCollected && (
      <Card className="col-span-2 xl:col-span-1 bg-green-100">
        <CardHeader>
        <CardTitle>Package Delivered! Collect payment {rideRequest.price}</CardTitle>
        </CardHeader>
        <CardContent>
        <p className="text-gray-600">
          Thank you for completing the delivery.
        </p>
        <button
          onClick={handleCollectPayment}
          className="mt-4 w-full bg-yellow-500 text-white py-2 rounded-md shadow-sm hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400"
        >
          Collect Payment
        </button>
        </CardContent>
      </Card>
      )}

      {/* Payment Collected */}
      {rideStatus === "delivered" && paymentCollected && (
      <Card className="col-span-2 xl:col-span-1 bg-green-100">
        <CardHeader>
        <CardTitle>Payment Collected!</CardTitle>
        </CardHeader>
        <CardContent>
        <p className="text-gray-600">
          The payment has been successfully collected.
        </p>
        </CardContent>
      </Card>
      )}
    </main>
    </div>
  </div>
  );
};

export default DriverBooking;