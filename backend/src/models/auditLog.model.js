import mongoose, { Schema } from "mongoose";

/**
 * AuditLog — immutable record of every significant action in the platform.
 * Written by logAudit() helper. Never modified after creation.
 * TTL index auto-deletes records older than 90 days.
 *
 * Visible to:
 *   - Admin: full log, all users, all event types
 *   - Student: own BOOKING / PAYMENT / SCREENING events only
 *   - Counsellor: own BOOKING events only
 */

const auditLogSchema = new Schema(
    {
        // ── Who ───────────────────────────────────────────────────────────────
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
            default: null, // null for system/anonymous events
        },
        userRole: {
            type: String,
            enum: ["student", "counsellor", "admin", "system", "anonymous"],
            default: "system",
        },
        userEmail: { type: String, default: null }, // snapshot at log time

        // ── What ──────────────────────────────────────────────────────────────
        action: {
            type: String,
            required: true,
            enum: [
                // Auth
                "USER_REGISTERED",
                "USER_LOGIN",
                "USER_LOGOUT",
                "USER_LOGIN_FAILED",
                "PASSWORD_RESET_REQUESTED",
                "PASSWORD_RESET_COMPLETED",

                // Admin actions
                "COUNSELLOR_APPROVED",
                "COUNSELLOR_REJECTED",
                "USER_BANNED",

                // Booking lifecycle
                "BOOKING_INITIATED",     // booking record created, payment pending
                "BOOKING_CONFIRMED",     // counsellor confirmed
                "BOOKING_REJECTED",      // counsellor rejected
                "BOOKING_CANCELLED",     // student or counsellor cancelled
                "SESSION_COMPLETED",     // counsellor marked complete

                // Payment lifecycle
                "PAYMENT_ORDER_CREATED", // Razorpay order created
                "PAYMENT_SUCCESS",       // payment verified successfully
                "PAYMENT_FAILED",        // payment failed / signature mismatch
                "PAYMENT_WEBHOOK",       // webhook received from Razorpay
                "REFUND_INITIATED",      // refund triggered
                "REFUND_SUCCESS",        // Razorpay confirmed refund

                // Screening
                "SCREENING_SUBMITTED",
                "CRISIS_ALERT_TRIGGERED",

                // Forum
                "POST_REPORTED",
                "USER_WARNED",
                "USER_FORUM_BANNED",
            ],
            index: true,
        },

        // ── Which resource ────────────────────────────────────────────────────
        resourceType: {
            type: String,
            enum: ["User", "Booking", "Payment", "Screening", "Post", "System"],
            default: "System",
        },
        resourceId: {
            type: Schema.Types.ObjectId,
            default: null,
            index: true,
        },

        // ── Outcome ───────────────────────────────────────────────────────────
        status: {
            type: String,
            enum: ["success", "failed", "warning"],
            default: "success",
        },

        // ── Context ───────────────────────────────────────────────────────────
        ipAddress: { type: String, default: null },
        userAgent: { type: String, default: null },

        // Free-form payload — anything relevant to the event
        metadata: { type: Schema.Types.Mixed, default: {} },

        // Human-readable description (optional, for quick admin reading)
        description: { type: String, default: null },
    },
    {
        timestamps: true,
        // Never allow updates — audit logs are immutable
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

// TTL — auto-delete after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
