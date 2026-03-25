import mongoose, { Schema } from "mongoose";

// ─── Resource Bookmark ────────────────────────────────────────────────────────
const bookmarkSchema = new Schema({
    userId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resourceId: { type: String, required: true },   // client-side ID from RESOURCES array
}, { timestamps: true });

bookmarkSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

// ─── Resource Progress (read/watched/completed) ──────────────────────────────
const progressSchema = new Schema({
    userId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resourceId: { type: String, required: true },
    completed:  { type: Boolean, default: false },
    completedAt:{ type: Date },
}, { timestamps: true });

progressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export const ResourceProgress = mongoose.model("ResourceProgress", progressSchema);

// ─── Resource Rating + Comment ────────────────────────────────────────────────
const resourceRatingSchema = new Schema({
    userId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resourceId: { type: String, required: true },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    comment:    { type: String, maxlength: 500, trim: true, default: "" },
}, { timestamps: true });

resourceRatingSchema.index({ userId: 1, resourceId: 1 }, { unique: true });
resourceRatingSchema.index({ resourceId: 1 });

export const ResourceRating = mongoose.model("ResourceRating", resourceRatingSchema);

// ─── Counsellor Recommendation ────────────────────────────────────────────────
// Counsellor pins a resource to a student's profile after a session
const recommendationSchema = new Schema({
    counsellorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resourceId:   { type: String, required: true },
    note:         { type: String, maxlength: 300, trim: true, default: "" },
    read:         { type: Boolean, default: false },
    readAt:       { type: Date },
}, { timestamps: true });

recommendationSchema.index({ studentId: 1, createdAt: -1 });

export const ResourceRecommendation = mongoose.model("ResourceRecommendation", recommendationSchema);
