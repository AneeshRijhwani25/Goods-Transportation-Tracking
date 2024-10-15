import { Server } from 'socket.io';
import { Booking } from '../models/booking.model.js';
import { Driver } from '../models/driver.model.js';
let io;
const connectedUsers = new Map();
const connectedDrivers = new Map();

export const initialize = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
        },
    });

    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        // Handle user connections
        socket.on('registerUser', (userId) => {
            connectedUsers.set(userId, socket.id);
            console.log(`User ${userId} connected with socket ${socket.id}`);
        });

        // Handle driver connections
        socket.on('registerDriver', (driverId) => {
            connectedDrivers.set(driverId, socket.id);
            console.log(`Driver ${driverId} connected with socket ${socket.id}`);
        });

        // Driver accepts the booking and joins the room
        socket.on('driverAccepted', async ({ driverId, userId, bookingId }) => {
            try {
                const booking = await Booking.findById(bookingId);
                if (!booking || booking.status !== 'pending') {
                    return socket.emit('error', { message: 'Invalid booking or already accepted.' });
                }

                // Update booking and driver status
                booking.driver = driverId;
                booking.status = 'accepted';
                await booking.save();

                const driver = await Driver.findById(driverId);
                const room = `booking_${bookingId}`;

                socket.join(room);
                io.to(room).emit('driverAccepted', {
                    message: `Driver ${driverId} has accepted the booking.`,
                    driverDetails: {
                        name: driver.fullName,
                        vehicleNumber: driver.vehicleDetails.numberPlate,
                        currentLocation: driver.location,
                    },
                    bookingId,
                });
                console.log(`Driver ${driverId} and user ${userId} joined room ${room}`);
            } catch (error) {
                console.error('Error in driverAccepted event:', error);
            }
        });

        // Join both driver and user to the room
        socket.on('joinBookingRoom', ({ bookingId, userId, driverId }) => {
            const room = `booking_${bookingId}`;
            socket.join(room);
            console.log(`Driver ${driverId} and User ${userId} joined room ${room}`);

            io.to(room).emit('roomJoined', {
                message: `Driver ${driverId} and User ${userId} have joined the room.`,
            });
        });

        // Handle location updates
        socket.on('sendLocation', async ({ driverId, location, bookingId }) => {
            const room = `booking_${bookingId}`;
            console.log(`Emitting location update to room: ${room}`);

            // Make sure the driver is in the room
            socket.join(room);

            // Emit the updated location to the room
            io.to(room).emit('driverLocationUpdate', { driverId, location });
        });
        

        // Handle disconnections
        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
            connectedUsers.forEach((value, key) => {
                if (value === socket.id) {
                    connectedUsers.delete(key);
                    console.log(`User ${key} disconnected`);
                }
            });

            connectedDrivers.forEach((value, key) => {
                if (value === socket.id) {
                    connectedDrivers.delete(key);
                    console.log(`Driver ${key} disconnected`);
                }
            });
        });
    });
};


// Notify a driver about a update
export const notifyDriver = (driverId, event, data) => {
    const driverSocket = connectedDrivers.get(driverId);
    if (driverSocket) {
        io.to(driverSocket).emit(event, data);
        console.log(`Notified driver ${driverId} about ${event}`);
    } else {
        console.log(`Driver ${driverId} is not connected`);
    }
};

// Notify a user about a update
export const notifyUser = (userId, event, data) => {
    const userSocket = connectedUsers.get(userId);
    if (userSocket) {
        io.to(userSocket).emit(event, data);
        console.log(`Notified user ${userId} about ${event}`);
    } else {
        console.log(`User ${userId} is not connected`);
    }
};

// Update driver availability in the socket system
export const updateDriverAvailability = (driverId, isAvailable) => {
    const driverSocket = connectedDrivers.get(driverId);
    if (driverSocket) {
        io.to(driverSocket).emit('availabilityUpdate', { isAvailable });
        console.log(`Updated driver ${driverId} availability to ${isAvailable}`);
    } else {
        console.log(`Driver ${driverId} is not connected`);
    }
};

// Notify all drivers near the pickup location
export const notifyNearbyDrivers = (drivers, event, data) => {
    drivers.forEach((driver) => {
        const driverSocket = connectedDrivers.get(driver._id.toString());
        if (driverSocket) {
            io.to(driverSocket).emit(event, data);
            console.log(`Notified nearby driver ${driver._id}`);
        } else {
            console.log(`Driver ${driver._id} is not connected`);
        }
    });
};

export const socketManager = {
    io: () => io,
    connectedUsers,
    connectedDrivers,
    notifyDriver,
    notifyUser,
    updateDriverAvailability,
    notifyNearbyDrivers
};
