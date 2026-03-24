import { Router } from "express";
import {
    createBooking, getUserBookings, getBookingById,
    updateBookingStatus, approveBooking, rejectBooking,
    cancelBooking, markSessionDone, studentConfirmComplete,
    disputeSession, getCounsellorReviews,
    getAvailableSlots, getAvailableCounselors,
    getBookingStats, searchBookings,
} from "../controllers/booking.controller.js";
import { verifyJWT }      from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authoriseRoles.middleware.js";

const router = Router();

// All booking routes require authentication
router.use(verifyJWT);

// ── Discovery ────────────────────────────────────────────────────────────────
router.get("/counselors",               getAvailableCounselors);
router.get("/slots/:counselorId/:date", getAvailableSlots);

// ── Reviews (public read) ─────────────────────────────────────────────────────
router.get("/reviews/:counsellorId",    getCounsellorReviews);

// ── CRUD ──────────────────────────────────────────────────────────────────────
router.route("/")
    .post(createBooking)    // Student: creates booking
    .get(getUserBookings);  // Student / Counsellor / Admin: own bookings

router.get("/:bookingId",          getBookingById);
router.put("/:bookingId/status",   updateBookingStatus);  // Admin override

// ── Booking lifecycle ─────────────────────────────────────────────────────────
// Counsellor actions
router.put("/:bookingId/approve",  approveBooking);   // confirmed → pending paid booking
router.put("/:bookingId/reject",   rejectBooking);    // pending → cancelled + refund
router.put("/:bookingId/done",     markSessionDone);  // confirmed → session_done (sends student email)

// Student actions
router.post("/:bookingId/confirm-complete", studentConfirmComplete); // session_done → completed + review + payout
router.post("/:bookingId/dispute",          disputeSession);         // session_done → cancelled (admin alert)

// Shared
router.put("/:bookingId/cancel",   cancelBooking);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get("/admin/stats",  authorizeRoles("admin"), getBookingStats);
router.get("/admin/search", authorizeRoles("admin"), searchBookings);

export default router;
