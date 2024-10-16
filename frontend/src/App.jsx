import { useState, useEffect } from "react";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import "./App.css";
import { Register } from "./components/Register/Register";
import { Login } from "./components/Login/Login";
import { Layout } from "./Layout";
import Loader from "./components/Loader/Loader";
import { Error } from "./components/Error/Error";
import setupAxiosInterceptors from "./axiosInterceptor";
import axios from "axios";
import { toast } from "react-toastify";
import UserBooking from "./components/UserBooking/UserBooking";
import DriverBooking from "./components/DriverBooking/DriverBooking";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";

function App() {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        setLoading(true);
        return config;
      },
      (error) => {
        setLoading(false);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        setLoading(false);
        return response;
      },
      (error) => {
        setLoading(false);
        let errorMessage = "An unknown error occurred";
        if (error.response && error.response.data) {
          errorMessage = error.response.data;
          if (
            errorMessage.includes("User with email or number already exists")
          ) {
            errorMessage = "User with email or number already exists";
          }
        }
        toast.error(errorMessage);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [setLoading]);

  const route = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route path="/login" element={<Login setData={setData} />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Error />} />
        <Route path="/userDashboard" element={<UserBooking />} />
        <Route path="/driverDashboard" element={<DriverBooking />} />
        <Route path="/adminDashboard" element={<AdminDashboard />}/>
      </Route>
    )
  );
  return (
    <>
      <Loader show={loading} />
      <RouterProvider router={route} />
    </>
  );
}

export default App;
