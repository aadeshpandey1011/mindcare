// controllers/adminController.js
import { User }        from "../models/user.model.js";
import { Booking }     from "../models/booking.model.js";
import { Payment }     from "../models/payment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError }    from "../utils/ApiError.js";
import { logAudit }    from "../utils/auditLog.js";
import sendMail        from "../utils/mail.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET PENDING COUNSELLORS
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ role: "counsellor", isApproved: false })
        .select("fullName email username avatar specialization institution status createdAt role isApproved");
    res.json(new ApiResponse(200, { users }, "Pending counsellors fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  APPROVE COUNSELLOR
// ─────────────────────────────────────────────────────────────────────────────
export const approveUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isApproved: true, status: "approved" }, { new: true });
    if (!user) throw new ApiError(404, "User not found");
    res.json(new ApiResponse(200, { user }, "User approved successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  REJECT COUNSELLOR
// ─────────────────────────────────────────────────────────────────────────────
export const rejectUser = asyncHandler(async (req, res) => {
    const { id }     = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(id, { isApproved: false, status: "rejected" }, { new: true });
    if (!user) throw new ApiError(404, "User not found");

    await sendMail({
        to:      user.email,
        subject: "Your MindCare Application Update",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#ef4444">Application Update</h2>
          <p>Hi <strong>${user.fullName}</strong>,</p>
          <p>After review, we are unable to approve your counsellor application at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>Contact support@mindcare.com for more information.</p>
        </div>`,
    }).catch(e => console.error("[Mail]", e.message));

    logAudit(req, "COUNSELLOR_REJECTED", { resourceType: "User", resourceId: id, metadata: { reason } });
    res.json(new ApiResponse(200, { user }, "User rejected"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET ALL USERS
// ─────────────────────────────────────────────────────────────────────────────
export const getAllUsers = asyncHandler(async (req, res) => {
    const { role, search, status, page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const filter = {};
    if (role)   filter.role   = role;
    if (status) {
        if (status === "approved")  filter.isApproved = true;
        if (status === "pending")   { filter.isApproved = false; filter.status = "pending"; }
        if (status === "rejected")  filter.status = "rejected";
        if (status === "banned")    filter.isBannedFromForum = true;
    }
    if (search) {
        const re = { $regex: search, $options: "i" };
        filter.$or = [{ fullName: re }, { email: re }, { username: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [users, total] = await Promise.all([
        User.find(filter)
            .select("fullName email username avatar role specialization institution isApproved status isBannedFromForum avgRating totalReviews sessionFee createdAt bankDetails.hasDetails")
            .sort(sort).skip(skip).limit(Number(limit)),
        User.countDocuments(filter),
    ]);

    const [totalStudents, totalCounsellors, totalAdmins, pendingApprovals] = await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "counsellor" }),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "counsellor", isApproved: false }),
    ]);

    res.json(new ApiResponse(200, {
        users,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)), hasNext: page * limit < total, hasPrev: page > 1 },
        stats: { totalStudents, totalCounsellors, totalAdmins, pendingApprovals },
    }, "Users fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET SINGLE USER DETAIL
// ─────────────────────────────────────────────────────────────────────────────
export const getUserDetail = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password -refreshToken -govtId.otpHash -govtId.otpExpiry");
    if (!user) throw new ApiError(404, "User not found");

    const [bookingCount, paymentAgg] = await Promise.all([
        Booking.countDocuments({ $or: [{ student: user._id }, { counselor: user._id }] }),
        Payment.aggregate([{ $match: { userId: user._id, status: "success" } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    ]);

    const paymentSummary = paymentAgg[0] || { total: 0, count: 0 };
    res.json(new ApiResponse(200, { user, activity: { totalBookings: bookingCount, totalPaid: paymentSummary.total, paymentCount: paymentSummary.count } }, "User detail fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  TERMINATE USER
// ─────────────────────────────────────────────────────────────────────────────
export const terminateUser = asyncHandler(async (req, res) => {
    const { id }     = req.params;
    const { reason } = req.body;

    if (id === req.user._id.toString()) throw new ApiError(400, "You cannot terminate your own account");

    const user = await User.findById(id);
    if (!user) throw new ApiError(404, "User not found");
    if (user.role === "admin") throw new ApiError(403, "Admin accounts cannot be terminated this way");

    await User.findByIdAndUpdate(id, { isApproved: false, status: "rejected", isBannedFromForum: true, refreshToken: null });

    const cancelledCount = await Booking.updateMany(
        { $or: [{ student: id }, { counselor: id }], status: { $in: ["pending", "confirmed", "payment_pending"] } },
        { $set: { status: "cancelled", cancellationReason: `Account terminated by admin${reason ? `: ${reason}` : ""}` } }
    );

    logAudit(req, "USER_TERMINATED", { resourceType: "User", resourceId: id, metadata: { reason, role: user.role, cancelledBookings: cancelledCount.modifiedCount } });

    await sendMail({
        to:      user.email,
        subject: "Your MindCare Account Has Been Suspended",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#ef4444;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px"><h1 style="color:#fff;margin:0">Account Suspended</h1></div>
          <p>Hi <strong>${user.fullName}</strong>,</p>
          <p>Your account has been suspended. Contact <a href="mailto:support@mindcare.com">support@mindcare.com</a> if you believe this is a mistake.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        </div>`,
    }).catch(e => console.error("[Mail]", e.message));

    res.json(new ApiResponse(200, { userId: id, cancelledBookings: cancelledCount.modifiedCount }, `Account terminated. ${cancelledCount.modifiedCount} booking(s) cancelled.`));
});

// ─────────────────────────────────────────────────────────────────────────────
//  RESTORE USER
// ─────────────────────────────────────────────────────────────────────────────
export const restoreUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    await User.findByIdAndUpdate(req.params.id, { isApproved: user.role !== "counsellor" ? true : user.isApproved, status: "approved", isBannedFromForum: false });
    logAudit(req, "USER_RESTORED", { resourceType: "User", resourceId: req.params.id });

    await sendMail({
        to:      user.email,
        subject: "Your MindCare Account Has Been Restored",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#10b981">Account Restored</h2>
          <p>Hi <strong>${user.fullName}</strong>,</p>
          <p>Your account has been restored. You can now log in as normal.</p>
          <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Login →</a>
        </div>`,
    }).catch(e => console.error("[Mail]", e.message));

    res.json(new ApiResponse(200, {}, "Account restored successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET ALL PAYMENT LOGS
// ─────────────────────────────────────────────────────────────────────────────
export const getAllPayments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search, dateFrom, dateTo } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }
    if (search) {
        const re = { $regex: search, $options: "i" };
        const matchingUsers = await User.find({ $or: [{ fullName: re }, { email: re }] }).select("_id");
        filter.userId = { $in: matchingUsers.map(u => u._id) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total, summaryAgg] = await Promise.all([
        Payment.find(filter)
            .populate("userId",       "fullName email avatar role")
            .populate("counsellorId", "fullName email avatar specialization")
            .populate("bookingId",    "date timeSlot mode status")
            .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
        Payment.countDocuments(filter),
        Payment.aggregate([{ $group: { _id: null,
            totalCollected: { $sum: { $cond: [{ $eq: ["$status","success"]  }, "$amount", 0] } },
            totalRefunded:  { $sum: { $cond: [{ $eq: ["$status","refunded"] }, "$amount", 0] } },
            successCount:   { $sum: { $cond: [{ $eq: ["$status","success"]  }, 1, 0] } },
            refundCount:    { $sum: { $cond: [{ $eq: ["$status","refunded"] }, 1, 0] } },
            failedCount:    { $sum: { $cond: [{ $eq: ["$status","failed"]   }, 1, 0] } },
        }}]),
    ]);

    const summary = summaryAgg[0] || { totalCollected: 0, totalRefunded: 0, successCount: 0, refundCount: 0, failedCount: 0 };

    res.json(new ApiResponse(200, { payments, summary, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }, "Payment logs fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET PENDING PAYOUTS
//  GET /api/v1/admin/payouts?status=pending|paid|all
//
//  Returns completed bookings grouped by counsellor, showing:
//  - Total owed to each counsellor
//  - Individual booking details
//  - Payout status (pending / paid)
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingPayouts = asyncHandler(async (req, res) => {
    const { status = "all" } = req.query;

    // Find completed bookings where payment was successful and fee > 0
    const filter = {
        status: "completed",
        feePaid: { $gt: 0 },
    };

    if (status === "pending") {
        filter.payoutStatus = { $in: ["pending", "released", "not_applicable"] };
        // Also catch bookings where adminPayoutDone is not true
        filter.adminPayoutDone = { $ne: true };
    } else if (status === "paid") {
        filter.adminPayoutDone = true;
    }
    // "all" = no additional filter

    const bookings = await Booking.find(filter)
        .populate("student",   "fullName email avatar")
        .populate("counselor", "fullName email avatar specialization sessionFee +bankDetails.upiId +bankDetails.bankName +bankDetails.accountHolderName +bankDetails.hasDetails")
        .populate("paymentId", "status amount cf_payment_id paymentMethod order_id createdAt")
        .sort({ updatedAt: -1 });

    // Group by counsellor
    const counsellorMap = {};
    for (const b of bookings) {
        const cId = b.counselor?._id?.toString();
        if (!cId) continue;

        if (!counsellorMap[cId]) {
            counsellorMap[cId] = {
                counsellor: {
                    _id:            b.counselor._id,
                    fullName:       b.counselor.fullName,
                    email:          b.counselor.email,
                    avatar:         b.counselor.avatar,
                    specialization: b.counselor.specialization,
                    sessionFee:     b.counselor.sessionFee,
                    upiId:          b.counselor.bankDetails?.upiId || "",
                    bankName:       b.counselor.bankDetails?.bankName || "",
                    hasBankDetails: b.counselor.bankDetails?.hasDetails || false,
                },
                totalOwed:       0,
                totalPaid:       0,
                pendingCount:    0,
                paidCount:       0,
                bookings:        [],
            };
        }

        const entry = counsellorMap[cId];
        const amount = b.feePaid || 0;
        const isPaid = b.adminPayoutDone === true;

        entry.bookings.push({
            _id:            b._id,
            student:        b.student,
            date:           b.date,
            timeSlot:       b.timeSlot,
            mode:           b.mode,
            feePaid:        amount,
            paymentId:      b.paymentId,
            completedAt:    b.updatedAt,
            adminPayoutDone:     isPaid,
            adminPayoutDate:     b.adminPayoutDate || null,
            adminPayoutRef:      b.adminPayoutRef  || null,
            adminPayoutNote:     b.adminPayoutNote || null,
        });

        if (isPaid) {
            entry.totalPaid += amount;
            entry.paidCount++;
        } else {
            entry.totalOwed += amount;
            entry.pendingCount++;
        }
    }

    const counsellors = Object.values(counsellorMap)
        .sort((a, b) => b.totalOwed - a.totalOwed); // Highest owed first

    // Summary stats
    const totalPendingAmount = counsellors.reduce((s, c) => s + c.totalOwed, 0);
    const totalPaidAmount    = counsellors.reduce((s, c) => s + c.totalPaid, 0);
    const totalPendingCount  = counsellors.reduce((s, c) => s + c.pendingCount, 0);
    const totalPaidCount     = counsellors.reduce((s, c) => s + c.paidCount, 0);

    res.json(new ApiResponse(200, {
        counsellors,
        summary: {
            totalPendingAmount,
            totalPaidAmount,
            totalPendingCount,
            totalPaidCount,
            counsellorCount: counsellors.length,
        },
    }, "Payouts fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  MARK PAYOUT AS PAID
//  PATCH /api/v1/admin/payouts/:bookingId/mark-paid
//  Body: { reference, note }
//
//  Admin calls this after manually transferring money to the counsellor.
//  Records the payment reference (UPI ref / NEFT ref / transaction ID)
//  and marks the booking as payout-complete.
// ─────────────────────────────────────────────────────────────────────────────
export const markPayoutPaid = asyncHandler(async (req, res) => {
    const { bookingId }         = req.params;
    const { reference, note }   = req.body;

    const booking = await Booking.findById(bookingId)
        .populate("counselor", "fullName email");
    if (!booking) throw new ApiError(404, "Booking not found");
    if (booking.status !== "completed")
        throw new ApiError(400, "Only completed bookings can have payouts marked");
    if (booking.adminPayoutDone)
        throw new ApiError(400, "This payout has already been marked as paid");

    await Booking.findByIdAndUpdate(bookingId, {
        adminPayoutDone: true,
        adminPayoutDate: new Date(),
        adminPayoutRef:  reference || "",
        adminPayoutNote: note || "",
        adminPayoutBy:   req.user._id,
        payoutStatus:    "released",
        payoutReleasedAt: new Date(),
    });

    logAudit(req, "ADMIN_PAYOUT_MARKED", {
        resourceType: "Booking",
        resourceId:   bookingId,
        metadata: {
            counsellorId:   booking.counselor._id,
            counsellorName: booking.counselor.fullName,
            amount:         booking.feePaid,
            reference,
            note,
        },
    });

    // Notify counsellor via email
    try {
        await sendMail({
            to:      booking.counselor.email,
            subject: "💰 Payout Sent — MindCare",
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">💰 Payout Sent!</h1>
  </div>
  <p>Hi <strong>${booking.counselor.fullName}</strong>,</p>
  <p>A payout of <strong>₹${booking.feePaid}</strong> has been sent to your bank account.</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0">
    <p><strong>Amount:</strong> ₹${booking.feePaid}</p>
    ${reference ? `<p><strong>Reference:</strong> ${reference}</p>` : ""}
    ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}
  </div>
  <p style="color:#6b7280;font-size:12px">The amount should reflect in your bank account within 24 hours. Contact support@mindcare.com for queries.</p>
</div>`,
        });
    } catch (e) { console.error("[Mail] payout notification:", e.message); }

    res.json(new ApiResponse(200, {
        bookingId,
        counsellorName: booking.counselor.fullName,
        amount:         booking.feePaid,
        reference,
        paidAt:         new Date().toISOString(),
    }, `Payout of ₹${booking.feePaid} marked as paid to ${booking.counselor.fullName}`));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET ALL DISPUTES
//  GET /api/v1/admin/disputes?status=open|resolved|all&page=&limit=
//
//  FIX: Use "adminDisputeResolution.decision" to distinguish open from resolved.
//  Using $exists on the top-level subdoc is unreliable — an empty {} subdoc
//  is truthy and breaks the filter. Checking the nested .decision field is
//  the safe approach: it only exists when resolveDispute() has run successfully.
// ─────────────────────────────────────────────────────────────────────────────
export const getDisputes = asyncHandler(async (req, res) => {
    const { status = "open", page = 1, limit = 20 } = req.query;

    // Base: any booking cancelled with "DISPUTE:" prefix
    const baseFilter = {
        cancellationReason: { $regex: /^DISPUTE:/i },
    };

    if (status === "open") {
        // Open = no decision has been recorded yet
        baseFilter["adminDisputeResolution.decision"] = { $exists: false };
    } else if (status === "resolved") {
        // Resolved = a decision exists (refund_student or release_counsellor)
        baseFilter["adminDisputeResolution.decision"] = {
            $in: ["refund_student", "release_counsellor"],
        };
    }
    // "all" = no extra filter

    const skip = (Number(page) - 1) * Number(limit);

    // Count open disputes using the same reliable filter
    const openCountFilter = {
        cancellationReason: { $regex: /^DISPUTE:/i },
        "adminDisputeResolution.decision": { $exists: false },
    };

    const [disputes, total, openCount] = await Promise.all([
        Booking.find(baseFilter)
            .populate("student",  "fullName email avatar username")
            .populate("counselor","fullName email avatar specialization sessionFee")
            .populate("paymentId","status amount cf_payment_id refundId payoutStatus")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Booking.countDocuments(baseFilter),
        Booking.countDocuments(openCountFilter),
    ]);

    res.json(new ApiResponse(200, {
        disputes,
        openCount,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    }, "Disputes fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  RESOLVE DISPUTE
//  PATCH /api/v1/admin/disputes/:bookingId/resolve
//  Body: { decision: "refund_student" | "release_counsellor", note }
//
//  FIX: Check adminDisputeResolution.decision (not the whole subdoc) to
//  determine if already resolved — the subdoc itself may exist as {} from
//  schema initialisation, but a decision string only exists after resolution.
// ─────────────────────────────────────────────────────────────────────────────
export const resolveDispute = asyncHandler(async (req, res) => {
    const { bookingId }      = req.params;
    const { decision, note } = req.body;

    if (!["refund_student", "release_counsellor"].includes(decision))
        throw new ApiError(400, "decision must be 'refund_student' or 'release_counsellor'");

    const booking = await Booking.findById(bookingId)
        .populate("student",  "fullName email")
        .populate("counselor","fullName email");
    if (!booking) throw new ApiError(404, "Booking not found");

    if (!booking.cancellationReason?.match(/^DISPUTE:/i))
        throw new ApiError(400, "This booking is not flagged as a dispute");

    // Check the nested .decision field — not the whole subdoc
    if (booking.adminDisputeResolution?.decision) {
        throw new ApiError(400, `This dispute has already been resolved: ${booking.adminDisputeResolution.decision}`);
    }

    let outcomeMsg = "";
    const resolvedAt = new Date();

    if (decision === "refund_student") {
        // ── Cashfree refund ───────────────────────────────────────────────────
        const payment = await Payment.findOne({ bookingId: booking._id, status: "success" });
        if (payment) {
            try {
                const refundId = `RF_DISP_${bookingId}_${Date.now()}`;
                const cfUrl    = process.env.NODE_ENV === "production"
                    ? "https://api.cashfree.com"
                    : "https://sandbox.cashfree.com";

                const cfRes = await fetch(`${cfUrl}/pg/orders/${payment.order_id}/refunds`, {
                    method: "POST",
                    headers: {
                        "Content-Type":    "application/json",
                        "x-api-version":   "2023-08-01",
                        "x-client-id":     process.env.CASHFREE_APP_ID,
                        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
                    },
                    body: JSON.stringify({
                        refund_amount: payment.amount,
                        refund_id:     refundId,
                        refund_note:   `Dispute resolved in student's favour: ${note || "Admin decision"}`,
                    }),
                });
                const cfData = await cfRes.json();
                payment.status       = "refunded";
                payment.refundId     = cfData.refund_id || refundId;
                payment.refundAmount = payment.amount;
                payment.refundReason = `Dispute: ${note || "Admin decision"}`;
                payment.refundedAt   = resolvedAt;
                await payment.save();

                logAudit(req, "DISPUTE_REFUND_INITIATED", {
                    resourceType: "Payment", resourceId: payment._id,
                    metadata: { refundId: payment.refundId, amount: payment.amount, bookingId },
                });
            } catch (err) {
                console.error("[Dispute refund]", err.message);
                // Non-fatal — still record resolution so admin isn't blocked
            }
        }
        outcomeMsg = `Refund of ₹${booking.feePaid} initiated to student ${booking.student.fullName}.`;

        await Promise.allSettled([
            sendMail({ to: booking.student.email,  subject: "✅ Dispute Resolved — Refund Initiated",  html: disputeResolutionEmail(booking, "student",          note, booking.feePaid) }),
            sendMail({ to: booking.counselor.email, subject: "ℹ️ Session Dispute Outcome — MindCare", html: disputeResolutionEmail(booking, "counsellor_refund", note, booking.feePaid) }),
        ]);

    } else {
        // ── Release payout to counsellor ──────────────────────────────────────
        await Booking.findByIdAndUpdate(bookingId, {
            payoutStatus:     "released",
            payoutReleasedAt: resolvedAt,
        });
        const payment = await Payment.findOne({ bookingId: booking._id });
        if (payment) {
            payment.payoutStatus     = "released";
            payment.payoutReleasedAt = resolvedAt;
            await payment.save();
        }
        outcomeMsg = `Payout of ₹${booking.feePaid} released to counsellor ${booking.counselor.fullName}.`;

        await Promise.allSettled([
            sendMail({ to: booking.counselor.email, subject: "✅ Dispute Resolved — Payout Released",    html: disputeResolutionEmail(booking, "counsellor_paid", note, booking.feePaid) }),
            sendMail({ to: booking.student.email,   subject: "ℹ️ Session Dispute Outcome — MindCare",  html: disputeResolutionEmail(booking, "student_denied",  note, booking.feePaid) }),
        ]);
    }

    // ── Stamp resolution on booking ───────────────────────────────────────────
    // Use $set with explicit dot-notation keys to avoid overwriting existing
    // subdoc fields and to ensure resolvedAt is always a real Date object.
    await Booking.findByIdAndUpdate(bookingId, {
        $set: {
            "adminDisputeResolution.decision":   decision,
            "adminDisputeResolution.note":        note || "",
            "adminDisputeResolution.resolvedBy":  req.user._id,
            "adminDisputeResolution.resolvedAt":  resolvedAt,
        },
    });

    logAudit(req, "DISPUTE_RESOLVED", {
        resourceType: "Booking", resourceId: bookingId,
        metadata:     { decision, note, adminId: req.user._id },
    });

    res.json(new ApiResponse(200, {
        bookingId,
        decision,
        resolvedAt: resolvedAt.toISOString(),
        outcome:    outcomeMsg,
    }, outcomeMsg));
});

// ─────────────────────────────────────────────────────────────────────────────
//  EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
function disputeResolutionEmail(booking, recipient, note, amount) {
    const date = new Date(booking.date).toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" });

    const messages = {
        student: {
            title: "Dispute Resolved in Your Favour",
            color: "#10b981",
            body:  `Your dispute for the session on ${date} with <strong>${booking.counselor.fullName}</strong> has been reviewed. We have decided to issue a <strong>full refund of ₹${amount}</strong>, which will be credited to your original payment method within 5–7 business days.`,
        },
        counsellor_refund: {
            title: "Session Dispute — Outcome",
            color: "#f59e0b",
            body:  `A student filed a dispute for your session on ${date}. After review, the admin team has decided to issue a refund to the student. The session fee will not be transferred to your account. Contact support@mindcare.com with questions.`,
        },
        counsellor_paid: {
            title: "Dispute Resolved — Payout Released",
            color: "#10b981",
            body:  `A student filed a dispute for your session on ${date}. After review, the admin team has decided in your favour. A <strong>payout of ₹${amount}</strong> will be credited to your bank account within 3–5 business days.`,
        },
        student_denied: {
            title: "Session Dispute — Outcome",
            color: "#f59e0b",
            body:  `Your dispute for the session on ${date} with <strong>${booking.counselor.fullName}</strong> has been reviewed. After investigation, the admin team determined the session was delivered as expected and the fee has been released to the counsellor. Contact support@mindcare.com for further concerns.`,
        },
    };

    const m = messages[recipient];
    return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:${m.color};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:22px">⚖️ ${m.title}</h1>
  </div>
  <p style="color:#374151;line-height:1.6">${m.body}</p>
  ${note ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin:16px 0"><p style="margin:0;color:#374151"><strong>Admin note:</strong> ${note}</p></div>` : ""}
  <p style="color:#9ca3af;font-size:12px;margin-top:24px">Booking reference: ${booking._id}</p>
  <p style="color:#9ca3af;font-size:12px">Questions? <a href="mailto:support@mindcare.com" style="color:#6366f1">support@mindcare.com</a></p>
</div>`;
}
