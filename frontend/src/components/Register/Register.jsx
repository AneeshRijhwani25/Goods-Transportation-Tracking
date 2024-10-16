import { useReducer } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Initial state for the form
const initialState = {
  fullName: "",
  email: "",
  password: "",
  number: "",
  role: "user",
  vehicleDetails: {
    numberPlate: "",
    licenceNumber: "",
    vehicleType: "scooter",
  },
};

// Reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_VEHICLE_DETAIL":
      return {
        ...state,
        vehicleDetails: {
          ...state.vehicleDetails,
          [action.field]: action.value,
        },
      };
    case "RESET_FORM":
      return initialState;
    default:
      return state;
  }
};

export const Register = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { fullName, email, password, number, vehicleDetails, role } = state;

    if (fullName === "" || email === "" || password === "" || number === "") {
      toast.error("All fields are required");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email address");
      return;
    }

    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!phoneRegex.test(number)) {
      toast.error("Invalid phone number");
      return;
    }

    const userData = {
      fullName,
      email,
      password,
      number,
      role,
      vehicleDetails: role === "driver" ? vehicleDetails : undefined,
    };

    try {
      const apiUrl =
        role === "driver"
          ? "http://localhost:8000/api/v1/drivers/register"
          : "http://localhost:8000/api/v1/users/register";

      const response = await axios.post(apiUrl, userData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(response.data);
      toast.success("Form submitted successfully");
      dispatch({ type: "RESET_FORM" });
      navigate("/login");
      navigate(0);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while submitting the form");
    }
  };

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="xl:mx-auto xl:w-full xl:max-w-sm 2xl:max-w-md">
            <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl">
              Sign up
            </h2>
            <p className="mt-2 text-base text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-black transition-all duration-200 hover:underline"
              >
                Sign In
              </Link>
            </p>
            <form onSubmit={handleSubmit} className="mt-8">
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="text-base font-medium text-gray-900"
                  >
                    Full Name
                  </label>
                  <div className="mt-2">
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1"
                      type="text"
                      placeholder="Full Name"
                      id="name"
                      value={state.fullName}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "fullName",
                          value: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="text-base font-medium text-gray-900"
                  >
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1"
                      type="email"
                      placeholder="Email"
                      id="email"
                      value={state.email}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "email",
                          value: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="phone-number"
                    className="text-base font-medium text-gray-900"
                  >
                    Phone Number
                  </label>
                  <div className="mt-2">
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1"
                      type="tel"
                      placeholder="Phone Number"
                      id="phone-number"
                      value={state.number}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "number",
                          value: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-base font-medium text-gray-900"
                    >
                      Password
                    </label>
                  </div>
                  <div className="mt-2">
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1"
                      type="password"
                      placeholder="Password"
                      id="password"
                      value={state.password}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_FIELD",
                          field: "password",
                          value: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label>Select your Role:</label>
                  <select
                    name="role"
                    id="role"
                    value={state.role}
                    onChange={(e) => {
                      dispatch({
                        type: "SET_FIELD",
                        field: "role",
                        value: e.target.value,
                      });
                      // Reset vehicle details when role changes
                      if (e.target.value !== "driver") {
                        dispatch({
                          type: "SET_VEHICLE_DETAIL",
                          field: "numberPlate",
                          value: "",
                        });
                        dispatch({
                          type: "SET_VEHICLE_DETAIL",
                          field: "licenceNumber",
                          value: "",
                        });
                        dispatch({
                          type: "SET_VEHICLE_DETAIL",
                          field: "vehicleType",
                          value: "scooter",
                        });
                      }
                    }}
                  >
                    <option value="user">User</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>

                {state.role === "driver" && (
                  <div className="mt-5 space-y-5">
                    <div>
                      <label
                        htmlFor="numberPlate"
                        className="text-base font-medium text-gray-900"
                      >
                        Vehicle Number Plate
                      </label>
                      <input
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1"
                        type="text"
                        id="numberPlate"
                        placeholder="Enter Number Plate"
                        value={state.vehicleDetails.numberPlate}
                        onChange={(e) =>
                          dispatch({
                            type: "SET_VEHICLE_DETAIL",
                            field: "numberPlate",
                            value: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="licenceNumber"
                        className="text-base font-medium text-gray-900"
                      >
                        Licence Number
                      </label>
                      <input
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1"
                        type="text"
                        id="licenceNumber"
                        placeholder="Enter Licence Number"
                        value={state.vehicleDetails.licenceNumber}
                        onChange={(e) =>
                          dispatch({
                            type: "SET_VEHICLE_DETAIL",
                            field: "licenceNumber",
                            value: e.target.value,
                          })
                        }
                      />
                    </div>
                    
                    <div>
                      <label
                        htmlFor="vehicleType"
                        className="text-base font-medium text-gray-900"
                      >
                        Vehicle Type
                      </label>
                      <select
                        id="vehicleType"
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1"
                        value={state.vehicleDetails.vehicleType}
                        onChange={(e) =>
                          dispatch({
                            type: "SET_VEHICLE_DETAIL",
                            field: "vehicleType",
                            value: e.target.value,
                          })
                        }
                      >
                        <option value="scooter">Scooter</option>
                        <option value="car">Car</option>
                        <option value="truck">Truck</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-black px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="h-full w-full">
          <img
            className="mx-auto h-full w-full rounded-md object-cover"
            src="https://plus.unsplash.com/premium_photo-1678283974882-a00a67c542a9?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Signup"
          />
        </div>
      </div>
    </section>
  );
};