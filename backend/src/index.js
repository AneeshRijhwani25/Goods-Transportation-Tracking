import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { initialize } from './db/socketManager.js'; // Import the socket initialization
import http from "http";

dotenv.config({ path: "./.env" });

// Create HTTP server
const server = http.createServer(app);
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("express error", error);
    });
  })
  .then(() => {
    // Initialize socket.io with the created server
    initialize(server);

    // Start the server
    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server running at ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed!!! ", err);
    process.exit(1);
  });
