import mongoose, { Schema } from "mongoose";

/**
 * Ad status flow:
 *
 * draft → payment_pending → payment_received → active → (paused ↔ active) → expired
 *                                           ↘ rejected (refund triggered)
 *
 * draft:            counsellor configured ad, not yet paid
 * payment_pending:  Cashfree order created, waiting for payment
 * payment_received: payment confirmed, waiting for admin review
 * active:           admin approved, showing on forum
 * paused:           counsellor paused it temporarily
 * expired:          plan period ended
 * rejected:         admin rejected (refund issued)
 * cancelled:        superseded by new order or counsellor cancelled before payment
 */
const adSchema = new Schema(
    {
        counsellorId: {
            type:     Schema.Types.ObjectId,
            ref:      "User",
            required: true,
            index:    true,
        },

        // ── Plan ─────────────────────────────────────────────────────────────
        plan: {
            type:     String,
            enum:     ["basic", "standard", "premium"],
            required: true,
        },

        // ── Ad copy ───────────────────────────────────────────────────────────
        tagline: {
            type:      String,
            required:  true,
            maxlength: 120,
            trim:      true,
        },
        ctaText: {
            type:     String,
            default:  "Book a Session",
            maxlength: 30,
            trim:     true,
        },

        // ── Status ────────────────────────────────────────────────────────────
        status: {
            type:    String,
            enum:    ["draft", "payment_pending", "payment_received", "active", "paused", "expired", "rejected", "cancelled"],
            default: "draft",
            index:   true,
        },
        adminNote: { type: String, default: "" },

        // ── Billing ───────────────────────────────────────────────────────────
        durationMonths: { type: Number, default: 1, min: 1, max: 12 },
        amountPaid:     { type: Number, default: 0 },  // in RUPEES

        startDate:  { type: Date, default: null },
        endDate:    { type: Date, default: null },
        paidAt:     { type: Date, default: null },

        // ── Cashfree payment identifiers ──────────────────────────────────────
        paymentOrderId:   { type: String, default: null },   // our order_id
        cfOrderId:        { type: String, default: null },   // Cashfree cf_order_id
        paymentSessionId: { type: String, default: null, select: false }, // Cashfree session

        // ── Refund (if rejected) ──────────────────────────────────────────────
        refundId:   { type: String, default: null },
        refundedAt: { type: Date,   default: null },

        // ── Analytics ─────────────────────────────────────────────────────────
        impressions: { type: Number, default: 0 },
        clicks:      { type: Number, default: 0 },
    },
    { timestamps: true }
);

adSchema.index({ status: 1, endDate: 1 });
adSchema.index({ counsellorId: 1, status: 1 });
adSchema.index({ paymentOrderId: 1 });

export const Ad = mongoose.model("Ad", adSchema);
