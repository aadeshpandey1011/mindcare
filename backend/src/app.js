// import express from "express"
// import cors from "cors"
// import cookieParser from "cookie-parser"
// import { createServer } from "http";
// import cron from "node-cron";
// const app = express()

// const httpServer = createServer(app);
// // app.use(cors({
// //     origin: process.env.CORS_ORIGIN,
// //     credentials: true
// // }))
// const allowedOrigin = "http://localhost:5173";

// app.use(cors({
//   origin: allowedOrigin,
//   credentials: true, // allow cookies/auth headers
// }));

// app.use(express.json({limit: "16kb"}))
// app.use(express.urlencoded({extended: true, limit: "16kb"}))
// app.use(express.static("public"))
// app.use(cookieParser())


// //routes import
// import userRouter from './routes/user.routes.js'
// import bookingRouter from "./routes/booking.routes.js";
// import healthcheckRouter from "./routes/healthcheck.routes.js"
// import tweetRouter from "./routes/tweet.routes.js"
// import subscriptionRouter from "./routes/subscription.routes.js"
// import videoRouter from "./routes/video.routes.js"
// import commentRouter from "./routes/comment.routes.js"
// import likeRouter from "./routes/like.routes.js"
// import playlistRouter from "./routes/playlist.routes.js"
// import dashboardRouter from "./routes/dashboard.routes.js"
// import screeningRouter from "./routes/screening.routes.js"
// import adminRouter from "./routes/admin.routes.js";
// // Import utilities
// import { notificationService } from "./utils/notifications.js";
// //++++++


// import authRouter from "./routes/user.routes.js";

// //routes declaration
// app.use("/api/v1/healthcheck", healthcheckRouter)
// app.use("/api/v1/users", userRouter)
// app.use("/api/v1/tweets", tweetRouter)
// app.use("/api/v1/subscriptions", subscriptionRouter)
// app.use("/api/v1/videos", videoRouter)
// app.use("/api/v1/comments", commentRouter)
// app.use("/api/v1/likes", likeRouter)
// app.use("/api/v1/playlist", playlistRouter)
// app.use("/api/v1/dashboard", dashboardRouter)
// app.use("/api/v1/screenings", screeningRouter)
// // Mount admin routes
// app.use("/api/v1/admin", adminRouter);
// app.use("/api/v1/auth", authRouter);
// app.use("/api/v1/bookings", bookingRouter);


// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
    
//     res.status(err.statusCode || 500).json({
//         success: false,
//         message: err.message || "Internal Server Error",
//         ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//     });
// });
// // 404 handler
// app.use("*", (req, res) => {
//     res.status(404).json({
//         success: false,
//         message: `Route ${req.originalUrl} not found`
//     });
// });
// // Initialize WebSocket for real-time notifications
// notificationService.initialize(httpServer);

// // Cron jobs for automated tasks
// const setupCronJobs = () => {
//     // Send reminder notifications daily at 9 AM
//     cron.schedule('0 9 * * *', async () => {
//         console.log('🔔 Running daily reminder check...');
//         try {
//             await notificationService.scheduleReminders();
//         } catch (error) {
//             console.error('Failed to send reminders:', error);
//         }
//     }, {
//         timezone: "Asia/Kolkata"
//     });

//     // Clean up old notifications weekly (every Sunday at 2 AM)
//     cron.schedule('0 2 * * 0', async () => {
//         console.log('🗑️ Cleaning up old notifications...');
//         try {
//             // Add cleanup logic here if needed
//             console.log('Cleanup completed');
//         } catch (error) {
//             console.error('Cleanup failed:', error);
//         }
//     }, {
//         timezone: "Asia/Kolkata"
//     });

//     // Generate weekly booking reports (every Monday at 8 AM)
//     cron.schedule('0 8 * * 1', async () => {
//         console.log('📊 Generating weekly booking reports...');
//         try {
//             // Add report generation logic here
//             console.log('Weekly reports generated');
//         } catch (error) {
//             console.error('Report generation failed:', error);
//         }
//     }, {
//         timezone: "Asia/Kolkata"
//     });

//     console.log('✅ Cron jobs scheduled successfully');
// };

// // Graceful shutdown handling
// process.on('SIGTERM', () => {
//     console.log('🛑 SIGTERM received, shutting down gracefully');
//     httpServer.close(() => {
//         console.log('✅ Process terminated');
//         process.exit(0);
//     });
// });

// process.on('SIGINT', () => {
//     console.log('🛑 SIGINT received, shutting down gracefully');
//     httpServer.close(() => {
//         console.log('✅ Process terminated');
//         process.exit(0);
//     });
// });

// // Unhandled promise rejection handler
// process.on('unhandledRejection', (err, promise) => {
//     console.error('🚨 Unhandled Promise Rejection:', err);
//     httpServer.close(() => {
//         process.exit(1);
//     });
// });

// // Start server
// const startServer = async () => {
//     try {
//         const port = process.env.PORT || 5000;
        
//         httpServer.listen(port, () => {
//             console.log(`🚀 Server running on port ${port}`);
//             console.log(`📱 Socket.IO server ready for connections`);
//             console.log(`🌐 API Base URL: http://localhost:${port}/api/v1`);
//             console.log(`💊 Health Check: http://localhost:${port}/health`);
            
//             // Setup cron jobs after server starts
//             setupCronJobs();
//         });
        
