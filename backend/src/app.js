import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./utils/googleAuth.js";

import userRouter         from "./routes/user.routes.js";
import bookingRouter      from "./routes/booking.routes.js";
import healthcheckRouter  from "./routes/healthcheck.routes.js";
import tweetRouter        from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter        from "./routes/video.routes.js";
import commentRouter      from "./routes/comment.routes.js";
import likeRouter         from "./routes/like.routes.js";
import playlistRouter     from "./routes/playlist.routes.js";
import dashboardRouter    from "./routes/dashboard.routes.js";
import screeningRouter    from "./routes/screening.routes.js";
import adminRouter        from "./routes/admin.routes.js";
import postRouter         from "./routes/post.routes.js";
import chatRouter         from "./routes/chat.routes.js";
import verificationRouter from "./routes/verification.routes.js";
import googleAuthRouter   from "./routes/auth.google.routes.js";

export const app = express();

const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173";

const corsOptions = {
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Increased limit for JSON bodies; multipart (media uploads) is handled by multer directly
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/health",        healthcheckRouter);
app.use("/api/v1/users",         userRouter);
app.use("/api/v1/bookings",      bookingRouter);
app.use("/api/v1/tweets",        tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos",        videoRouter);
app.use("/api/v1/comments",      commentRouter);
app.use("/api/v1/likes",         likeRouter);
app.use("/api/v1/playlist",      playlistRouter);
app.use("/api/v1/dashboard",     dashboardRouter);
app.use("/api/v1/screenings",    screeningRouter);
app.use("/api/v1/admin",         adminRouter);
app.use("/api/v1/auth",          userRouter);
app.use("/api/v1/auth",          googleAuthRouter);
app.use("/api/forum",            postRouter);
app.use("/api/v1/chat",          chatRouter);
app.use("/api/v1/verify",        verificationRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});

app.use("*", (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
