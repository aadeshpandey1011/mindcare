import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }      from "../utils/ApiError.js";
import { ApiResponse }   from "../utils/ApiResponse.js";
import { Ad }            from "../models/ad.model.js";
import { User }          from "../models/user.model.js";
import { logAudit }      from "../utils/auditLog.js";
import sendMail          from "../utils/mail.js";

// ── Plan config ───────────────────────────────────────────────────────────────
export const AD_PLANS = {
    basic: {
        name:          "Basic",
        pricePerMonth: 499,
        description:   "Appear in the forum ad rotation. Reach students who need support.",
        features:      ["Shown in forum sidebar", "Rotation with other basic ads", "Booking link included", "Session count & rating displayed"],
        highlight:     false,
    },
    standard: {
        name:          "Standard",
        pricePerMonth: 999,
        description:   "Priority placement — seen by more students every day.",
        features:      ["Priority sidebar placement", "Shown more frequently than Basic", "Verified badge on your ad", "Booking link + specialty tag"],
        highlight:     false,
    },
    premium: {
        name:          "Premium",
        pricePerMonth: 1999,
        description:   "Fixed top slot — maximum visibility every session.",
        features:      ["Fixed top slot — always visible", "⭐ Top Rated badge", "Highlighted card border", "Analytics: impressions & clicks", "Priority support"],
        highlight:     true,
    },
};

// ── Cashfree helpers ──────────────────────────────────────────────────────────
const CF_BASE = () =>
    process.env.NODE_ENV === "production"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";

const cfHeaders = () => ({
    "Content-Type":    "application/json",
    "x-api-version":   "2023-08-01",
    "x-client-id":     process.env.CASHFREE_APP_ID,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY,
});