//     } catch (error) {
//         console.error('❌ Failed to start server:', error);
//         process.exit(1);
//     }
// };

// export { app, httpServer, startServer };
// // If this file is run directly, start the server
// // if (import.meta.url === `file://${process.argv[1]}`) {
// //     startServer();
// // }
// // export { app }





// src/app.js
// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

// Models
import { User } from "./models/user.model.js";

// Utilities
import { notificationService } from "./utils/notifications.js";

// Routers
import userRouter from "./routes/user.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import screeningRouter from "./routes/screening.routes.js";
import adminRouter from "./routes/admin.routes.js";
import authRouter from "./routes/user.routes.js";
// ✅ New Forum Post Router
import postRouter from './routes/post.routes.js';


// -------------------- Express App Setup --------------------
export const app = express();

// ✅ CORS Configuration - MUST be before routes
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "X-Requested-With", 
      "Accept",
      "Origin",
      "Access-Control-Allow-Origin"
    ],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 200 // for legacy browser support
  })
);

// ✅ Handle preflight requests explicitly
app.options("*", cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With", 
    "Accept",
    "Origin",
    "Access-Control-Allow-Origin"
  ]
}));

// ✅ Other middleware (after CORS)
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// -------------------- Routes (after middleware) --------------------
app.use("/api/v1/health", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/screenings", screeningRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/auth", authRouter);
// ✅ New Forum Post Routes
app.use("/api/forum", postRouter);

// -------------------- Error Handling --------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});





// // -------------------- Socket.IO --------------------
// const io = new Server(httpServer, {
//   cors: {
//     origin: process.env.CORS_ORIGIN || "http://localhost:5173",
//     // methods: ["GET", "POST"],
//     credentials: true,
//   },
//   transports: ["websocket", "polling"],
// });

// // Socket authentication middleware
// io.use(async (socket, next) => {
//   try {
//     const token = socket.handshake.auth.token;
//     if (!token) throw new Error("Authentication error");

//     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//     const user = await User.findById(decoded._id).select(
//       "-password -refreshToken"
//     );

//     if (!user) throw new Error("User not found");

//     socket.user = user;
//     next();
//   } catch (err) {
//     console.error("Socket authentication error:", err.message);
//     next(new Error("Authentication failed"));
//   }
// });

// // Handle connections
// io.on("connection", (socket) => {
//   console.log(`✅ User connected: ${socket.user.fullName} (${socket.user.role})`);

//   // Join user + role rooms
//   socket.join(`user_${socket.user._id}`);
//   socket.join(`role_${socket.user.role}`);

//   socket.on("disconnect", () => {
//     console.log(`❌ User disconnected: ${socket.user.fullName}`);
//   });
// });

// // Make io globally accessible
// global.io = io;

// // -------------------- Cron Jobs --------------------
// const setupCronJobs = () => {
//   // Daily reminders at 9 AM
//   cron.schedule(
//     "0 9 * * *",
//     async () => {
//       console.log("🔔 Running daily reminder check...");
//       try {
//         await notificationService.scheduleReminders();
//       } catch (error) {
//         console.error("Failed to send reminders:", error);
//       }
//     },
//     { timezone: "Asia/Kolkata" }
//   );

//   // Weekly cleanup (Sunday 2 AM)
//   cron.schedule(
//     "0 2 * * 0",
//     async () => {
//       console.log("🗑️ Cleaning up old notifications...");
//       try {
//         console.log("Cleanup completed");
//       } catch (error) {
//         console.error("Cleanup failed:", error);
//       }
//     },
//     { timezone: "Asia/Kolkata" }
//   );

//   // Weekly booking reports (Monday 8 AM)
//   cron.schedule(
//     "0 8 * * 1",
//     async () => {
//       console.log("📊 Generating weekly booking reports...");
//       try {
//         console.log("Weekly reports generated");
//       } catch (error) {
//         console.error("Report generation failed:", error);
//       }
//     },
//     { timezone: "Asia/Kolkata" }
//   );

//   console.log("✅ Cron jobs scheduled successfully");
// };

// // -------------------- Graceful Shutdown --------------------
// process.on("SIGTERM", () => {
//   console.log("🛑 SIGTERM received, shutting down gracefully");
//   httpServer.close(() => {
//     console.log("✅ Process terminated");
//     process.exit(0);
//   });
// });

// process.on("SIGINT", () => {
//   console.log("🛑 SIGINT received, shutting down gracefully");
//   httpServer.close(() => {
//     console.log("✅ Process terminated");
//     process.exit(0);
//   });
// });

// process.on("unhandledRejection", (err) => {
//   console.error("🚨 Unhandled Promise Rejection:", err);
//   httpServer.close(() => process.exit(1));
// });

// // -------------------- Start Server --------------------
// const startServer = async () => {
//   try {
//     const port = process.env.PORT || 5000;

//     httpServer.listen(port, () => {
//       console.log(`🚀 Server running on port ${port}`);
//       console.log(`📱 Socket.IO server ready for connections`);
//       console.log(`🌐 API Base URL: http://localhost:${port}/api/v1`);
//       console.log(`💊 Health Check: http://localhost:${port}/api/v1/health`);
//       setupCronJobs();
//     });
//   } catch (error) {
//     console.error("❌ Failed to start server:", error);
//     process.exit(1);
//   }
// };

// export { app, httpServer, startServer };
