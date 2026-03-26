import crypto          from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }     from "../utils/ApiError.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { Payment }      from "../models/payment.model.js";
import { AuditLog }     from "../models/auditLog.model.js";
import { Booking }      from "../models/booking.model.js";
import { User }         from "../models/user.model.js";
import { logAudit }     from "../utils/auditLog.js";
import sendMail         from "../utils/mail.js";

// ─────────────────────────────────────────────────────────────────────────────
//  Cashfree REST helpers
//  Docs: https://docs.cashfree.com/reference/pgcreateorder
//  Sandbox base: https://sandbox.cashfree.com/pg
//  Production base: https://api.cashfree.com/pg
// ─────────────────────────────────────────────────────────────────────────────
const CF_BASE = () =>
    process.env.NODE_ENV === "production"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";

const cfHeaders = () => {
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
        throw new ApiError(503, "Payment gateway not configured. Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to .env");
    }
    return {
        "Content-Type":    "application/json",
        "x-api-version":   "2023-08-01",
        "x-client-id":     process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
    };
};


/** Generic Cashfree API call */
const cfCall = async (method, path, body = null) => {
    const res = await fetch(`${CF_BASE()}${path}`, {
        method,
        headers: cfHeaders(),
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    // if (!res.ok) {
    //     const msg = data?.message || data?.error || `Cashfree error ${res.status}`;
    //     throw new ApiError(res.status >= 500 ? 502 : 400, msg);
    // }
    if (!res.ok) {
        console.error("[Cashfree Error Full]", JSON.stringify(data)); // ADD THIS
        const msg = data?.message || data?.error || `Cashfree error ${res.status}`;
        throw new ApiError(res.status >= 500 ? 502 : 400, msg);
    }
        return data;
};

// ─────────────────────────────────────────────────────────────────────────────
//  1. CREATE ORDER
//  POST /api/v1/payments/create-order
//  Body: { bookingId }
// ─────────────────────────────────────────────────────────────────────────────
export const createOrder = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;
    const student       = req.user;

    if (!bookingId) throw new ApiError(400, "bookingId is required");

    const booking = await Booking.findById(bookingId)
        .populate("counselor", "fullName email sessionFee");

    if (!booking)
        throw new ApiError(404, "Booking not found");
    if (booking.student.toString() !== student._id.toString())
        throw new ApiError(403, "This booking does not belong to you");
    if (booking.status !== "payment_pending")
        throw new ApiError(400, `Booking status is "${booking.status}" — payment not expected`);

    const feeRupees = booking.counselor.sessionFee ?? 299;

    console.log("[Payment] Creating order for student:", {
        id:    student._id,
        email: student.email,
        phone: student.phone,
        fee:   feeRupees,
    });

    // ── Handle FREE sessions — skip Cashfree entirely ─────────────────────────
    if (feeRupees === 0) {
        await Booking.findByIdAndUpdate(bookingId, { status: "pending", feePaid: 0 });

        const freePayment = await Payment.create({
            bookingId,
            userId:         student._id,
            counsellorId:   booking.counselor._id,
            cf_order_id:    `free_${bookingId}`,
            order_id:       `free_${bookingId}_${Date.now()}`,
            amount:         0,
            status:         "success",
            paymentMethod:  "free",
            idempotencyKey: `free_${bookingId}`,
        });

        await Booking.findByIdAndUpdate(bookingId, { paymentId: freePayment._id });

        logAudit(req, "PAYMENT_SUCCESS", {
            resourceType: "Payment",
            resourceId:   freePayment._id,
            metadata:     { amount: 0, method: "free", bookingId },
        });

        return res.status(201).json(new ApiResponse(201, {
            free:         true,
            bookingId,
            bookingStatus: "pending",
            feeRupees:    0,
        }, "Free session confirmed. Awaiting counsellor approval."));
    }

    // ── Paid session — create Cashfree order ──────────────────────────────────
    const orderId = `MC_${bookingId}_${Date.now()}`;

    const cfOrder = await cfCall("POST", "/orders", {
        order_id:       orderId,
        order_amount:   feeRupees,
        order_currency: "INR",
        customer_details: {
            customer_id:    student._id.toString(),
            customer_name:  student.fullName,
            customer_email: student.email,
            customer_phone: student.phone || "9999999999",
        },
        order_meta: {
            return_url: `${process.env.FRONTEND_URL}/payment-result?order_id={order_id}&booking_id=${bookingId}`,
            notify_url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/v1/payments/webhook`,
        },
        order_note: `MindCare counselling session — ${booking.counselor.fullName}`,
    });

    // Save Payment record
    const payment = await Payment.create({
        bookingId,
        userId:         student._id,
        counsellorId:   booking.counselor._id,
        cf_order_id:    cfOrder.cf_order_id,
        order_id:       orderId,
        amount:         feeRupees,
        currency:       "INR",
        status:         "pending",
        idempotencyKey: orderId,
    });

    // Link to booking
    await Booking.findByIdAndUpdate(bookingId, {
        paymentId: payment._id,
        feePaid:   feeRupees,
    });

    logAudit(req, "PAYMENT_ORDER_CREATED", {
        resourceType: "Payment",
        resourceId:   payment._id,
        metadata:     { amount: feeRupees, cfOrderId: cfOrder.cf_order_id, bookingId },
    });

    res.status(201).json(new ApiResponse(201, {
        // These are what the Cashfree JS SDK needs
        paymentSessionId: cfOrder.payment_session_id,
        cfOrderId:        cfOrder.cf_order_id,
        orderId,
        amount:           feeRupees,
        currency:         "INR",
        appId:            process.env.CASHFREE_APP_ID,
        paymentId:        payment._id,
        bookingId,
        counselorName:    booking.counselor.fullName,
        feeRupees,
        environment:      process.env.NODE_ENV === "production" ? "production" : "sandbox",
    }, "Cashfree order created"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. VERIFY PAYMENT
//  POST /api/v1/payments/verify
//  Body: { orderId, bookingId }
//  Called by frontend after Cashfree redirects back (return_url)
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPayment = asyncHandler(async (req, res) => {
    const { orderId, bookingId } = req.body;
    if (!orderId || !bookingId) throw new ApiError(400, "orderId and bookingId are required");

    // Fetch order status from Cashfree
    const cfOrder = await cfCall("GET", `/orders/${orderId}`);

    const payment = await Payment.findOne({ order_id: orderId });
    if (!payment) throw new ApiError(404, "Payment record not found");

    const orderStatus = cfOrder.order_status; // PAID | ACTIVE | EXPIRED

    if (orderStatus === "PAID") {
        // Fetch payment details
        const payments = await cfCall("GET", `/orders/${orderId}/payments`);
        const cfPay    = payments?.[0]; // most recent payment attempt

        payment.cf_payment_id  = cfPay?.cf_payment_id?.toString() || null;
        payment.status         = "success";
        payment.paymentMethod  = cfPay?.payment_method ? Object.keys(cfPay.payment_method)[0] : null;
        payment.paymentBank    = cfPay?.payment_method?.netbanking?.channel || null;
        payment.paymentVpa     = cfPay?.payment_method?.upi?.upi_id || null;
        await payment.save();

        // Advance booking → pending (awaiting counsellor)
        const booking = await Booking.findByIdAndUpdate(
            bookingId, { status: "pending" }, { new: true }
        ).populate("student counselor");

        logAudit(req, "PAYMENT_SUCCESS", {
            resourceType: "Payment",
            resourceId:   payment._id,
            metadata:     { amount: payment.amount, method: payment.paymentMethod, orderId, bookingId },
        });
        logAudit(req, "BOOKING_INITIATED", {
            resourceType: "Booking",
            resourceId:   booking._id,
            metadata:     { counselorId: booking.counselor._id, date: booking.date },
        });

        // Emails
        try {
            await sendMail({ to: req.user.email,        subject: "✅ Payment Confirmed — MindCare", html: paymentSuccessEmailHtml(req.user, booking, payment) });
            await sendMail({ to: booking.counselor.email, subject: "📋 New Paid Booking — MindCare", html: newBookingEmailHtml(booking, req.user) });
        } catch (e) { console.error("[Mail]", e.message); }

        return res.status(200).json(new ApiResponse(200, {
            paymentId:     payment._id,
            bookingId,
            bookingStatus: "pending",
            amountRupees:  payment.amount,
        }, "Payment verified. Awaiting counsellor confirmation."));

    } else {
        // ACTIVE (still pending) or EXPIRED/FAILED
        const failed = orderStatus !== "ACTIVE";
        if (failed) {
            payment.status        = "failed";
            payment.failureReason = `Cashfree order status: ${orderStatus}`;
            await payment.save();

            await Booking.findByIdAndUpdate(bookingId, {
                status:             "cancelled",
                cancellationReason: "Payment not completed",
            });

            logAudit(req, "PAYMENT_FAILED", {
                resourceType: "Payment",
                resourceId:   payment._id,
                status:       "failed",
                metadata:     { reason: orderStatus, orderId, bookingId },
            });
        }

        return res.status(200).json(new ApiResponse(200, {
            paymentId:     payment._id,
            bookingId,
            bookingStatus: failed ? "cancelled" : "payment_pending",
            status:        orderStatus,
        }, failed ? "Payment failed" : "Payment still pending"));
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. WEBHOOK (Cashfree → our server)
//  POST /api/v1/payments/webhook
//  No auth — Cashfree signs with timestamp + secret
// ─────────────────────────────────────────────────────────────────────────────
export const cashfreeWebhook = asyncHandler(async (req, res) => {
    // ── Verify Cashfree webhook signature ─────────────────────────────────────
    const secret    = process.env.CASHFREE_WEBHOOK_SECRET;
    const timestamp = req.headers["x-webhook-timestamp"];
    const signature = req.headers["x-webhook-signature"];

    if (secret && timestamp && signature) {
        const body    = JSON.stringify(req.body);
        const message = timestamp + body;
        const computed = crypto
            .createHmac("sha256", secret)
            .update(message)
            .digest("base64");

        if (computed !== signature) {
            console.warn("[Webhook] Cashfree signature mismatch");
            return res.status(400).json({ error: "Invalid signature" });
        }
    }

    const event = req.body.type;
    const data  = req.body.data;

    logAudit(null, "PAYMENT_WEBHOOK", {
        metadata:    { event, orderId: data?.order?.order_id },
        description: `Cashfree webhook: ${event}`,
    });

    // PAYMENT_SUCCESS_WEBHOOK
    if (event === "PAYMENT_SUCCESS_WEBHOOK") {
        const orderId = data.order.order_id;
        const payment = await Payment.findOne({ order_id: orderId });
        if (payment && payment.status !== "success") {
            payment.status        = "success";
            payment.cf_payment_id = data.payment?.cf_payment_id?.toString() || null;
            payment.paymentMethod = data.payment?.payment_group || null;
            await payment.save();
            await Booking.findByIdAndUpdate(payment.bookingId, { status: "pending" });
        }
    }

    // PAYMENT_FAILED_WEBHOOK
    if (event === "PAYMENT_FAILED_WEBHOOK") {
        const orderId = data.order.order_id;
        const payment = await Payment.findOne({ order_id: orderId });
        if (payment && payment.status === "pending") {
            payment.status        = "failed";
            payment.failureReason = data.payment?.payment_message || "Payment failed";
            await payment.save();
            await Booking.findByIdAndUpdate(payment.bookingId, {
                status:             "cancelled",
                cancellationReason: "Payment failed",
            });
        }
    }

    // REFUND_STATUS_WEBHOOK
    if (event === "REFUND_STATUS_WEBHOOK" && data.refund?.refund_status === "SUCCESS") {
        const payment = await Payment.findOne({ cf_payment_id: data.refund.cf_payment_id?.toString() });
        if (payment) {
            payment.status     = "refunded";
            payment.refundId   = data.refund.refund_id;
            payment.refundedAt = new Date();
            await payment.save();
            logAudit(null, "REFUND_SUCCESS", {
                resourceType: "Payment",
                resourceId:   payment._id,
                metadata:     { refundId: data.refund.refund_id },
            });
        }
    }

    res.status(200).json({ received: true });
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. INITIATE REFUND
//  POST /api/v1/payments/refund/:bookingId
// ─────────────────────────────────────────────────────────────────────────────
export const initiateRefund = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { reason }    = req.body;

    const booking = await Booking.findById(bookingId)
        .populate("student",  "fullName email")
        .populate("counselor","fullName");

    if (!booking) throw new ApiError(404, "Booking not found");

    const uid     = req.user._id.toString();
    const isOwner = booking.student._id.toString() === uid || booking.counselor._id.toString() === uid;
    if (!isOwner && req.user.role !== "admin") throw new ApiError(403, "Not authorised");

    if (req.user.role === "student") {
        const cutoff = new Date(new Date(booking.date).getTime() - 24 * 3600 * 1000);
        if (new Date() > cutoff) throw new ApiError(400, "Refund not available — within 24 hours of session");
    }

    const payment = await Payment.findOne({ bookingId, status: "success" });
    if (!payment) throw new ApiError(400, "No successful payment found for this booking");

    // Free sessions — nothing to refund
    if (payment.amount === 0 || payment.paymentMethod === "free") {
        booking.status             = "cancelled";
        booking.cancellationReason = reason || "Cancelled";
        await booking.save();
        return res.status(200).json(new ApiResponse(200, { bookingId }, "Free session cancelled"));
    }

    // Call Cashfree refund API
    const refundId  = `RF_${bookingId}_${Date.now()}`;
    const cfRefund  = await cfCall("POST", `/orders/${payment.order_id}/refunds`, {
        refund_amount: payment.amount,
        refund_id:     refundId,
        refund_note:   reason || "Booking cancelled",
    });

    payment.status        = "refunded";
    payment.refundId      = cfRefund.refund_id || refundId;
    payment.refundAmount  = payment.amount;
    payment.refundReason  = reason || "Booking cancelled";
    payment.refundedAt    = new Date();
    await payment.save();

    booking.status             = "cancelled";
    booking.cancellationReason = reason || "Booking cancelled with refund";
    await booking.save();

    logAudit(req, "REFUND_INITIATED", {
        resourceType: "Payment",
        resourceId:   payment._id,
        metadata:     { refundId: payment.refundId, amount: payment.amount, bookingId },
    });
    logAudit(req, "BOOKING_CANCELLED", {
        resourceType: "Booking",
        resourceId:   booking._id,
        metadata:     { reason, refundId: payment.refundId },
    });

    try {
        await sendMail({
            to:      booking.student.email,
            subject: "💰 Refund Initiated — MindCare",
            html:    refundEmailHtml(booking.student, payment, reason),
        });
    } catch (e) { console.error("[Mail]", e.message); }

    res.status(200).json(new ApiResponse(200, {
        refundId:    payment.refundId,
        amount:      payment.amount,
        status:      "refunded",
        bookingId,
    }, "Refund initiated. Credited in 5–7 business days."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  5. PAYMENT HISTORY
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const query = req.user.role === "admin" ? {} : { userId: req.user._id };
    const skip  = (page - 1) * limit;

    const [payments, total] = await Promise.all([
        Payment.find(query)
            .populate("bookingId",   "date timeSlot mode status")
            .populate("userId",      "fullName email")
            .populate("counsellorId","fullName specialization sessionFee")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Payment.countDocuments(query),
    ]);

    res.status(200).json(new ApiResponse(200, {
        payments,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
    }, "Payment history fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  6. REVENUE STATS (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentStats = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Admin access required");

    const [statusAgg, monthlyAgg, methodAgg] = await Promise.all([
        Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } }]),
        Payment.aggregate([
            { $match: { status: "success" } },
            { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 6 },
        ]),
        Payment.aggregate([{ $match: { status: "success" } }, { $group: { _id: "$paymentMethod", count: { $sum: 1 } } }]),
    ]);

    const totalRevenue  = statusAgg.find(s => s._id === "success")?.totalAmount  || 0;
    const totalRefunded = statusAgg.find(s => s._id === "refunded")?.totalAmount || 0;

    res.status(200).json(new ApiResponse(200, {
        summary: {
            totalRevenue:  totalRevenue.toFixed(2),
            totalRefunded: totalRefunded.toFixed(2),
            netRevenue:    (totalRevenue - totalRefunded).toFixed(2),
            totalPayments: statusAgg.reduce((a, s) => a + s.count, 0),
            successCount:  statusAgg.find(s => s._id === "success")?.count  || 0,
            failedCount:   statusAgg.find(s => s._id === "failed")?.count   || 0,
            refundCount:   statusAgg.find(s => s._id === "refunded")?.count || 0,
        },
        monthlyRevenue: monthlyAgg.map(m => ({ year: m._id.year, month: m._id.month, revenue: m.revenue.toFixed(2), count: m.count })),
        byMethod: methodAgg,
    }, "Payment stats fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  7. AUDIT LOGS (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getAuditLogs = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Admin access required");

    const { page = 1, limit = 20, action, userId, status, dateFrom, dateTo, resourceType } = req.query;
    const filter = {};
    if (action)       filter.action       = action;
    if (userId)       filter.userId       = userId;
    if (status)       filter.status       = status;
    if (resourceType) filter.resourceType = resourceType;
    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        AuditLog.find(filter).populate("userId", "fullName email role").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        AuditLog.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, {
        logs,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
    }, "Audit logs fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  8. MY AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────
export const getMyAuditLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const allowedActions = [
        "BOOKING_INITIATED","BOOKING_CONFIRMED","BOOKING_CANCELLED","SESSION_COMPLETED",
        "PAYMENT_ORDER_CREATED","PAYMENT_SUCCESS","PAYMENT_FAILED",
        "REFUND_INITIATED","REFUND_SUCCESS","SCREENING_SUBMITTED",
    ];
    const skip   = (page - 1) * limit;
    const filter = { userId: req.user._id, action: { $in: allowedActions } };

    const [logs, total] = await Promise.all([
        AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        AuditLog.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, {
        logs,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
    }, "Your activity log fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
const paymentSuccessEmailHtml = (student, booking, payment) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">💳 Payment Confirmed</h1>
    <p style="color:#e0e7ff;margin:8px 0 0">MindCare — Mental Health Platform</p>
  </div>
  <p>Hi <strong>${student.fullName}</strong>,</p>
  <p>Your payment of <strong>₹${payment.amount}</strong> has been confirmed. Awaiting counsellor approval.</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0"><strong>Counsellor:</strong></td><td>${booking.counselor.fullName}</td></tr>
      <tr><td style="padding:6px 0"><strong>Date:</strong></td><td>${new Date(booking.date).toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</td></tr>
      <tr><td style="padding:6px 0"><strong>Time:</strong></td><td>${booking.timeSlot}</td></tr>
      <tr><td style="padding:6px 0"><strong>Mode:</strong></td><td style="text-transform:capitalize">${booking.mode}</td></tr>
      <tr><td style="padding:6px 0"><strong>Amount:</strong></td><td style="color:#16a34a;font-weight:bold">₹${payment.amount}</td></tr>
      <tr><td style="padding:6px 0"><strong>Payment ID:</strong></td><td style="font-family:monospace;font-size:12px">${payment.cf_payment_id || payment.order_id}</td></tr>
    </table>
  </div>
  <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px">
    <p style="margin:0;color:#92400e">⏳ You will receive a confirmation email once the counsellor approves.</p>
  </div>
</div>`;

const newBookingEmailHtml = (booking, student) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">🔔 New Paid Booking</h1>
  </div>
  <p>Hi <strong>${booking.counselor.fullName}</strong>,</p>
  <p>A student has paid and is requesting a session with you.</p>
  <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:20px 0">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0"><strong>Student:</strong></td><td>${student.fullName}</td></tr>
      <tr><td style="padding:6px 0"><strong>Date:</strong></td><td>${new Date(booking.date).toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</td></tr>
      <tr><td style="padding:6px 0"><strong>Time:</strong></td><td>${booking.timeSlot}</td></tr>
      <tr><td style="padding:6px 0"><strong>Mode:</strong></td><td style="text-transform:capitalize">${booking.mode}</td></tr>
      <tr><td style="padding:6px 0"><strong>Reason:</strong></td><td>${booking.reason}</td></tr>
    </table>
  </div>
  <div style="text-align:center;margin:24px 0">
    <a href="${process.env.FRONTEND_URL}/counsellorDashboard" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">View Dashboard</a>
  </div>
</div>`;

const refundEmailHtml = (student, payment, reason) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">💰 Refund Initiated</h1>
  </div>
  <p>Hi <strong>${student.fullName}</strong>,</p>
  <p>A refund of <strong>₹${payment.amount}</strong> has been initiated.</p>
  <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px;margin:16px 0">
    <p style="margin:0;color:#92400e"><strong>Reason:</strong> ${reason || "Booking cancelled"}</p>
    <p style="margin:8px 0 0;color:#92400e"><strong>Refund ID:</strong> ${payment.refundId}</p>
    <p style="margin:8px 0 0;color:#92400e">💳 Credited in 5–7 business days.</p>
  </div>
</div>`;
