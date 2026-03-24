import mongoose, { Schema } from "mongoose";

/**
 * BOOKING STATUS FLOW
 *
 * payment_pending ──► pending ──► confirmed ──► session_done ──► completed
 *        │               │            │               │
 *        └───────────────┴────────────┴───────────────┴──► cancelled
 *
 * payment_pending : booking created, student must pay
 * pending         : payment received, counsellor must approve
 * confirmed       : counsellor approved, session scheduled
 * session_done    : counsellor marked session as done, waiting for student to confirm + review
 * completed       : student confirmed (or auto-confirmed after 48h), payout released
 * cancelled       : cancelled at any stage (refund triggered if payment was made)
 */

const bookingSchema = new Schema(
    {
        student: {
            type:     Schema.Types.ObjectId,
            ref:      "User",
            required: true,
        },
        counselor: {
            type:     Schema.Types.ObjectId,
            ref:      "User",
            required: true,
        },
        date: {
            type:     Date,
            required: true,
            validate: {
                validator: function (date) { return date > new Date(); },
                message:   "Booking date cannot be in the past",
            },
        },
        timeSlot: {
            type:     String,
            required: true,
            enum:     ["09:00-10:00","10:00-11:00","11:00-12:00","14:00-15:00","15:00-16:00","16:00-17:00"],
        },
        mode: {
            type:     String,
            required: true,
            enum:     ["in-person", "online", "phone"],
            default:  "online",
        },

        // ── Status ──────────────────────────────────────────────────────────
        status: {
            type:    String,
            enum:    ["payment_pending", "pending", "confirmed", "session_done", "completed", "cancelled"],
            default: "payment_pending",
            index:   true,
        },

        // ── Session content ──────────────────────────────────────────────────
        notes:    { type: String, maxlength: 500,  trim: true },
        reason:   { type: String, required: true, maxlength: 200, trim: true },
        meetingLink: {
            type: String,
            validate: {
                validator: (link) => !link || /^https?:\/\/.+/.test(link),
                message:   "Please provide a valid meeting link",
            },
        },
        cancellationReason: { type: String, maxlength: 200, trim: true },
        isConfidential:     { type: Boolean, default: true  },
        reminderSent:       { type: Boolean, default: false },

        // Private notes by counsellor — not visible to student
        sessionNotes: { type: String, maxlength: 1000, trim: true },

        // ── Completion handshake ─────────────────────────────────────────────
        // When counsellor marks session_done
        sessionDoneAt: { type: Date, default: null },

        // When student confirms completion (or auto-confirmed)
        studentConfirmedAt:  { type: Date,    default: null },
        studentConfirmed:    { type: Boolean, default: false },
        autoConfirmed:       { type: Boolean, default: false }, // true if 48h grace expired

        // Review link (populated after student submits review)
        reviewId: {
            type:    Schema.Types.ObjectId,
            ref:     "Review",
            default: null,
        },

        // ── Payment ──────────────────────────────────────────────────────────
        paymentId: {
            type:    Schema.Types.ObjectId,
            ref:     "Payment",
            default: null,
        },
        // feePaid in RUPEES (Cashfree convention — NOT paise)
        feePaid: {
            type:    Number,
            default: 0,
        },

        // When payout to counsellor was released
        payoutReleasedAt: { type: Date, default: null },
        payoutStatus: {
            type:    String,
            enum:    ["pending", "released", "failed", "not_applicable"],
            default: "not_applicable",
        },
    },
    { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
bookingSchema.index({ student:  1, date: 1 });
bookingSchema.index({ counselor:1, date: 1 });
bookingSchema.index({ status:   1 });
bookingSchema.index({ date:     1, timeSlot: 1 });
// For auto-complete cron: find session_done bookings past 48h
bookingSchema.index({ status: 1, sessionDoneAt: 1 });

// Prevent double-booking a slot
bookingSchema.index(
    { counselor: 1, date: 1, timeSlot: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ["payment_pending", "pending", "confirmed", "session_done"] },
        },
    }
);

bookingSchema.pre("save", function (next) {
    if (!this.isNew) return next();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    if (this.date > maxDate) return next(new Error("Cannot book more than 30 days in advance"));
    const day = this.date.getDay();
    if (day === 0 || day === 6) return next(new Error("Bookings are not available on weekends"));
    next();
});

export const Booking = mongoose.model("Booking", bookingSchema);
