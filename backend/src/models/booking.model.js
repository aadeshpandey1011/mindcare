import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema(
    {
        student: { type: Schema.Types.ObjectId, ref: "User", required: true },
        counselor:{ type: Schema.Types.ObjectId, ref: "User", required: true },
        date: {
            type:     Date,
            required: true,
            validate: {
                validator: function (date) {
                    if (!this.isNew) return true;  // only check on create
                    return date > new Date();
                },
                message: "Booking date cannot be in the past",
            },
        },
        timeSlot: {
            type: String, required: true,
            enum: ["09:00-10:00","10:00-11:00","11:00-12:00","14:00-15:00","15:00-16:00","16:00-17:00"],
        },
        mode:   { type: String, required: true, enum: ["in-person","online","phone"], default: "online" },
        status: { type: String, enum: ["payment_pending","pending","confirmed","session_done","completed","cancelled"], default: "payment_pending", index: true },

        notes:              { type: String, maxlength: 500,  trim: true },
        reason:             { type: String, required: true, maxlength: 200, trim: true },
        meetingLink: {
            type: String,
            validate: { validator: (link) => !link || /^https?:\/\/.+/.test(link), message: "Please provide a valid meeting link" },
        },
        cancellationReason: { type: String, maxlength: 500, trim: true },
        isConfidential:     { type: Boolean, default: true  },
        reminderSent:       { type: Boolean, default: false },
        sessionNotes:       { type: String, maxlength: 1000, trim: true },

        sessionDoneAt:       { type: Date,    default: null },
        studentConfirmedAt:  { type: Date,    default: null },
        studentConfirmed:    { type: Boolean, default: false },
        autoConfirmed:       { type: Boolean, default: false },

        reviewId:  { type: Schema.Types.ObjectId, ref: "Review",  default: null },
        paymentId: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
        feePaid:   { type: Number, default: 0 },

        payoutReleasedAt: { type: Date, default: null },
        payoutStatus: {
            type:    String,
            enum:    ["pending", "released", "failed", "not_applicable"],
            default: "not_applicable",
        },

        // ── Dispute resolution (set by admin after reviewing a dispute) ───────
        adminDisputeResolution: {
            decision:   { type: String, enum: ["refund_student", "release_counsellor"] },
            note:       { type: String, default: "" },
            resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
            resolvedAt: { type: Date },
        },
    },
    { timestamps: true }
);

bookingSchema.index({ student:  1, date: 1 });
bookingSchema.index({ counselor:1, date: 1 });
bookingSchema.index({ status:   1 });
bookingSchema.index({ date:     1, timeSlot: 1 });
bookingSchema.index({ status:   1, sessionDoneAt: 1 });
// For fast dispute queries
bookingSchema.index({ cancellationReason: 1 });

bookingSchema.index(
    { counselor: 1, date: 1, timeSlot: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ["payment_pending","pending","confirmed","session_done"] } },
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
