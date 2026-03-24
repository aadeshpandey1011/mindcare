import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import jwt from "jsonwebtoken";

dotenv.config({ path: './.env' });

const PORT            = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:5173";

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling']
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('Authentication error');
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const { User } = await import("./models/user.model.js");
    const user = await User.findById(decoded._id).select("-password -refreshToken");
    if (!user) throw new Error('User not found');
    socket.userId   = user._id.toString();
    socket.userRole = user.role;
    socket.user     = user;
    next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
    next(new Error('Authentication failed'));
  }
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  connectedUsers.set(socket.userId, socket.id);
  socket.join(`user_${socket.userId}`);
  socket.join(`role_${socket.userRole}`);

  socket.on('join',  (room) => socket.join(room));
  socket.on('leave', (room) => socket.leave(room));
  socket.on('send_notification', (data) => {
    const { targetUserId, ...notificationData } = data;
    if (targetUserId)         socket.to(`user_${targetUserId}`).emit('notification', notificationData);
    else if (data.targetRole) socket.to(`role_${data.targetRole}`).emit('notification', notificationData);
    else                      socket.broadcast.emit('notification', notificationData);
  });
  socket.on('disconnect', () => { connectedUsers.delete(socket.userId); });
});

global.io = io;

export const sendNotification = (targetUserId, notification) => {
  if (io && targetUserId) io.to(`user_${targetUserId}`).emit('notification', notification);
};
export const sendNotificationToRole = (role, notification) => {
  if (io && role) io.to(`role_${role}`).emit('notification', notification);
};

// ── DB connect → fix stale indexes → start cron → start server ───────────────
connectDB()
  .then(async () => {
    // ── STEP 1: Drop stale Razorpay indexes that break Cashfree inserts ───────
    // The old Razorpay integration left unique indexes on razorpay_order_id and
    // razorpay_payment_id. Because these fields don't exist in the current schema,
    // every insert collides on null. Drop them once and they're gone for good.
    const { dropStalePaymentIndexes } = await import("./models/payment.model.js");
    await dropStalePaymentIndexes();

    // ── STEP 2: Start background cron jobs ────────────────────────────────────
    const { startCronJobs } = await import("./utils/cron.js");
    startCronJobs();

    // ── STEP 3: Start HTTP server ─────────────────────────────────────────────
    server.listen(PORT, () => {
      console.log(`⚙️  Server running at port: ${PORT}`);
      console.log(`🔗  Socket.io ready`);
      console.log(`🌍  CORS origin: ${FRONTEND_ORIGIN}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });

process.on('SIGINT',  () => { server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
