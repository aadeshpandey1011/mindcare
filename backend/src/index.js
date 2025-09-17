// require('dotenv').config({path: './env'})
// import dotenv from "dotenv"
// import connectDB from "./db/index.js";
// import {app} from './app.js'
// dotenv.config({
//     path: './.env'
// })



// connectDB()
// .then(() => {
//     app.listen(process.env.PORT || 8000, () => {
//         console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
//     })
// })
// .catch((err) => {
//     console.log("MONGO db connection failed !!! ", err);
// })

import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import jwt from "jsonwebtoken";

dotenv.config({
    path: './.env'
});

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173";

// ✅ Remove duplicate CORS setup - it's already handled in app.js
// The app already has CORS configured properly

// Create HTTP server
const server = createServer(app);

// ✅ Socket.io with consistent CORS configuration
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN, // match frontend exactly
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling']
});

// 🔑 Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('Authentication error');

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const { User } = await import("./src/models/user.model.js");
    const user = await User.findById(decoded._id).select("-password -refreshToken");
    
    if (!user) throw new Error('User not found');

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.user = user;
    next();
  } catch (err) {
    console.error('Socket authentication error:', err.message);
    next(new Error('Authentication failed'));
  }
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.fullName} (${socket.user.role})`);
  
  connectedUsers.set(socket.userId, socket.id);
  socket.join(`user_${socket.userId}`);
  socket.join(`role_${socket.userRole}`);

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`User ${socket.userId} joined room: ${room}`);
  });

  socket.on('leave', (room) => {
    socket.leave(room);
    console.log(`User ${socket.userId} left room: ${room}`);
  });

  socket.on('send_notification', (data) => {
    const { targetUserId, ...notificationData } = data;
    if (targetUserId) {
      socket.to(`user_${targetUserId}`).emit('notification', notificationData);
    } else if (data.targetRole) {
      socket.to(`role_${data.targetRole}`).emit('notification', notificationData);
    } else {
      socket.broadcast.emit('notification', notificationData);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.fullName}`);
    connectedUsers.delete(socket.userId);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io available globally
global.io = io;

// Notification helpers
export const sendNotification = (targetUserId, notification) => {
  if (io && targetUserId) {
    io.to(`user_${targetUserId}`).emit('notification', notification);
  }
};

export const sendNotificationToRole = (role, notification) => {
  if (io && role) {
    io.to(`role_${role}`).emit('notification', notification);
  }
};

export const sendBookingNotification = (targetUserId, eventType, bookingData) => {
  const notification = {
    id: Date.now().toString(),
    type: eventType,
    bookingId: bookingData._id,
    message: getBookingNotificationMessage(eventType, bookingData),
    priority: getNotificationPriority(eventType),
    createdAt: new Date().toISOString(),
    ...bookingData
  };
  if (io && targetUserId) {
    io.to(`user_${targetUserId}`).emit(eventType, notification);
  }
};

function getBookingNotificationMessage(eventType, bookingData) {
  const messages = {
    booking_request: `New booking request from ${bookingData.student?.fullName}`,
    booking_approved: `Your booking has been approved by ${bookingData.counselor?.fullName}`,
    booking_cancelled: `Booking cancelled for ${new Date(bookingData.date).toLocaleDateString()}`,
    booking_completed: `Session completed with ${bookingData.counselor?.fullName || bookingData.student?.fullName}`,
    booking_reminder: `Reminder: You have a session tomorrow with ${bookingData.counselor?.fullName || bookingData.student?.fullName}`
  };
  return messages[eventType] || 'Booking notification';
}

function getNotificationPriority(eventType) {
  const priorities = {
    booking_request: 'high',
    booking_approved: 'high',
    booking_cancelled: 'medium',
    booking_completed: 'low',
    booking_reminder: 'high'
  };
  return priorities[eventType] || 'medium';
}

// Connect to DB & start server
connectDB()
.then(() => {
  server.listen(PORT, () => {
    console.log(`⚙️ Server is running at port: ${PORT}`);
    console.log(`🔗 Socket.io server is ready for connections`);
    console.log(`🌍 Allowed CORS origin: ${FRONTEND_ORIGIN}`);
  });
})
.catch((err) => {
  console.log("MongoDB connection failed !!! ", err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});