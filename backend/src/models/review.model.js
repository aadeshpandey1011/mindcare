import mongoose, { Schema } from "mongoose";

/**
 * Review — one per completed booking.
 * Created when student confirms session completion.
 *
 * A review can only be submitted once per booking.
 * Rating is 1–5 stars.
 */
const reviewSchema = new Schema(
    {
        bookingId: {
            type:     Schema.Types.ObjectId,
            ref:      "Booking",
            required: true,
            unique:   true,   // one review per booking
            index:    true,
        },
        studentId: {
            type:     Schema.Types.ObjectId,
            ref:      "User",
            required: true,
            index:    true,
        },
        counsellorId: {
            type:     Schema.Types.ObjectId,
            ref:      "User",
            required: true,
            index:    true,
        },

        // ── Review content ────────────────────────────────────────────────────
        rating: {
            type:     Number,
            required: true,
            min:      1,
            max:      5,
        },
        comment: {
            type:      String,
            maxlength: 500,
            trim:      true,
            default:   "",
        },

        // Whether review is publicly visible on counsellor profile
        isPublic: {
            type:    Boolean,
            default: true,
        },

        // Admin can flag abusive reviews
        isFlagged: {
            type:    Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// ── Index for fast counsellor rating aggregation ──────────────────────────────
reviewSchema.index({ counsellorId: 1, createdAt: -1 });
reviewSchema.index({ studentId: 1, createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);
