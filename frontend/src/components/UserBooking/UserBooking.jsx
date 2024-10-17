import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import io from "socket.io-client";
import axios from "axios";
import { FiHome, FiSettings, FiBarChart2, FiUsers } from "react-icons/fi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import Map from "../Map/Map";
const SOCKET_SERVER_URL = "http://localhost:8000"; // Adjust this according to your server URL
const API_BASE_URL = "http://localhost:8000/api"; // Adjust this according to your API base URL

const UserBooking = ({data}) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [price, setPrice] = useState(null);
  const [pickupCoordinates, setPickupCoordinates] = useState({
    latitude: "",
    longitude: "",
  });
  const [dropoffCoordinates, setDropoffCoordinates] = useState({
    latitude: "",
    longitude: "",
  });
  const [vehicleType, setVehicleType] = useState("");
  const [findingDriver, setFindingDriver] = useState(false);
  const [driverFound, setDriverFound] = useState(false);
  const [packageStatus, setPackageStatus] = useState(""); // State for package status
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  
  const userId = data.user._id;
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogout = () => {
    // Handle logout logic if any (e.g., clearing tokens)
    navigate("/login"); // Navigate to /login
  };

  const handleRatingSubmit = () => {
    // Handle rating submission
    console.log(`Rating: ${rating}, Feedback: ${feedback}`);
    // Close the modal after submission
    setIsRatingModalOpen(false);
    setDriverFound(false);
    setDriverLocation(null);
    setPackageStatus("");
    setVehicleType("");
    setDropoffCoordinates({
      latitude: "",
      longitude: "",
    });
    setPickupCoordinates({
      latitude: "",
      longitude: "",
    });
    setPrice(null);
  };


  // Function to request price for the booking
  const requestPrice = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/book/price`, {
        userId,
        pickupLocation: {
          type: "Point",
          coordinates: [
            pickupCoordinates.longitude,
            pickupCoordinates.latitude,
          ],
        },
        dropoffLocation: {
          type: "Point",
          coordinates: [
            dropoffCoordinates.longitude,
            dropoffCoordinates.latitude,
          ],
        },
        vehicleDetails: {
          vehicleType,
        },
      });
      setPrice(response.data.cost); // Set the price fetched from API
    } catch (error) {
      setError("Error fetching price: " + error.message);
    }
  };

  // Function to create a new booking
  const createBooking = async () => {
    try {
      // Create a new booking by sending a request to the backend
      const response = await axios.post(`${API_BASE_URL}/v1/book/create`, {
        userId,
        pickupLocation: {
          type: "Point",
          coordinates: [
            pickupCoordinates.longitude,
            pickupCoordinates.latitude,
          ],
        },
        dropoffLocation: {
          type: "Point",
          coordinates: [
            dropoffCoordinates.longitude,
            dropoffCoordinates.latitude,
          ],
        },
        vehicleDetails: {
          vehicleType,
        },
        price,
      });
      const createdBookingId = response.data.bookingId;
      setFindingDriver(true);

      // Join the booking room via socket
      if (socket) {
        socket.emit("joinBookingRoom", { bookingId: createdBookingId, userId });
        console.log("Joined booking room");
      }

      // Wait for driver to accept the booking
      const timeoutId = setTimeout(() => {
        setFindingDriver(false); // Stop showing the "finding driver" message
        setError("No driver accepted the booking within the time limit.");
      }, 5 * 60000); // 5 minutes timeout

      // Listen for driver acceptance
      socket.on("joinBookingRoom", (data) => {
        clearTimeout(timeoutId);
        setFindingDriver(false); // Stop the "finding driver" message
        setDriverFound(true); // Set driver found flag
        setDriverLocation(data.driverDetails.currentLocation.coordinates); // Update driver's location

        // Notify the user that the driver is on the way
        setPackageStatus("Driver is on the way!");

        console.log("Driver accepted the booking", data);
      });
    } catch (error) {
      setError("Error creating booking: " + error.message);
    }
  };

  useEffect(() => {
    // Connect to the socket server
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      reconnection: true, // Enable reconnection
    });

    setSocket(newSocket);

    // Register the user with their userId after connection
    const registerUser = () => {
      newSocket.emit("registerUser", userId); // Emit registration event after connecting/reconnecting
    };

    newSocket.on("connect", registerUser); // Register user on new connection
    newSocket.on("reconnect", registerUser);

    // Listen for package status updates
    newSocket.on("packageStatusUpdate", (data) => {
      setPackageStatus(data.status);
      if (data.status == "delivered") {
        setIsRatingModalOpen(true);
      }
    });

    newSocket.on("driverLocationUpdate", (data) => {
      setDriverLocation(data.coordinates);
    });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [userId]);

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white">
        <div className="p-6">
          <h2 className="text-2xl font-semibold">User Panel</h2>
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
                <span>History</span>
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
            <h1 className="text-xl font-bold">User Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span>Welcome, User</span>
              <button
                onClick={handleLogout} // Attach the logout handler
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
            {/* Booking Form for the User */}
            {!driverFound && !driverLocation && (
              <Card className="bg-white shadow-md rounded-lg p-6 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <CardHeader>
                  <CardTitle>Book a Pickup</CardTitle>
                  <CardDescription>
                    Schedule your logistics transportation with ease.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      requestPrice(); // Request the price when the form is submitted
                    }}
                  >
                    {/* Pickup and Dropoff Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="pickup-latitude"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Pickup Latitude
                        </label>
                        <input
                          id="pickup-latitude"
                          type="number"
                          value={pickupCoordinates.latitude}
                          onChange={(e) =>
                            setPickupCoordinates({
                              ...pickupCoordinates,
                              latitude: e.target.value,
                            })
                          }
                          placeholder="Enter pickup latitude"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="pickup-longitude"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Pickup Longitude
                        </label>
                        <input
                          id="pickup-longitude"
                          type="number"
                          value={pickupCoordinates.longitude}
                          onChange={(e) =>
                            setPickupCoordinates({
                              ...pickupCoordinates,
                              longitude: e.target.value,
                            })
                          }
                          placeholder="Enter pickup longitude"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="dropoff-latitude"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Dropoff Latitude
                        </label>
                        <input
                          id="dropoff-latitude"
                          type="number"
                          value={dropoffCoordinates.latitude}
                          onChange={(e) =>
                            setDropoffCoordinates({
                              ...dropoffCoordinates,
                              latitude: e.target.value,
                            })
                          }
                          placeholder="Enter dropoff latitude"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="dropoff-longitude"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Dropoff Longitude
                        </label>
                        <input
                          id="dropoff-longitude"
                          type="number"
                          value={dropoffCoordinates.longitude}
                          onChange={(e) =>
                            setDropoffCoordinates({
                              ...dropoffCoordinates,
                              longitude: e.target.value,
                            })
                          }
                          placeholder="Enter Dropoff longitude"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Vehicle Type Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="vehicle-type"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Vehicle Type
                        </label>
                        <select
                          id="vehicle-type"
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        >
                          <option value="" disabled>
                            Select vehicle type
                          </option>
                          <option value="scooter">Scooter</option>
                          <option value="car">Car</option>
                          <option value="truck">Truck</option>
                        </select>
                      </div>
                    </div>
                    <button className="w-full bg-blue-500 text-white py-2 rounded-md shadow-sm hover:bg-blue-600 focus:ring-2 focus:ring-blue-400">
                      Request Price
                    </button>
                  </form>
                </CardContent>

                {/* Show price and book button if price is available */}
                {price && !findingDriver && (
                  <div className="mt-4">
                    <p className="text-lg font-bold">
                      Estimated Price: ${price}
                    </p>
                    <button
                      onClick={createBooking}
                      className="w-full bg-green-500 text-white py-2 rounded-md shadow-sm hover:bg-green-600 focus:ring-2 focus:ring-green-400"
                    >
                      Book Now
                    </button>
                  </div>
                )}

                {/* Show finding driver message */}
                {findingDriver && (
                  <div className="mt-4">
                    <p className="text-lg font-bold text-yellow-600">
                      Finding a driver for you...
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Show driver's location if available and driver is found */}
            {driverFound && driverLocation && (
              <Card className="bg-green-100 shadow-md rounded-lg p-6 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <CardHeader>
                  <CardTitle>Package Status: {packageStatus}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* <p className="text-gray-700 font-bold">
                    Current Driver Location:
                  </p>
                  <p>
                    Latitude: {driverLocation[0]}, Longitude:{" "}
                    {driverLocation[1]}
                  </p> */}
                  <Map
                    driverLocation={driverLocation}
                    pickupLocation={pickupCoordinates}
                    dropoffLocation={dropoffCoordinates}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Rating Modal */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-semibold mb-4">Rate Your Delivery</h2>
            <div className="flex space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  className={`cursor-pointer ${
                    rating >= star ? "text-yellow-500" : "text-gray-400"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Leave your feedback"
              className="w-full border border-gray-300 p-2 rounded-md mb-4"
              rows={3}
            />
            <button
              onClick={handleRatingSubmit}
              className="w-full bg-blue-500 text-white py-2 rounded-md"
            >
              Submit Rating
            </button>
            <button
              onClick={() => setIsRatingModalOpen(false)}
              className="w-full bg-gray-300 text-black py-2 rounded-md mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBooking;
