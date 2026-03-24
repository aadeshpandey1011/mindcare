import { AuditLog } from "../models/auditLog.model.js";

/**
 * logAudit — fire-and-forget audit writer.
 * Never throws. Never blocks the request. Safe to call anywhere.
 *
 * Usage:
 *   logAudit(req, "PAYMENT_SUCCESS", {
 *       resourceType: "Payment",
 *       resourceId:   payment._id,
 *       metadata:     { amount: 299, bookingId: booking._id },
 *       status:       "success",
 *   });
 *
 * @param {import("express").Request | null} req  — Express request (for IP / UA / user). Pass null for system events.
 * @param {string}  action      — One of the AuditLog.action enum values
 * @param {object}  [extras]    — Optional overrides / extra fields
 */
export const logAudit = (req, action, extras = {}) => {
    // Extract user context from request if available
    const user = req?.user || null;

    const entry = {
        userId:       extras.userId      ?? user?._id   ?? null,
        userRole:     extras.userRole    ?? user?.role  ?? "system",
        userEmail:    extras.userEmail   ?? user?.email ?? null,
        action,
        resourceType: extras.resourceType ?? "System",
        resourceId:   extras.resourceId   ?? null,
        status:       extras.status       ?? "success",
        ipAddress:    extras.ipAddress    ?? getIP(req),
        userAgent:    extras.userAgent    ?? req?.headers?.["user-agent"] ?? null,
        metadata:     extras.metadata     ?? {},
        description:  extras.description  ?? null,
    };

    // Intentionally fire-and-forget — do NOT await
    AuditLog.create(entry).catch(err =>
        console.error("[AuditLog] Failed to write audit entry:", err.message)
    );
};

// ── helpers ───────────────────────────────────────────────────────────────────
const getIP = (req) => {
    if (!req) return null;
    return (
        req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        null
    );
};

/**
 * Convenience wrappers for common events
 */
export const auditLogin         = (req, status = "success") =>
    logAudit(req, status === "success" ? "USER_LOGIN" : "USER_LOGIN_FAILED",
        { status, description: `Login ${status}` });

export const auditRegistration  = (req, userId) =>
    logAudit(req, "USER_REGISTERED",
        { userId, resourceType: "User", resourceId: userId });

export const auditBooking       = (req, action, bookingId, metadata = {}) =>
    logAudit(req, action,
        { resourceType: "Booking", resourceId: bookingId, metadata });

export const auditPayment       = (req, action, paymentId, metadata = {}) =>
    logAudit(req, action,
        { resourceType: "Payment", resourceId: paymentId, metadata });
