import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }      from "../utils/ApiError.js";
import { ApiResponse }   from "../utils/ApiResponse.js";
import { Booking }       from "../models/booking.model.js";
import { Review }        from "../models/review.model.js";
import { User }          from "../models/user.model.js";
import { Payment }       from "../models/payment.model.js";
import { logAudit }      from "../utils/auditLog.js";
import sendMail          from "../utils/mail.js";
import mongoose          from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
//  INTERNAL: release payout to counsellor
//  Called when booking moves to "completed" (student confirmed or auto-confirmed)
// ─────────────────────────────────────────────────────────────────────────────
const releasePayout = async (booking) => {
    if (!booking.feePaid || booking.feePaid === 0) return; // free session

    try {
        // Update booking payout status
        await Booking.findByIdAndUpdate(booking._id, {
            payoutStatus:     "released",
            payoutReleasedAt: new Date(),
        });

        // Update payment record
        if (booking.paymentId) {
            await Payment.findByIdAndUpdate(booking.paymentId, {
                payoutStatus:     "released",
                payoutReleasedAt: new Date(),
            });
        }

        // Email counsellor about payout
        const counsellorEmail = booking.counselor?.email;
        const counsellorName  = booking.counselor?.fullName;
        if (counsellorEmail) {
            await sendMail({
                to:      counsellorEmail,
                subject: "💰 Payout Released — MindCare",
                html: payoutEmailHtml(counsellorName, booking),
            }).catch(e => console.error("[Mail] payout email:", e.message));
        }

        console.log(`[Payout] Released ₹${booking.feePaid} for booking ${booking._id}`);
    } catch (err) {
        console.error("[Payout] Failed to release payout:", err.message);
        await Booking.findByIdAndUpdate(booking._id, { payoutStatus: "failed" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE BOOKING
//  POST /api/v1/bookings
// ─────────────────────────────────────────────────────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
    const { counselorId, date, timeSlot, mode, reason, notes } = req.body;
    const studentId = req.user._id;

    if (!counselorId || !date || !timeSlot || !mode || !reason)
        throw new ApiError(400, "All required fields must be provided");

    if (!mongoose.isValidObjectId(counselorId))
        throw new ApiError(400, "Invalid counselor ID");

    const counselor = await User.findOne({ _id: counselorId, role: "counsellor", isApproved: true });
    if (!counselor) throw new ApiError(404, "Counselor not found or not approved");

    const bookingDate = new Date(date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (bookingDate < today) throw new ApiError(400, "Cannot book appointments in the past");

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (bookingDate > maxDate) throw new ApiError(400, "Cannot book more than 30 days in advance");

    const slotTaken = await Booking.findOne({
        counselor: counselorId, date: bookingDate, timeSlot,
        status: { $in: ["payment_pending", "pending", "confirmed", "session_done"] },
    });
    if (slotTaken) throw new ApiError(409, "Time slot is already booked");

    const studentConflict = await Booking.findOne({
        student: studentId, date: bookingDate,
        status:  { $in: ["payment_pending", "pending", "confirmed", "session_done"] },
    });
    if (studentConflict) throw new ApiError(409, "You already have a booking on this date");

    const booking = await Booking.create({
        student: studentId, counselor: counselorId,
        date: bookingDate, timeSlot, mode, reason,
        notes: notes || "", status: "payment_pending",
    });

    const populated = await Booking.findById(booking._id)
        .populate("student",   "fullName email username")
        .populate("counselor", "fullName email sessionFee");

    logAudit(req, "BOOKING_INITIATED", {
        resourceType: "Booking", resourceId: booking._id,
        metadata: { counselorId, date: bookingDate, timeSlot, mode },
    });

    return res.status(201).json(new ApiResponse(201, {
        booking: populated,
        sessionFee:      counselor.sessionFee || 299,
        sessionFeePaise: (counselor.sessionFee || 299) * 100,
    }, "Booking initiated. Proceed to payment."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET USER BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────
const getUserBookings = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { status, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    let query = {};
    if      (req.user.role === "student")    query.student   = userId;
    else if (req.user.role === "counsellor") query.counselor = userId;

    const validStatuses = ["payment_pending","pending","confirmed","session_done","completed","cancelled"];
    if (status && validStatuses.includes(status)) query.status = status;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .populate("student",  "fullName email username avatar")
            .populate("counselor","fullName email avatar specialization sessionFee")
            .populate("paymentId","status amount cf_payment_id paymentMethod")
            .populate("reviewId", "rating comment")
            .sort(sort).skip(skip).limit(parseInt(limit)),
        Booking.countDocuments(query),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        bookings,
        pagination: {
            page: parseInt(page), limit: parseInt(limit), total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    }, "Bookings fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET SINGLE BOOKING
// ─────────────────────────────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    if (!mongoose.isValidObjectId(bookingId)) throw new ApiError(400, "Invalid booking ID");

    const booking = await Booking.findById(bookingId)
        .populate("student",  "fullName email username avatar")
        .populate("counselor","fullName email avatar specialization sessionFee")
        .populate("paymentId","status amount cf_payment_id paymentMethod refundId")
        .populate("reviewId", "rating comment createdAt");

    if (!booking) throw new ApiError(404, "Booking not found");

    const isOwner =
        booking.student._id.toString()   === req.user._id.toString() ||
        booking.counselor._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") throw new ApiError(403, "Access denied");

    return res.status(200).json(new ApiResponse(200, booking, "Booking fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  APPROVE BOOKING (counsellor)
//  PUT /api/v1/bookings/:bookingId/approve
// ─────────────────────────────────────────────────────────────────────────────
const approveBooking = asyncHandler(async (req, res) => {
    const { bookingId }   = req.params;
    const { meetingLink } = req.body;

    const booking = await Booking.findById(bookingId)
        .populate("student",  "fullName email")
        .populate("counselor","fullName email");
    if (!booking) throw new ApiError(404, "Booking not found");

    if (booking.counselor._id.toString() !== req.user._id.toString() && req.user.role !== "admin")
        throw new ApiError(403, "Only the assigned counsellor can approve this booking");
    if (booking.status !== "pending")
        throw new ApiError(400, `Booking is "${booking.status}" — only pending bookings can be approved`);

    booking.status = "confirmed";
    if (meetingLink) booking.meetingLink = meetingLink;
    await booking.save();

    logAudit(req, "BOOKING_CONFIRMED", {
        resourceType: "Booking", resourceId: booking._id,
        metadata: { counselorId: req.user._id, meetingLink },
    });

    await sendMail({
        to:      booking.student.email,
        subject: "✅ Session Confirmed — MindCare",
        html:    confirmEmailHtml(booking),
    }).catch(e => console.error("[Mail]", e.message));

    return res.status(200).json(new ApiResponse(200, booking, "Booking confirmed"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  REJECT BOOKING (counsellor → auto-refund)
//  PUT /api/v1/bookings/:bookingId/reject
// ─────────────────────────────────────────────────────────────────────────────
const rejectBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { reason }    = req.body;

    const booking = await Booking.findById(bookingId)
        .populate("student",  "fullName email")
        .populate("counselor","fullName email");
    if (!booking) throw new ApiError(404, "Booking not found");

    if (booking.counselor._id.toString() !== req.user._id.toString() && req.user.role !== "admin")
        throw new ApiError(403, "Only the assigned counsellor can reject this booking");
    if (booking.status !== "pending")
        throw new ApiError(400, "Only pending bookings can be rejected");

    booking.status             = "cancelled";
    booking.cancellationReason = reason || "Rejected by counsellor";
    await booking.save();

    logAudit(req, "BOOKING_REJECTED", {
        resourceType: "Booking", resourceId: booking._id,
        metadata: { reason, counselorId: req.user._id },
    });

    // Auto-refund via Cashfree
    const payment = await Payment.findOne({ bookingId, status: "success" });
    if (payment) {
        try {
            const refundId = `RF_REJ_${bookingId}_${Date.now()}`;
            const cfRes = await fetch(
                `${process.env.NODE_ENV === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com"}/pg/orders/${payment.order_id}/refunds`,
                {
                    method:  "POST",
                    headers: {
                        "Content-Type":    "application/json",
                        "x-api-version":   "2023-08-01",
                        "x-client-id":     process.env.CASHFREE_APP_ID,
                        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
                    },
                    body: JSON.stringify({
                        refund_amount: payment.amount,
                        refund_id:     refundId,
                        refund_note:   reason || "Booking rejected by counsellor",
                    }),
                }
            );
            const cfData = await cfRes.json();
            payment.status       = "refunded";
            payment.refundId     = cfData.refund_id || refundId;
            payment.refundAmount = payment.amount;
            payment.refundReason = "Booking rejected by counsellor";
            payment.refundedAt   = new Date();
            await payment.save();

            logAudit(null, "REFUND_INITIATED", {
                resourceType: "Payment", resourceId: payment._id,
                metadata: { refundId: payment.refundId, amount: payment.amount },
            });
        } catch (err) {
            console.error("[Refund] Auto-refund failed:", err.message);
        }
    }

    await sendMail({
        to:      booking.student.email,
        subject: "❌ Session Request Rejected — MindCare",
        html:    rejectEmailHtml(booking, reason),
    }).catch(e => console.error("[Mail]", e.message));

    return res.status(200).json(new ApiResponse(200, booking, "Booking rejected and refund initiated"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  CANCEL BOOKING (student or counsellor)
//  PUT /api/v1/bookings/:bookingId/cancel
// ─────────────────────────────────────────────────────────────────────────────
const cancelBooking = asyncHandler(async (req, res) => {
    const { bookingId }          = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(bookingId)
        .populate("student",  "fullName email")
        .populate("counselor","fullName email");
    if (!booking) throw new ApiError(404, "Booking not found");

    const uid     = req.user._id.toString();
    const isOwner = booking.student._id.toString() === uid || booking.counselor._id.toString() === uid;
    if (!isOwner && req.user.role !== "admin") throw new ApiError(403, "Access denied");

    if (!["payment_pending","pending","confirmed"].includes(booking.status))
        throw new ApiError(400, "Cannot cancel a booking in its current state");

    // 2-hour cutoff for confirmed sessions (students)
    if (req.user.role === "student" && booking.status === "confirmed") {
        const sessionTime = new Date(booking.date);
        const [h, m] = booking.timeSlot.split("-")[0].split(":");
        sessionTime.setHours(parseInt(h), parseInt(m));
        if (new Date() > new Date(sessionTime - 2 * 3600 * 1000))
            throw new ApiError(400, "Cannot cancel within 2 hours of the session");
    }

    booking.status             = "cancelled";
    booking.cancellationReason = cancellationReason || "Cancelled";
    await booking.save();

    logAudit(req, "BOOKING_CANCELLED", {
        resourceType: "Booking", resourceId: booking._id,
        metadata: { reason: cancellationReason, cancelledBy: req.user.role },
    });

    return res.status(200).json(new ApiResponse(200, booking, "Booking cancelled"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  MARK SESSION DONE (counsellor — step 1 of completion)
//  PUT /api/v1/bookings/:bookingId/done
//  Body: { sessionNotes? }
//
//  → status: confirmed → session_done
//  → student gets email asking to confirm + review
// ─────────────────────────────────────────────────────────────────────────────
const markSessionDone = asyncHandler(async (req, res) => {
    const { bookingId }    = req.params;
    const { sessionNotes } = req.body;

    const booking = await Booking.findById(bookingId)
        .populate("student",  "fullName email")
        .populate("counselor","fullName email");
    if (!booking) throw new ApiError(404, "Booking not found");

    if (booking.counselor._id.toString() !== req.user._id.toString() && req.user.role !== "admin")
        throw new ApiError(403, "Only the assigned counsellor can mark this session done");
    if (booking.status !== "confirmed")
        throw new ApiError(400, "Only confirmed sessions can be marked as done");

    booking.status        = "session_done";
    booking.sessionNotes  = sessionNotes || "";
    booking.sessionDoneAt = new Date();
    await booking.save();

    logAudit(req, "SESSION_DONE_MARKED", {
        resourceType: "Booking", resourceId: booking._id,
        metadata: { counselorId: req.user._id, hasNotes: !!sessionNotes },
    });

    // Email student asking them to confirm + review
    await sendMail({
        to:      booking.student.email,
        subject: "📋 Please Confirm Your Session & Leave a Review — MindCare",
        html:    sessionDoneEmailHtml(booking),
    }).catch(e => console.error("[Mail]", e.message));

    return res.status(200).json(new ApiResponse(200, booking,
        "Session marked as done. Student has been notified to confirm and leave a review."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  STUDENT CONFIRMS COMPLETION + SUBMITS REVIEW (step 2)
//  POST /api/v1/bookings/:bookingId/confirm-complete
//  Body: { rating (1-5), comment? }
//
//  → status: session_done → completed
//  → Review created
//  → Payout released to counsellor
// ─────────────────────────────────────────────────────────────────────────────
const studentConfirmComplete = asyncHandler(async (req, res) => {
    const { bookingId }         = req.params;
    const { rating, comment }   = req.body;

    if (!rating || rating < 1 || rating > 5)
        throw new ApiError(400, "Rating must be between 1 and 5");

    const booking = await Booking.findById(bookingId)
        .populate("student",  "fullName email")
        .populate("counselor","fullName email");
    if (!booking) throw new ApiError(404, "Booking not found");

    // Only the student who booked can confirm
    if (booking.student._id.toString() !== req.user._id.toString())
        throw new ApiError(403, "Only the student can confirm session completion");
    if (booking.status !== "session_done")
        throw new ApiError(400, "Session must be in 'session_done' state to confirm");

    // Check for duplicate review
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) throw new ApiError(409, "You have already reviewed this session");

    // Create review
    const review = await Review.create({
        bookingId,
        studentId:    booking.student._id,
        counsellorId: booking.counselor._id,
        rating:       Number(rating),
        comment:      comment?.trim() || "",
    });

    // Mark booking completed
    booking.status             = "completed";
    booking.studentConfirmed   = true;
    booking.studentConfirmedAt = new Date();
    booking.reviewId           = review._id;
    booking.payoutStatus       = "released";
    booking.payoutReleasedAt   = new Date();
    await booking.save();

    // Update counsellor's average rating
    await updateCounsellorRating(booking.counselor._id);

    logAudit(req, "SESSION_COMPLETED", {
        resourceType: "Booking", resourceId: booking._id,
        metadata: { rating, studentConfirmed: true, counselorId: booking.counselor._id },
    });
    logAudit(req, "REVIEW_SUBMITTED", {
        resourceType: "Review", resourceId: review._id,
        metadata: { rating, bookingId },
    });

    // Release payout to counsellor
    await releasePayout(booking);

    // Thank-you email to student
    await sendMail({
        to:      booking.student.email,
        subject: "✨ Session Completed — Thank you for your review!",
        html:    sessionCompletedEmailHtml(booking, review),
    }).catch(e => console.error("[Mail]", e.message));

    return res.status(200).json(new ApiResponse(200, {
        booking,
        review,
    }, "Session confirmed and review submitted. Thank you!"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  DISPUTE SESSION (student disagrees — session_done only)
//  POST /api/v1/bookings/:bookingId/dispute
//  Body: { reason }
//
//  → status: session_done → disputed (admin reviews)
// ─────────────────────────────────────────────────────────────────────────────
const disputeSession = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { reason }    = req.body;

    if (!reason?.trim()) throw new ApiError(400, "Please provide a reason for the dispute");

    const booking = await Booking.findById(bookingId)
        .populate("student",  "fullName email")
        .populate("counselor","fullName email");
    if (!booking) throw new ApiError(404, "Booking not found");

    if (booking.student._id.toString() !== req.user._id.toString())
        throw new ApiError(403, "Only the student can raise a dispute");
    if (booking.status !== "session_done")
        throw new ApiError(400, "Can only dispute a session that has been marked done by the counsellor");

    // Mark as cancelled with dispute reason — admin will investigate
    booking.status             = "cancelled";
    booking.cancellationReason = `DISPUTE: ${reason.trim()}`;
    await booking.save();

    logAudit(req, "BOOKING_DISPUTED", {
        resourceType: "Booking", resourceId: booking._id,
        metadata: { reason, studentId: req.user._id },
    });

    // Alert admin by email
    const admin = await User.findOne({ role: "admin" }).select("email fullName");
    if (admin) {
        await sendMail({
            to:      admin.email,
            subject: "⚠️ Session Dispute Filed — MindCare Admin",
            html:    disputeAlertEmailHtml(booking, reason),
        }).catch(e => console.error("[Mail]", e.message));
    }

    return res.status(200).json(new ApiResponse(200, booking,
        "Dispute filed. Our team will review within 24 hours and contact you."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  AUTO-COMPLETE SESSIONS (run by cron job every hour)
//  Called internally — not an HTTP route
//
//  If student hasn't confirmed within 48 hours of counsellor marking done,
//  auto-complete and release payout.
// ─────────────────────────────────────────────────────────────────────────────
export const autoCompleteExpiredSessions = async () => {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    const expiredBookings = await Booking.find({
        status:         "session_done",
        sessionDoneAt:  { $lte: cutoff },
        studentConfirmed: false,
    })
    .populate("student",  "fullName email")
    .populate("counselor","fullName email");

    console.log(`[AutoComplete] Found ${expiredBookings.length} expired sessions to auto-complete`);

    for (const booking of expiredBookings) {
        try {
            booking.status             = "completed";
            booking.autoConfirmed      = true;
            booking.studentConfirmedAt = new Date();
            booking.payoutStatus       = "released";
            booking.payoutReleasedAt   = new Date();
            await booking.save();

            logAudit(null, "SESSION_AUTO_COMPLETED", {
                resourceType: "Booking", resourceId: booking._id,
                metadata: { sessionDoneAt: booking.sessionDoneAt, cutoffHours: 48 },
            });

            await releasePayout(booking);

            // Notify student that session was auto-confirmed
            await sendMail({
                to:      booking.student.email,
                subject: "📋 Session Auto-Confirmed — MindCare",
                html:    autoConfirmEmailHtml(booking),
            }).catch(e => console.error("[Mail]", e.message));

        } catch (err) {
            console.error(`[AutoComplete] Failed for booking ${booking._id}:`, err.message);
        }
    }

    return expiredBookings.length;
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET REVIEWS FOR A COUNSELLOR (public)
//  GET /api/v1/bookings/reviews/:counsellorId
// ─────────────────────────────────────────────────────────────────────────────
const getCounsellorReviews = asyncHandler(async (req, res) => {
    const { counsellorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(counsellorId)) throw new ApiError(400, "Invalid counsellor ID");

    const skip = (page - 1) * limit;

    const [reviews, total, ratingAgg] = await Promise.all([
        Review.find({ counsellorId, isPublic: true, isFlagged: false })
            .populate("studentId", "fullName avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Review.countDocuments({ counsellorId, isPublic: true, isFlagged: false }),
        Review.aggregate([
            { $match: { counsellorId: new mongoose.Types.ObjectId(counsellorId), isPublic: true, isFlagged: false } },
            { $group: {
                _id:       null,
                avgRating: { $avg:   "$rating" },
                total:     { $sum:   1 },
                dist:      { $push:  "$rating" },
            }},
        ]),
    ]);

    const agg = ratingAgg[0] || { avgRating: 0, total: 0 };
    const distribution = [1,2,3,4,5].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
    }));

    return res.status(200).json(new ApiResponse(200, {
        reviews,
        summary: {
            avgRating:    Math.round((agg.avgRating || 0) * 10) / 10,
            totalReviews: agg.total,
            distribution,
        },
        pagination: {
            page: parseInt(page), limit: parseInt(limit), total,
            totalPages: Math.ceil(total / limit),
        },
    }, "Reviews fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  INTERNAL: update counsellor's cached average rating on User model
// ─────────────────────────────────────────────────────────────────────────────
const updateCounsellorRating = async (counsellorId) => {
    try {
        const agg = await Review.aggregate([
            { $match: { counsellorId: new mongoose.Types.ObjectId(counsellorId), isPublic: true, isFlagged: false } },
            { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]);
        if (agg[0]) {
            await User.findByIdAndUpdate(counsellorId, {
                avgRating:    Math.round(agg[0].avg * 10) / 10,
                totalReviews: agg[0].count,
            });
        }
    } catch (err) {
        console.error("[Rating] Failed to update counsellor rating:", err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXISTING ENDPOINTS (unchanged logic, updated for new status)
// ─────────────────────────────────────────────────────────────────────────────

const updateBookingStatus = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { status, cancellationReason, meetingLink, sessionNotes } = req.body;

    if (!mongoose.isValidObjectId(bookingId)) throw new ApiError(400, "Invalid booking ID");

    const booking = await Booking.findById(bookingId)
        .populate("student","fullName email").populate("counselor","fullName email");
    if (!booking) throw new ApiError(404, "Booking not found");

    const isOwner = booking.student._id.toString() === req.user._id.toString() ||
                    booking.counselor._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") throw new ApiError(403, "Access denied");

    const validTransitions = {
        payment_pending: ["cancelled"],
        pending:         ["confirmed", "cancelled"],
        confirmed:       ["session_done", "cancelled"],
        session_done:    ["completed", "cancelled"],
        cancelled:       [],
        completed:       [],
    };

    if (!validTransitions[booking.status]?.includes(status))
        throw new ApiError(400, `Cannot transition from ${booking.status} → ${status}`);

    booking.status = status;
    if (cancellationReason) booking.cancellationReason = cancellationReason;
    if (meetingLink  && status === "confirmed")     booking.meetingLink  = meetingLink;
    if (sessionNotes && status === "session_done")  booking.sessionNotes = sessionNotes;
    await booking.save();

    return res.status(200).json(new ApiResponse(200, booking, `Booking updated to ${status}`));
});

const getAvailableSlots = asyncHandler(async (req, res) => {
    const { counselorId, date } = req.params;
    if (!mongoose.isValidObjectId(counselorId)) throw new ApiError(400, "Invalid counselor ID");

    const counselor = await User.findOne({ _id: counselorId, role: "counsellor", isApproved: true });
    if (!counselor) throw new ApiError(404, "Counselor not found");

    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) throw new ApiError(400, "Invalid date");

    const ALL_SLOTS = ["09:00-10:00","10:00-11:00","11:00-12:00","14:00-15:00","15:00-16:00","16:00-17:00"];

    const booked = await Booking.find({
        counselor: counselorId, date: requestedDate,
        status: { $in: ["payment_pending","pending","confirmed","session_done"] },
    }).select("timeSlot");

    const bookedSlots = booked.map(b => b.timeSlot);

    return res.status(200).json(new ApiResponse(200, {
        date:           requestedDate.toISOString().split("T")[0],
        counselor:      { id: counselor._id, name: counselor.fullName, specialization: counselor.specialization, sessionFee: counselor.sessionFee },
        availableSlots: ALL_SLOTS.filter(s => !bookedSlots.includes(s)),
        bookedSlots,
        totalSlots:     ALL_SLOTS.length,
    }, "Available slots fetched"));
});

const getAvailableCounselors = asyncHandler(async (req, res) => {
    const { specialization, limit = 50 } = req.query;
    let query = { role: "counsellor", isApproved: true };
    if (specialization) query.specialization = { $regex: specialization, $options: "i" };

    const counselors = await User.find(query)
        .select("fullName email avatar specialization institution sessionFee avgRating totalReviews createdAt")
        .limit(parseInt(limit))
        .sort({ avgRating: -1, createdAt: -1 }); // top-rated first

    return res.status(200).json(new ApiResponse(200, counselors, "Counsellors fetched"));
});

const getBookingStats = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Admin access required");
    const [statusStats, monthlyStats, modeStats, upcomingSessions] = await Promise.all([
        Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Booking.aggregate([
            { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id.year": -1, "_id.month": -1 } }, { $limit: 6 },
        ]),
        Booking.aggregate([{ $group: { _id: "$mode", count: { $sum: 1 } } }]),
        Booking.find({ status: "confirmed", date: { $gte: new Date(), $lte: new Date(Date.now() + 7*86400000) } })
            .populate("student","fullName").populate("counselor","fullName")
            .sort({ date: 1 }).limit(10),
    ]);
    return res.status(200).json(new ApiResponse(200, {
        statusStats, monthlyStats, modeStats, upcomingSessions,
        totalBookings: await Booking.countDocuments(),
    }, "Booking stats fetched"));
});

const searchBookings = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Admin access required");
    const { query: q, status, mode, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    let match = {};
    if (status) match.status = status;
    if (mode)   match.mode   = mode;
    if (dateFrom || dateTo) {
        match.date = {};
        if (dateFrom) match.date.$gte = new Date(dateFrom);
        if (dateTo)   match.date.$lte = new Date(dateTo);
    }
    const pipeline = [
        { $match: match },
        { $lookup: { from: "users", localField: "student",  foreignField: "_id", as: "student"  } },
        { $lookup: { from: "users", localField: "counselor",foreignField: "_id", as: "counselor" } },
        { $unwind: "$student" }, { $unwind: "$counselor" },
        ...(q ? [{ $match: { $or: [
            { "student.fullName":   { $regex: q, $options: "i" } },
            { "counselor.fullName": { $regex: q, $options: "i" } },
            { reason:               { $regex: q, $options: "i" } },
        ]}}] : []),
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) },
    ];
    const bookings = await Booking.aggregate(pipeline);
    return res.status(200).json(new ApiResponse(200, { bookings }, "Search results"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
const confirmEmailHtml = (b) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">✅ Session Confirmed!</h1>
  </div>
  <p>Hi <strong>${b.student.fullName}</strong>, your session with <strong>${b.counselor.fullName}</strong> is confirmed.</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0">
    <p><strong>Date:</strong> ${new Date(b.date).toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
    <p><strong>Time:</strong> ${b.timeSlot}</p>
    <p><strong>Mode:</strong> ${b.mode}</p>
    ${b.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${b.meetingLink}">${b.meetingLink}</a></p>` : ""}
  </div>
</div>`;

const rejectEmailHtml = (b, reason) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#ef4444;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">❌ Session Request Rejected</h1>
  </div>
  <p>Hi <strong>${b.student.fullName}</strong>, <strong>${b.counselor.fullName}</strong> could not accept your request.</p>
  ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
  <p style="color:#16a34a">💰 A full refund has been initiated and will be credited in 5–7 business days.</p>
  <a href="${process.env.FRONTEND_URL}/booking" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Book Another Session</a>
</div>`;

const sessionDoneEmailHtml = (b) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">📋 How Was Your Session?</h1>
  </div>
  <p>Hi <strong>${b.student.fullName}</strong>,</p>
  <p><strong>${b.counselor.fullName}</strong> has marked your session as completed.</p>
  <p>Please confirm that the session took place and share your feedback. This helps us ensure quality and releases payment to your counsellor.</p>
  <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin:20px 0">
    <p><strong>Session:</strong> ${new Date(b.date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}, ${b.timeSlot}</p>
    <p><strong>Counsellor:</strong> ${b.counselor.fullName}</p>
  </div>
  <div style="text-align:center;margin:24px 0">
    <a href="${process.env.FRONTEND_URL}/all-bookings" style="display:inline-block;background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
      Confirm &amp; Leave Review →
    </a>
  </div>
  <p style="color:#9ca3af;font-size:12px;text-align:center">
    If you do not respond within 48 hours, the session will be automatically confirmed.
  </p>
</div>`;

const sessionCompletedEmailHtml = (b, review) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#10b981,#6366f1);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">🌟 Thank You for Your Review!</h1>
  </div>
  <p>Hi <strong>${b.student.fullName}</strong>, thank you for confirming your session and leaving a ${"⭐".repeat(review.rating)} rating for <strong>${b.counselor.fullName}</strong>.</p>
  <p>Your feedback helps other students find the right support. We hope the session was helpful!</p>
  <a href="${process.env.FRONTEND_URL}/booking" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Book Another Session</a>
</div>`;

const autoConfirmEmailHtml = (b) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#f59e0b;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">📋 Session Auto-Confirmed</h1>
  </div>
  <p>Hi <strong>${b.student.fullName}</strong>, your session with <strong>${b.counselor.fullName}</strong> on ${new Date(b.date).toLocaleDateString("en-IN")} has been automatically confirmed as 48 hours have passed.</p>
  <p>You can still leave a review from your bookings page.</p>
  <a href="${process.env.FRONTEND_URL}/all-bookings" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Leave a Review</a>
</div>`;

const payoutEmailHtml = (counsellorName, b) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">💰 Payout Released</h1>
  </div>
  <p>Hi <strong>${counsellorName}</strong>,</p>
  <p>The student has confirmed the session. A payout of <strong>₹${b.feePaid}</strong> has been released and will be credited to your registered bank account within 3–5 business days.</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0">
    <p><strong>Session Date:</strong> ${new Date(b.date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
    <p><strong>Amount:</strong> ₹${b.feePaid}</p>
  </div>
  <p style="color:#6b7280;font-size:12px">If you have any questions about payouts, contact support@mindcare.com</p>
</div>`;

const disputeAlertEmailHtml = (b, reason) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#ef4444;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">⚠️ Dispute Filed</h1>
  </div>
  <p>A student has filed a dispute for a completed session.</p>
  <p><strong>Student:</strong> ${b.student.fullName} (${b.student.email})</p>
  <p><strong>Counsellor:</strong> ${b.counselor.fullName} (${b.counselor.email})</p>
  <p><strong>Session Date:</strong> ${new Date(b.date).toLocaleDateString("en-IN")}</p>
  <p><strong>Booking ID:</strong> ${b._id}</p>
  <p><strong>Dispute Reason:</strong> ${reason}</p>
  <p>Please review this case and take appropriate action.</p>
</div>`;

export {
    createBooking, getUserBookings, getBookingById,
    updateBookingStatus, approveBooking, rejectBooking,
    cancelBooking, markSessionDone, studentConfirmComplete,
    disputeSession, getCounsellorReviews,
    getAvailableSlots, getAvailableCounselors,
    getBookingStats, searchBookings,
};
