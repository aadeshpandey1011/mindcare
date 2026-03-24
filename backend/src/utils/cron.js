/**
 * cron.js — background jobs for MindCare
 *
 * Jobs:
 *   1. Auto-complete sessions     — every hour
 *      If student hasn't confirmed within 48h of counsellor marking done,
 *      auto-complete and release payout.
 *
 *   2. Expire stale payment_pending bookings — every hour
 *      If a booking has been sitting in payment_pending for more than
 *      PAYMENT_EXPIRY_HOURS (default 24h), cancel it and free the slot.
 */

import cron from "node-cron";
import { Booking } from "../models/booking.model.js";
import { Payment } from "../models/payment.model.js";
import { autoCompleteExpiredSessions } from "../controllers/booking.controller.js";
import { logAudit } from "../utils/auditLog.js";

// ── Config ────────────────────────────────────────────────────────────────────
const PAYMENT_EXPIRY_HOURS = 24; // cancel unpaid bookings after 24 hours

// ─────────────────────────────────────────────────────────────────────────────
//  JOB 1: expire stale payment_pending bookings
// ─────────────────────────────────────────────────────────────────────────────
const expireUnpaidBookings = async () => {
    const cutoff = new Date(Date.now() - PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);

    // Find bookings that have been payment_pending for too long
    const staleBookings = await Booking.find({
        status:    "payment_pending",
        createdAt: { $lte: cutoff },
    }).populate("student", "fullName email");

    if (staleBookings.length === 0) return 0;

    console.log(`[Cron] Found ${staleBookings.length} unpaid booking(s) older than ${PAYMENT_EXPIRY_HOURS}h — expiring...`);

    let cancelled = 0;
    for (const booking of staleBookings) {
        try {
            // Cancel the booking
            booking.status             = "cancelled";
            booking.cancellationReason = `Automatically cancelled: payment not completed within ${PAYMENT_EXPIRY_HOURS} hours`;
            await booking.save();

            // Also mark any associated pending payment as failed
            if (booking.paymentId) {
                await Payment.findByIdAndUpdate(booking.paymentId, {
                    status:        "failed",
                    failureReason: "Payment not completed — booking auto-expired",
                });
            }

            logAudit(null, "BOOKING_EXPIRED_UNPAID", {
                resourceType: "Booking",
                resourceId:   booking._id,
                metadata:     { expiredAfterHours: PAYMENT_EXPIRY_HOURS, createdAt: booking.createdAt },
            });

            cancelled++;
        } catch (err) {
            console.error(`[Cron] Failed to expire booking ${booking._id}:`, err.message);
        }
    }

    console.log(`[Cron] Expired ${cancelled} unpaid booking(s) and freed their slots.`);
    return cancelled;
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXPORT: start all cron jobs
// ─────────────────────────────────────────────────────────────────────────────
export const startCronJobs = () => {
    // ── Job 1: auto-complete sessions (every hour, minute 0) ─────────────────
    cron.schedule("0 * * * *", async () => {
        console.log("[Cron] Running auto-complete check for expired session_done bookings...");
        try {
            const count = await autoCompleteExpiredSessions();
            if (count > 0) console.log(`[Cron] Auto-completed ${count} session(s).`);
        } catch (err) {
            console.error("[Cron] Auto-complete error:", err.message);
        }
    });

    // ── Job 2: expire unpaid bookings (every hour, minute 30) ────────────────
    cron.schedule("30 * * * *", async () => {
        console.log("[Cron] Running payment_pending expiry check...");
        try {
            await expireUnpaidBookings();
        } catch (err) {
            console.error("[Cron] Expire unpaid error:", err.message);
        }
    });

    console.log(`[Cron] Jobs started: auto-complete (hourly), unpaid expiry (every hour, ${PAYMENT_EXPIRY_HOURS}h threshold)`);
};
