import mongoose, { Schema } from "mongoose";

// One onboarding record per user — created at first login
const onboardingSchema = new Schema({
    userId:        { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    completed:     { type: Boolean, default: false },
    completedAt:   { type: Date },

    // Answers
    primaryConcern:{ type: String, enum: ["anxiety","depression","stress","sleep","relationships","self-esteem","other",""], default: "" },
    severity:      { type: String, enum: ["mild","moderate","severe","not_sure",""], default: "" },
    previousHelp:  { type: Boolean, default: false },
    goals:         [{ type: String }], // e.g. ["feel_better","build_skills","book_session"]
    preferredSupport: { type: String, enum: ["self_help","ai_chat","counsellor","combination",""], default: "" },
}, { timestamps: true });

export const Onboarding = mongoose.model("Onboarding", onboardingSchema);
