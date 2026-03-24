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
//  GET PENDING COUNSELLORS  (existing — keep working)
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ role: "counsellor", isApproved: false })
        .select("fullName email username avatar specialization institution status createdAt role isApproved");
    res.json(new ApiResponse(200, { users }, "Pending counsellors fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  APPROVE COUNSELLOR  (existing — keep working)
// ─────────────────────────────────────────────────────────────────────────────
export const approveUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isApproved: true, status: "approved" }, { new: true });
    if (!user) throw new ApiError(404, "User not found");
    res.json(new ApiResponse(200, { user }, "User approved successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  REJECT COUNSELLOR
//  PUT /api/v1/admin/reject/:id
// ─────────────────────────────────────────────────────────────────────────────
export const rejectUser = asyncHandler(async (req, res) => {
    const { id }    = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
        id,
        { isApproved: false, status: "rejected" },
        { new: true }
    );
    if (!user) throw new ApiError(404, "User not found");

    // Email the counsellor
    await sendMail({
        to:      user.email,
        subject: "Your MindCare Application Update",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#ef4444">Application Update</h2>
          <p>Hi <strong>${user.fullName}</strong>,</p>
          <p>After review, we are unable to approve your counsellor application at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>You may reapply after addressing the concerns. Contact support@mindcare.com for more information.</p>
        </div>`,
    }).catch(e => console.error("[Mail]", e.message));

    logAudit(req, "COUNSELLOR_REJECTED", {
        resourceType: "User", resourceId: id,
        metadata: { reason },
    });

    res.json(new ApiResponse(200, { user }, "User rejected"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET ALL USERS  (with filters, pagination, search)
//  GET /api/v1/admin/users?role=&search=&page=&limit=&status=
// ─────────────────────────────────────────────────────────────────────────────
export const getAllUsers = asyncHandler(async (req, res) => {
    const {
        role, search, status,
        page  = 1,
        limit = 20,
        sortBy    = "createdAt",
        sortOrder = "desc",
    } = req.query;

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
            .sort(sort)
            .skip(skip)
            .limit(Number(limit)),
        User.countDocuments(filter),
    ]);

    // Quick stats
    const [totalStudents, totalCounsellors, totalAdmins, pendingApprovals] = await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "counsellor" }),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "counsellor", isApproved: false }),
    ]);

    res.json(new ApiResponse(200, {
        users,
        pagination: {
            page: Number(page), limit: Number(limit), total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
        stats: { totalStudents, totalCounsellors, totalAdmins, pendingApprovals },
    }, "Users fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET SINGLE USER DETAIL
//  GET /api/v1/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getUserDetail = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select("-password -refreshToken -govtId.otpHash -govtId.otpExpiry");
    if (!user) throw new ApiError(404, "User not found");

    // Fetch their booking count + payment total
    const [bookingCount, paymentAgg] = await Promise.all([
        Booking.countDocuments({
            $or: [{ student: user._id }, { counselor: user._id }],
        }),
        Payment.aggregate([
            { $match: { userId: user._id, status: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
    ]);

    const paymentSummary = paymentAgg[0] || { total: 0, count: 0 };

    res.json(new ApiResponse(200, {
        user,
        activity: {
            totalBookings: bookingCount,
            totalPaid:     paymentSummary.total,
            paymentCount:  paymentSummary.count,
        },
    }, "User detail fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  TERMINATE USER (soft delete — disables account)
//  DELETE /api/v1/admin/users/:id/terminate
//  Body: { reason }
//
//  Sets isApproved=false, status='rejected'.
//  Cancels all their upcoming bookings.
//  Sends notification email.
//  Does NOT hard-delete (preserve audit trail).
// ─────────────────────────────────────────────────────────────────────────────
export const terminateUser = asyncHandler(async (req, res) => {
    const { id }    = req.params;
    const { reason } = req.body;

    if (id === req.user._id.toString())
        throw new ApiError(400, "You cannot terminate your own account");

    const user = await User.findById(id);
    if (!user) throw new ApiError(404, "User not found");
    if (user.role === "admin")
        throw new ApiError(403, "Admin accounts cannot be terminated this way");

    // Disable account
    await User.findByIdAndUpdate(id, {
        isApproved:      false,
        status:          "rejected",
        isBannedFromForum: true,
        refreshToken:    null,
    });

    // Cancel all upcoming active bookings
    const cancelledCount = await Booking.updateMany(
        {
            $or: [{ student: id }, { counselor: id }],
            status: { $in: ["pending", "confirmed", "payment_pending"] },
        },
        {
            $set: {
                status:             "cancelled",
                cancellationReason: `Account terminated by admin${reason ? `: ${reason}` : ""}`,
            },
        }
    );

    logAudit(req, "USER_TERMINATED", {
        resourceType: "User",
        resourceId:   id,
        metadata:     { reason, role: user.role, cancelledBookings: cancelledCount.modifiedCount },
    });

    // Email the terminated user
    await sendMail({
        to:      user.email,
        subject: "Your MindCare Account Has Been Suspended",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#ef4444;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
            <h1 style="color:#fff;margin:0">Account Suspended</h1>
          </div>
          <p>Hi <strong>${user.fullName}</strong>,</p>
          <p>Your MindCare account has been suspended by an administrator.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>If you believe this is a mistake, please contact us at <a href="mailto:support@mindcare.com">support@mindcare.com</a>.</p>
          ${cancelledCount.modifiedCount > 0 ? `<p>⚠️ ${cancelledCount.modifiedCount} upcoming booking(s) have been cancelled.</p>` : ""}
        </div>`,
    }).catch(e => console.error("[Mail]", e.message));

    res.json(new ApiResponse(200, {
        userId:            id,
        cancelledBookings: cancelledCount.modifiedCount,
    }, `Account terminated. ${cancelledCount.modifiedCount} booking(s) cancelled.`));
});

// ─────────────────────────────────────────────────────────────────────────────
//  RESTORE USER (re-activate a terminated account)
//  PUT /api/v1/admin/users/:id/restore
// ─────────────────────────────────────────────────────────────────────────────
export const restoreUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    await User.findByIdAndUpdate(req.params.id, {
        isApproved:        user.role !== "counsellor" ? true : user.isApproved,
        status:            "approved",
        isBannedFromForum: false,
    });

    logAudit(req, "USER_RESTORED", {
        resourceType: "User", resourceId: req.params.id,
    });

    await sendMail({
        to:      user.email,
        subject: "Your MindCare Account Has Been Restored",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#10b981">Account Restored</h2>
          <p>Hi <strong>${user.fullName}</strong>,</p>
          <p>Your MindCare account has been restored. You can now log in as normal.</p>
          <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Login →</a>
        </div>`,
    }).catch(e => console.error("[Mail]", e.message));

    res.json(new ApiResponse(200, {}, "Account restored successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET ALL PAYMENT LOGS (admin)
//  GET /api/v1/admin/payments?page=&limit=&status=&search=
// ─────────────────────────────────────────────────────────────────────────────
export const getAllPayments = asyncHandler(async (req, res) => {
    const {
        page   = 1,
        limit  = 20,
        status,
        search,
        dateFrom,
        dateTo,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }

    // If searching by user name/email — find matching user IDs first
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
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Payment.countDocuments(filter),
        Payment.aggregate([
            { $group: {
                _id:          null,
                totalCollected: { $sum: { $cond: [{ $eq: ["$status","success"]  }, "$amount", 0] } },
                totalRefunded:  { $sum: { $cond: [{ $eq: ["$status","refunded"] }, "$amount", 0] } },
                successCount:   { $sum: { $cond: [{ $eq: ["$status","success"]  }, 1, 0] } },
                refundCount:    { $sum: { $cond: [{ $eq: ["$status","refunded"] }, 1, 0] } },
                failedCount:    { $sum: { $cond: [{ $eq: ["$status","failed"]   }, 1, 0] } },
            }},
        ]),
    ]);

    const summary = summaryAgg[0] || { totalCollected: 0, totalRefunded: 0, successCount: 0, refundCount: 0, failedCount: 0 };

    res.json(new ApiResponse(200, {
        payments,
        summary,
        pagination: {
            page: Number(page), limit: Number(limit), total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    }, "Payment logs fetched"));
});
