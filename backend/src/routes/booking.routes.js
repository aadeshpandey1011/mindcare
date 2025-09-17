// import { Router } from "express";
// import {
//   createBooking,
//   getUserBookings,
//   updateBookingStatus,
//   getAvailableSlots,
//   getAvailableCounselors,
//   getBookingById,
//   cancelBooking,
//   approveBooking,
//   getBookingStats,
//   searchBookings
// } from "../controllers/booking.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

// const router = Router();

// // ✅ All booking routes require authentication
// router.use(verifyJWT);

// // ------------------- Booking CRUD -------------------
// router.route("/")
//   .post(createBooking)     // POST /api/v1/bookings - Create booking
//   .get(getUserBookings);   // GET  /api/v1/bookings - Get user's bookings (with pagination/filters)

// router.route("/:bookingId")
//   .get(getBookingById);    // GET /api/v1/bookings/:id

// router.route("/:bookingId/status")
//   .put(updateBookingStatus); // PUT /api/v1/bookings/:id/status

// // ------------------- Quick Actions -------------------
// router.route("/:bookingId/approve")
//   .put(approveBooking);     // PUT /api/v1/bookings/:id/approve

// router.route("/:bookingId/cancel")
//   .put(cancelBooking);      // PUT /api/v1/bookings/:id/cancel

// // ------------------- Availability -------------------
// router.route("/counselors")
//   .get(getAvailableCounselors); // GET /api/v1/bookings/counselors

// router.route("/slots/:counselorId/:date")
//   .get(getAvailableSlots);      // GET /api/v1/bookings/slots/:counselorId/:date

// // ------------------- Admin Features -------------------
// router.route("/admin/stats")
//   .get(getBookingStats);        // GET /api/v1/bookings/admin/stats

// router.route("/admin/search")
//   .get(searchBookings);         // GET /api/v1/bookings/admin/search

// export default router;






// // routes/booking.routes.js
import { Router } from "express";
import {
  createBooking,
  getUserBookings,
  updateBookingStatus,
  getAvailableSlots,
  getAvailableCounselors,
  getBookingById,
  cancelBooking,
  approveBooking,
  getBookingStats,
  searchBookings
} from "../controllers/booking.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All booking routes require authentication
router.use(verifyJWT);

// Booking CRUD operations
router.route("/")
  .post(createBooking)          // POST /api/v1/bookings - Create new booking
  .get(getUserBookings);        // GET /api/v1/bookings - Get user's bookings with filters


// Availability and counselor info
router.route("/counselors")
  .get(getAvailableCounselors); // GET /api/v1/bookings/counselors - Get available counselors

router.route("/").post(createBooking).get(getUserBookings);
// Individual booking operations
router.route("/:bookingId")
  .get(getBookingById);         // GET /api/v1/bookings/:id - Get single booking

// Booking status updates
router.route("/:bookingId/status")
  .put(updateBookingStatus);    // PUT /api/v1/bookings/:id/status - Update booking status

// Quick actions
router.route("/:bookingId/approve")
  .put(approveBooking);         // PUT /api/v1/bookings/:id/approve - Quick approve

router.route("/:bookingId/cancel")
  .put(cancelBooking);          // PUT /api/v1/bookings/:id/cancel - Quick cancel

router.route("/slots/:counselorId/:date")
  .get(getAvailableSlots);      // GET /api/v1/bookings/slots/:counselorId/:date - Get available slots

// Admin routes (statistics and search)
router.route("/admin/stats")
  .get(getBookingStats);        // GET /api/v1/bookings/admin/stats - Get booking statistics

router.route("/admin/search")
  .get(searchBookings);         // GET /api/v1/bookings/admin/search - Search bookings

export default router;