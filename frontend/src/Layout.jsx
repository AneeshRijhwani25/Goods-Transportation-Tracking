// import { Navbar } from "./components/Header/Navbar";
// import { Footer } from "./components/Footer/Footer";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <>
      {/* <Navbar /> */}
      <Outlet />
      {/* <Footer /> */}
    </>
  );
}
