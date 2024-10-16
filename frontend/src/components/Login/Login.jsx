import { useState } from "react";
import { ArrowRight } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

axios.defaults.withCredentials = true;

export function Login({ setData }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(""); // Added state for role
  const navigate = useNavigate(); // Use navigate for redirection

  const handleSignIn = (e) => {
    e.preventDefault();

    // Validate required fields
    if (email === "" || password === "" || role === "") {
      toast.error("All fields are required");
      return;
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email address");
      return;
    }

    // Prepare form data
    const formData = {
      email,
      password,
      role,
    };

    console.log(formData);

    // Determine the URL based on the role
    let apiUrl;
    if (role === "Driver") {
      apiUrl = "http://localhost:8000/api/v1/drivers/login";
    } else {
      apiUrl = "http://localhost:8000/api/v1/users/login";
    }

    // Make the API request based on role
    axios
      .post(apiUrl, formData)
      .then((response) => {
        console.log(response.data);
        const data = response.data;
        const userData = data ? data.data.user : null;

        // Check if the user is admin if role is "Admin"
        if (role === "Admin" && !userData.isAdmin) {
          toast.error("You are not an admin.");
          return;
        }
        if (role === "Admin" && userData.isAdmin) {
          toast.success("Admin login successful");
          navigate("/adminDashboard"); // Navigate to Admin Dashboard
          navigate(0);
          return;
        }

        // Set user data
        setData(userData);
        toast.success("Login successful");

        // Clear fields after successful login
        setEmail("");
        setPassword("");

        // Redirect based on the role
        if (role === "Driver") {
          navigate("/driverDashboard"); // Navigate to Driver Dashboard
          navigate(0);
        } else {
          navigate("/userDashboard"); // Navigate to User Dashboard
          navigate(0);
        }
      })
      .catch((error) => {
        console.log(error);
        if (error.response) {
          toast.error(error.response.data.message);
        } else {
          toast.error("An error occurred");
        }
      });
  };

  return (
    <section className="">
      <div className="grid grid-cols-1 lg:grid-cols-2 ">
        <div className="h-full w-full">
          <img
            className="mx-auto h-full w-full rounded-md object-cover"
            src="https://plus.unsplash.com/premium_photo-1678283974882-a00a67c542a9?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt=""
          />
        </div>
        <div className="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="xl:mx-auto xl:w-full xl:max-w-sm 2xl:max-w-md">
            <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl">
              Sign In
            </h2>
            <p className="mt-2 text-base text-gray-600">
              Don t have an account?{" "}
              <Link
                className="font-medium text-black transition-all duration-200 hover:underline"
                to="/register"
              >
                Sign Up
              </Link>
            </p>
            <form onSubmit={handleSignIn} className="mt-8">
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="text-base font-medium text-gray-900"
                  >
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                      type="email"
                      placeholder="Email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="text-base font-medium text-gray-900"
                  >
                    Password
                  </label>
                  <div className="mt-2">
                    <input
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                      type="password"
                      placeholder="Password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="role"
                    className="text-base font-medium text-gray-900"
                  >
                    Select Role
                  </label>
                  <div className="mt-2">
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                      <option value="Driver">Driver</option>
                    </select>
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-md bg-black px-3.5 py-2.5 font-semibold leading-7 text-white hover:bg-black/80"
                  >
                    Sign In <ArrowRight className="ml-2" size={16} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}