import mongoose, { Schema } from "mongoose";

/**
 * Payment — one record per Cashfree transaction.
 *
 * Status flow:
 *   pending → success  (payment captured by Cashfree)
 *          → failed    (declined / timeout / expired)
 *   success → refunded (refund issued via Cashfree)
 *
 * NOTE: payoutStatus on the Booking model tracks whether the counsellor
 *       was paid out.  This Payment record only tracks the student→MindCare
 *       Cashfree transaction.
 */
const paymentSchema = new Schema(
    {
        // ── Links ─────────────────────────────────────────────────────────────
        bookingId: {
            type:     Schema.Types.ObjectId,
            ref:      "Booking",
            required: true,
            index:    true,
        },
        userId: {
            type:     Schema.Types.ObjectId,
            ref:      "User",
            required: true,
            index:    true,
        },
        counsellorId: {
            type:     Schema.Types.ObjectId,
            ref:      "User",
            required: true,
        },

        // ── Cashfree identifiers ──────────────────────────────────────────────
        cf_order_id: {
            type:     String,
            required: true,
            unique:   true,
            index:    true,
        },
        cf_payment_id: {
            type:    String,
            default: null,
        },
        order_id: {
            type:     String,
            required: true,
            unique:   true,
        },

        // ── Amount (in RUPEES — Cashfree does NOT use paise) ─────────────────
        amount: {
            type:     Number,
            required: true,
            min:      0,  // allow 0 for free sessions
        },
        currency: {
            type:    String,
            default: "INR",
        },

        // ── Status ────────────────────────────────────────────────────────────
        status: {
            type:    String,
            enum:    ["pending", "success", "failed", "refunded"],
            default: "pending",
            index:   true,
        },

        // ── Payment details (filled after capture) ────────────────────────────
        paymentMethod: { type: String, default: null },  // "upi", "card", "netbanking", "free"
        paymentBank:   { type: String, default: null },
        paymentVpa:    { type: String, default: null },

        // ── Failure ───────────────────────────────────────────────────────────
        failureReason: { type: String, default: null },
        failureCode:   { type: String, default: null },

        // ── Refund ────────────────────────────────────────────────────────────
        refundId:     { type: String, default: null },
        refundAmount: { type: Number, default: null },
        refundReason: { type: String, default: null },
        refundedAt:   { type: Date,   default: null },

        // ── Idempotency ───────────────────────────────────────────────────────
        idempotencyKey: {
            type:   String,
            unique: true,
            sparse: true,
        },
    },
    { timestamps: true }
);

paymentSchema.index({ userId:   1, createdAt: -1 });
paymentSchema.index({ status:   1, createdAt: -1 });
paymentSchema.index({ bookingId: 1, status: 1 });

paymentSchema.virtual("amountRupees").get(function () {
    return this.amount.toFixed(2);
});
paymentSchema.set("toJSON",   { virtuals: true });
paymentSchema.set("toObject", { virtuals: true });

export const Payment = mongoose.model("Payment", paymentSchema);

// ─────────────────────────────────────────────────────────────────────────────
//  AUTO-DROP stale Razorpay indexes on first use
//  The old integration left unique indexes on `razorpay_order_id` and
//  `razorpay_payment_id` which collide on null values for every new insert.
//  This silently drops them if they still exist.
// ─────────────────────────────────────────────────────────────────────────────
export const dropStalePaymentIndexes = async () => {
    try {
        const col     = mongoose.connection.db?.collection("payments");
        if (!col) return;
        const indexes = await col.indexes();
        const stale   = ["razorpay_order_id_1", "razorpay_payment_id_1"];
        for (const name of stale) {
            if (indexes.find(i => i.name === name)) {
                await col.dropIndex(name);
                console.log(`[DB] ✅ Dropped stale index: ${name}`);
            }
        }
    } catch (err) {
        console.warn("[DB] Could not drop stale indexes (non-fatal):", err.message);
    }
};
