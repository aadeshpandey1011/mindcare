import mongoose, { Schema } from "mongoose";

const journalEntrySchema = new Schema({
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title:    { type: String, maxlength: 150, trim: true, default: "" },
    body:     { type: String, maxlength: 5000, trim: true, required: true },
    mood:     { type: Number, min: 1, max: 5, default: null },  // optional mood tag
    prompt:   { type: String, default: "" },  // the prompt used, if any
    tags:     [{ type: String, trim: true, maxlength: 30 }],
    isPrivate:{ type: Boolean, default: true },
}, { timestamps: true });

journalEntrySchema.index({ userId: 1, createdAt: -1 });

export const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);
