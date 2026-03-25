import mongoose, { Schema } from "mongoose";

const moodSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mood:   { type: Number, required: true, min: 1, max: 5 }, // 1=awful 2=bad 3=ok 4=good 5=great
    note:   { type: String, maxlength: 200, trim: true, default: "" },
    date:   { type: String, required: true }, // "YYYY-MM-DD" — one per day
}, { timestamps: true });

// One entry per user per day
moodSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Mood = mongoose.model("Mood", moodSchema);