const cfCall = async (method, path, body = null) => {
    const res  = await fetch(`${CF_BASE()}${path}`, {
        method,
        headers: cfHeaders(),
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(res.status >= 500 ? 502 : 400, data?.message || `Cashfree error ${res.status}`);
    return data;
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET FORUM ADS  (public)
//  GET /api/v1/ads/forum
// ─────────────────────────────────────────────────────────────────────────────
export const getForumAds = asyncHandler(async (req, res) => {
    const now = new Date();
    const activeAds = await Ad.find({ status: "active", endDate: { $gte: now } })
        .populate("counsellorId", "fullName avatar specialization avgRating totalReviews sessionFee isApproved")
        .lean();

    const validAds = activeAds.filter(ad => ad.counsellorId?.isApproved !== false);

    const PLAN_PRIORITY = { premium: 0, standard: 1, basic: 2 };
    validAds.sort((a, b) => {
        const pa = PLAN_PRIORITY[a.plan] ?? 3;
        const pb = PLAN_PRIORITY[b.plan] ?? 3;
        if (pa !== pb) return pa - pb;
        return a.impressions - b.impressions;
    });

    const ACCENT_MAP = {
        "Anxiety & Stress Management":       { accent: "#6366f1", light: "#eef2ff" },
        "Depression & Mood Disorders":        { accent: "#0ea5e9", light: "#f0f9ff" },
        "Trauma & PTSD":                      { accent: "#8b5cf6", light: "#f5f3ff" },
        "Relationship & Family Counselling":  { accent: "#ec4899", light: "#fdf2f8" },
        "Sleep Disorders":                    { accent: "#8b5cf6", light: "#f5f3ff" },
        "CBT (Cognitive Behavioural Therapy)":{ accent: "#0ea5e9", light: "#f0f9ff" },
        "General Counselling":                { accent: "#10b981", light: "#ecfdf5" },
    };

    const buildAdCard = (ad) => {
        const c      = ad.counsellorId;
        const colors = ACCENT_MAP[c.specialization] || { accent: "#6366f1", light: "#eef2ff" };
        const badge  = ad.plan === "premium" ? "⭐ Top Rated" : ad.plan === "standard" ? "✓ Verified" : "💬 Available";
        return {
            adId:         ad._id,
            counsellorId: c._id,
            name:         c.fullName,
            title:        c.specialization || "General Counselling",
            tagline:      ad.tagline,
            ctaText:      ad.ctaText || "Book a Session",
            specialty:    c.specialization || "Counselling",
            rating:       c.avgRating ? c.avgRating.toFixed(1) : "New",
            sessions:     c.totalReviews ? `${c.totalReviews}+` : "New",
            avatar:       c.avatar || null,
            initials:     c.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
            badge,
            plan:         ad.plan,
            highlight:    AD_PLANS[ad.plan]?.highlight || false,
            ...colors,
        };
    };

    const cards   = validAds.map(buildAdCard);
    const adIds   = validAds.slice(0, 4).map(a => a._id);
    if (adIds.length) Ad.updateMany({ _id: { $in: adIds } }, { $inc: { impressions: 1 } }).catch(() => {});

    return res.status(200).json(new ApiResponse(200, {
        leftAds:  cards.slice(0, 2),
        rightAds: cards.slice(2, 4),
    }, "Forum ads fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET AD PLANS  (public)
// ─────────────────────────────────────────────────────────────────────────────
export const getAdPlans = asyncHandler(async (_req, res) => {
    const plans = Object.entries(AD_PLANS).map(([key, val]) => ({ key, ...val }));
    return res.status(200).json(new ApiResponse(200, plans, "Ad plans fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  TRACK CLICK  (public)
// ─────────────────────────────────────────────────────────────────────────────
export const trackAdClick = asyncHandler(async (req, res) => {
    await Ad.findByIdAndUpdate(req.params.adId, { $inc: { clicks: 1 } });
    return res.status(200).json(new ApiResponse(200, {}, "Click tracked"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 1 — CREATE AD ORDER  (counsellor)
//  POST /api/v1/ads/create-order
//  Body: { plan, tagline, ctaText, durationMonths }
//
//  Creates the Ad record (status=draft) and a Cashfree payment order.
//  Returns paymentSessionId so frontend can open Cashfree checkout.
// ─────────────────────────────────────────────────────────────────────────────
export const createAdOrder = asyncHandler(async (req, res) => {
    if (req.user.role !== "counsellor")
        throw new ApiError(403, "Only counsellors can purchase ads");

    const { plan, tagline, ctaText, durationMonths = 1 } = req.body;

    if (!AD_PLANS[plan])       throw new ApiError(400, "Invalid plan");
    if (!tagline?.trim())      throw new ApiError(400, "Tagline is required");
    if (tagline.length > 120)  throw new ApiError(400, "Tagline max 120 chars");
    const months = Math.max(1, Math.min(12, Number(durationMonths)));
    const amount = AD_PLANS[plan].pricePerMonth * months;

    // Cancel any existing draft/pending ad so counsellor can re-configure
    await Ad.updateMany(
        { counsellorId: req.user._id, status: { $in: ["draft", "payment_pending"] } },
        { $set: { status: "cancelled" } }
    );

    // Create ad record in draft state (not visible yet)
    const ad = await Ad.create({
        counsellorId:   req.user._id,
        plan,
        tagline:        tagline.trim(),
        ctaText:        ctaText?.trim() || "Book a Session",
        durationMonths: months,
        amountPaid:     amount,
        status:         "draft",
    });

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
        // Dev/test mode — skip payment, go straight to pending
        ad.status         = "payment_received";
        ad.paymentOrderId = `dev_${ad._id}`;
        await ad.save();
        return res.status(201).json(new ApiResponse(201, {
            adId:    ad._id,
            devMode: true,
            message: "Dev mode: payment skipped. Ad is pending admin review.",
        }, "Ad submitted (dev mode — no payment)"));
    }

    // Create Cashfree order
    const orderId = `AD_${ad._id}_${Date.now()}`;
    const cfOrder = await cfCall("POST", "/orders", {
        order_id:       orderId,
        order_amount:   amount,
        order_currency: "INR",
        customer_details: {
            customer_id:    req.user._id.toString(),
            customer_name:  req.user.fullName,
            customer_email: req.user.email,
            customer_phone: req.user.phone || "9999999999",
        },
        order_meta: {
            return_url: `${process.env.FRONTEND_URL}/counsellor-settings?ad_order_id={order_id}&ad_id=${ad._id}`,
            notify_url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/v1/ads/webhook`,
        },
        order_note: `MindCare forum ad — ${plan} plan × ${months} month${months > 1 ? "s" : ""}`,
    });

    ad.paymentOrderId     = orderId;
    ad.cfOrderId          = cfOrder.cf_order_id;
    ad.paymentSessionId   = cfOrder.payment_session_id;
    ad.status             = "payment_pending";
    await ad.save();

    logAudit(req, "AD_ORDER_CREATED", {
        resourceType: "Ad",
        resourceId:   ad._id,
        metadata:     { plan, amount, orderId },
    });

    return res.status(201).json(new ApiResponse(201, {
        adId:             ad._id,
        paymentSessionId: cfOrder.payment_session_id,
        cfOrderId:        cfOrder.cf_order_id,
        orderId,
        amount,
        appId:            process.env.CASHFREE_APP_ID,
        environment:      process.env.NODE_ENV === "production" ? "production" : "sandbox",
    }, "Payment order created. Complete payment to submit your ad."));
});

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 2 — VERIFY AD PAYMENT  (counsellor)
//  POST /api/v1/ads/verify-payment
//  Body: { orderId, adId }
// ─────────────────────────────────────────────────────────────────────────────
export const verifyAdPayment = asyncHandler(async (req, res) => {
    const { orderId, adId } = req.body;
    if (!orderId || !adId) throw new ApiError(400, "orderId and adId required");

    const ad = await Ad.findOne({ _id: adId, counsellorId: req.user._id });
    if (!ad) throw new ApiError(404, "Ad not found");
    if (ad.status === "payment_received" || ad.status === "pending")
        return res.status(200).json(new ApiResponse(200, { adId, status: ad.status }, "Already paid"));

    const cfOrder = await cfCall("GET", `/orders/${orderId}`);

    if (cfOrder.order_status === "PAID") {
        ad.status    = "payment_received";
        ad.paidAt    = new Date();
        await ad.save();

        // Email admin about new ad request
        const admin = await User.findOne({ role: "admin" }).select("email fullName");
        if (admin) {
            await sendMail({
                to:      admin.email,
                subject: "📢 New Ad Request — Payment Received",
                html:    newAdRequestEmailHtml(req.user, ad, admin),
            }).catch(e => console.error("[Mail]", e.message));
        }

        logAudit(req, "AD_PAYMENT_SUCCESS", {
            resourceType: "Ad",
            resourceId:   ad._id,
            metadata:     { amount: ad.amountPaid, plan: ad.plan, orderId },
        });

        return res.status(200).json(new ApiResponse(200, {
            adId,
            status: "payment_received",
        }, "Payment confirmed. Your ad is under review."));
    }

    return res.status(200).json(new ApiResponse(200, {
        adId,
        status:       cfOrder.order_status,
        cfOrderStatus: cfOrder.order_status,
    }, "Payment not yet confirmed"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  CASHFREE WEBHOOK for ads
//  POST /api/v1/ads/webhook
// ─────────────────────────────────────────────────────────────────────────────
export const adWebhook = asyncHandler(async (req, res) => {
    const event = req.body.type;
    const data  = req.body.data;

    if (event === "PAYMENT_SUCCESS_WEBHOOK") {
        const orderId = data?.order?.order_id;
        if (orderId?.startsWith("AD_")) {
            const ad = await Ad.findOne({ paymentOrderId: orderId });
            if (ad && ad.status === "payment_pending") {
                ad.status = "payment_received";
                ad.paidAt = new Date();
                await ad.save();

                const counsellor = await User.findById(ad.counsellorId).select("fullName email");
                const admin      = await User.findOne({ role: "admin" }).select("email fullName");
                if (admin && counsellor) {
                    await sendMail({
                        to:      admin.email,
                        subject: "📢 New Ad Request — Payment Received",
                        html:    newAdRequestEmailHtml(counsellor, ad, admin),
                    }).catch(() => {});
                }
            }
        }
    }

    if (event === "PAYMENT_FAILED_WEBHOOK") {
        const orderId = data?.order?.order_id;
        if (orderId?.startsWith("AD_")) {
            await Ad.findOneAndUpdate({ paymentOrderId: orderId }, { status: "cancelled" });
        }
    }

    res.status(200).json({ received: true });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET MY AD  (counsellor)
//  GET /api/v1/ads/my-ad
// ─────────────────────────────────────────────────────────────────────────────
export const getMyAd = asyncHandler(async (req, res) => {
    if (req.user.role !== "counsellor") throw new ApiError(403, "Counsellors only");

    const ad = await Ad.findOne({
        counsellorId: req.user._id,
        status:       { $in: ["payment_received", "active", "paused", "rejected", "payment_pending"] },
    }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, ad || null, "My ad fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  TOGGLE MY AD  (counsellor pause/resume)
// ─────────────────────────────────────────────────────────────────────────────
export const toggleMyAd = asyncHandler(async (req, res) => {
    if (req.user.role !== "counsellor") throw new ApiError(403, "Counsellors only");
    const ad = await Ad.findOne({ counsellorId: req.user._id, status: { $in: ["active", "paused"] } });
    if (!ad) throw new ApiError(404, "No active or paused ad found");
    ad.status = ad.status === "active" ? "paused" : "active";
    await ad.save();
    return res.status(200).json(new ApiResponse(200, ad, ad.status === "active" ? "Ad resumed" : "Ad paused"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN: GET ALL ADS
//  GET /api/v1/ads/admin/all?status=payment_received
// ─────────────────────────────────────────────────────────────────────────────
export const adminGetAllAds = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Admin only");

    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    else        filter.status = { $nin: ["draft", "cancelled"] }; // exclude junk

    const skip = (page - 1) * limit;
    const [ads, total] = await Promise.all([
        Ad.find(filter)
            .populate("counsellorId", "fullName email avatar specialization avgRating totalReviews")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Ad.countDocuments(filter),
    ]);

    // Count pending-review ads for badge
    const pendingCount = await Ad.countDocuments({ status: "payment_received" });

    return res.status(200).json(new ApiResponse(200, {
        ads, pendingCount,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
    }, "Ads fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN: APPROVE or REJECT AD
//  PATCH /api/v1/ads/admin/:adId/review
//  Body: { action: "approve"|"reject", note? }
//
//  APPROVE → status: active, sets startDate/endDate, emails counsellor
//  REJECT  → status: rejected, triggers Cashfree refund, emails counsellor
// ─────────────────────────────────────────────────────────────────────────────
export const adminReviewAd = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Admin only");

    const { adId }         = req.params;
    const { action, note } = req.body;
    if (!["approve", "reject"].includes(action)) throw new ApiError(400, "action must be approve or reject");

    const ad = await Ad.findById(adId).populate("counsellorId", "fullName email");
    if (!ad) throw new ApiError(404, "Ad not found");

    // Must be in payment_received state to review
    if (ad.status !== "payment_received")
        throw new ApiError(400, `Ad is in '${ad.status}' state — can only review payment_received ads`);

    if (action === "approve") {
        const now    = new Date();
        ad.status    = "active";
        ad.startDate = now;
        ad.endDate   = new Date(now.getTime() + ad.durationMonths * 30 * 24 * 3600 * 1000);
        ad.adminNote = note || "";
        await ad.save();

        await sendMail({
            to:      ad.counsellorId.email,
            subject: "✅ Your Forum Ad is Live — MindCare",
            html:    adApprovedEmailHtml(ad.counsellorId, ad),
        }).catch(e => console.error("[Mail]", e.message));

        logAudit(req, "AD_APPROVED", {
            resourceType: "Ad",
            resourceId:   ad._id,
            metadata:     { plan: ad.plan, counsellorId: ad.counsellorId._id },
        });

        return res.status(200).json(new ApiResponse(200, ad, "Ad approved and is now live on the forum"));
    }

    // ── REJECT → refund via Cashfree ─────────────────────────────────────────
    ad.status    = "rejected";
    ad.adminNote = note || "Does not meet our advertising guidelines.";
    await ad.save();

    // Attempt refund
    let refundInitiated = false;
    if (ad.paymentOrderId && !ad.paymentOrderId.startsWith("dev_")) {
        try {
            const refundId = `RF_AD_${adId}_${Date.now()}`;
            await cfCall("POST", `/orders/${ad.paymentOrderId}/refunds`, {
                refund_amount: ad.amountPaid,
                refund_id:     refundId,
                refund_note:   `Ad rejected: ${note || "Does not meet guidelines"}`,
            });
            ad.refundId  = refundId;
            ad.refundedAt = new Date();
            await ad.save();
            refundInitiated = true;

            logAudit(req, "AD_REFUND_INITIATED", {
                resourceType: "Ad",
                resourceId:   ad._id,
                metadata:     { refundId, amount: ad.amountPaid },
            });
        } catch (err) {
            console.error("[Ad Refund] Failed:", err.message);
        }
    }

    await sendMail({
        to:      ad.counsellorId.email,
        subject: "❌ Your Forum Ad Request — Update",
        html:    adRejectedEmailHtml(ad.counsellorId, ad, note, refundInitiated),
    }).catch(e => console.error("[Mail]", e.message));

    logAudit(req, "AD_REJECTED", {
        resourceType: "Ad",
        resourceId:   ad._id,
        metadata:     { reason: note, counsellorId: ad.counsellorId._id, refundInitiated },
    });

    return res.status(200).json(new ApiResponse(200, ad,
        `Ad rejected. ${refundInitiated ? `Refund of ₹${ad.amountPaid} initiated.` : "Manual refund required."}`));
});

// ─────────────────────────────────────────────────────────────────────────────
//  BANK DETAILS  (handled in bank.controller.js — just re-export route)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
//  EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
const newAdRequestEmailHtml = (counsellor, ad, admin) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">📢 New Ad Request</h1>
    <p style="color:#e0e7ff;margin:8px 0 0">Payment received — awaiting your review</p>
  </div>
  <p>Hi <strong>${admin.fullName}</strong>,</p>
  <p><strong>${counsellor.fullName}</strong> has submitted a forum ad request and payment has been received.</p>
  <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin:20px 0">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:5px 0"><strong>Counsellor:</strong></td><td>${counsellor.fullName} (${counsellor.email})</td></tr>
      <tr><td style="padding:5px 0"><strong>Plan:</strong></td><td style="text-transform:capitalize">${ad.plan}</td></tr>
      <tr><td style="padding:5px 0"><strong>Duration:</strong></td><td>${ad.durationMonths} month${ad.durationMonths > 1 ? 's' : ''}</td></tr>
      <tr><td style="padding:5px 0"><strong>Amount Paid:</strong></td><td style="color:#16a34a;font-weight:bold">₹${ad.amountPaid}</td></tr>
      <tr><td style="padding:5px 0"><strong>Tagline:</strong></td><td>"${ad.tagline}"</td></tr>
    </table>
  </div>
  <div style="text-align:center;margin:24px 0">
    <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Review in Admin Dashboard →</a>
  </div>
  <p style="color:#9ca3af;font-size:12px">If rejected, ₹${ad.amountPaid} will be automatically refunded to the counsellor.</p>
</div>`;

const adApprovedEmailHtml = (counsellor, ad) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">✅ Your Ad is Live!</h1>
  </div>
  <p>Hi <strong>${counsellor.fullName}</strong>,</p>
  <p>Great news! Your forum advertisement has been approved and is now visible to students on the Peer Support Forum.</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0">
    <p><strong>Plan:</strong> ${ad.plan.charAt(0).toUpperCase() + ad.plan.slice(1)}</p>
    <p><strong>Active until:</strong> ${new Date(ad.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>
    <p><strong>Tagline:</strong> "${ad.tagline}"</p>
  </div>
  <a href="${process.env.FRONTEND_URL}/counsellor-settings" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Ad Analytics →</a>
</div>`;

const adRejectedEmailHtml = (counsellor, ad, reason, refundInitiated) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0">Ad Request Update</h1>
  </div>
  <p>Hi <strong>${counsellor.fullName}</strong>,</p>
  <p>Unfortunately your forum advertisement request could not be approved at this time.</p>
  ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin:16px 0"><p style="margin:0;color:#991b1b"><strong>Reason:</strong> ${reason}</p></div>` : ""}
  <div style="background:${refundInitiated ? '#f0fdf4' : '#fef3c7'};border:1px solid ${refundInitiated ? '#bbf7d0' : '#fde68a'};border-radius:8px;padding:14px;margin:16px 0">
    <p style="margin:0;color:${refundInitiated ? '#16a34a' : '#92400e'}">
      ${refundInitiated
        ? `💰 A full refund of <strong>₹${ad.amountPaid}</strong> has been initiated and will be credited to your account within 5–7 business days.`
        : `💰 Our team will process your refund of <strong>₹${ad.amountPaid}</strong> manually within 3 business days.`}
    </p>
  </div>
  <p>You are welcome to revise your ad and resubmit.</p>
  <a href="${process.env.FRONTEND_URL}/counsellor-settings" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Submit New Ad →</a>
</div>`;
