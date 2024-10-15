import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import driverRouter from "./routes/driver.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import adminRouter from "./routes/admin.routes.js";

// routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/drivers", driverRouter);
app.use("/api/v1/book", bookingRouter); 
app.use("/api/v1/admin", adminRouter); 

export { app };
