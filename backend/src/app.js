import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./utils/googleAuth.js";

import userRouter         from "./routes/user.routes.js";
import bookingRouter      from "./routes/booking.routes.js";
import paymentRouter      from "./routes/payment.routes.js";
import adRouter           from "./routes/ad.routes.js";
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
import resourceRouter     from "./routes/resource.routes.js";
import wellnessRouter     from "./routes/wellness.routes.js";

export const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Accepts:
//   1. The exact CORS_ORIGIN env var (your production Vercel URL)
//   2. Any *.vercel.app subdomain (covers all Vercel preview deployment URLs)
//   3. localhost:5173 and localhost:3000 for local development
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCTION_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "";

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
];

// Add production origin if set
if (PRODUCTION_ORIGIN) {
    // Remove trailing slash if present
    allowedOrigins.push(PRODUCTION_ORIGIN.replace(/\/$/, ""));
}

const corsOptions = {
    origin: (requestOrigin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!requestOrigin) return callback(null, true);

        // Allow exact matches
        if (allowedOrigins.includes(requestOrigin)) return callback(null, true);

        // Allow ANY *.vercel.app subdomain (covers all preview deployments)
        if (requestOrigin.endsWith(".vercel.app")) return callback(null, true);

        // Allow the render backend itself (for health checks)
        if (requestOrigin.includes("onrender.com")) return callback(null, true);

        console.warn(`[CORS] Blocked origin: ${requestOrigin}`);
        return callback(new Error(`CORS: origin ${requestOrigin} not allowed`));
    },
    credentials:          true,
    methods:              ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders:       ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders:       ["Set-Cookie"],
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/health",        healthcheckRouter);
app.use("/api/v1/users",         userRouter);
app.use("/api/v1/bookings",      bookingRouter);
app.use("/api/v1/payments",      paymentRouter);
app.use("/api/v1/ads",           adRouter);
app.use("/api/v1/resources",     resourceRouter);
app.use("/api/v1/wellness",      wellnessRouter);
app.use("/api/v1/tweets",        tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos",        videoRouter);
app.use("/api/v1/comments",      commentRouter);
app.use("/api/v1/likes",         likeRouter);
app.use("/api/v1/playlists",     playlistRouter);
app.use("/api/v1/dashboard",     dashboardRouter);
app.use("/api/v1/screenings",    screeningRouter);
app.use("/api/v1/admin",         adminRouter);
app.use("/api/v1/forum",         postRouter);
app.use("/api/v1/chat",          chatRouter);
app.use("/api/v1/verify",        verificationRouter);
app.use("/api/v1/auth",          googleAuthRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use("*", (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message    = err.message    || "Internal Server Error";
    console.error(`[Error] ${req.method} ${req.path} → ${statusCode}: ${message}`);
    res.status(statusCode).json({ success: false, message, ...(err.errors && { errors: err.errors }) });
});

export default app;
