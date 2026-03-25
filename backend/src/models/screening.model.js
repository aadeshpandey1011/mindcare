import mongoose, { Schema } from "mongoose";

// ─── Per-question answer ─────────────────────────────────────────────────────
const answerSchema = new Schema({
    questionId: { type: String, required: true },
    score:      { type: Number, required: true, min: 0, max: 5 },
}, { _id: false });

// ─── Personalised resource reference ─────────────────────────────────────────
const resourceRefSchema = new Schema({
    resourceId: String,   // matches client-side RESOURCES[id]
    title:      String,
    type:       String,   // article | video | audio | tool
    url:        String,
    reason:     String,   // why this was recommended
}, { _id: false });

// ─── Session goal (one goal per concern area) ────────────────────────────────
const goalSchema = new Schema({
    area:         { type: String },   // e.g. "sleep", "social isolation", "energy"
    description:  { type: String },
    targetWeeks:  { type: Number },
    completed:    { type: Boolean, default: false },
    completedAt:  { type: Date },
    progress:     { type: Number, default: 0, min: 0, max: 100 }, // 0-100%
    notes:        { type: String, default: "" },
}, { _id: true });

// ─── Main Screening schema ───────────────────────────────────────────────────
const screeningSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },

    // Assessment type
    type: {
        type: String,
        enum: ["PHQ9", "GAD7", "PSS10", "WEMWBS", "AUDIT"],
        required: true,
        index: true,
    },

    // Raw answers
    answers: [answerSchema],

    // Computed
    totalScore: { type: Number, required: true },
    maxScore:   { type: Number },
    severity:   { type: String },
    percentile: { type: Number },  // 0-100, how this score compares

    // Risk flags (auto-computed from answers)
    flags: {
        suicidalIdeation:   { type: Boolean, default: false },  // PHQ9 Q9 >= 1
        severeDepression:   { type: Boolean, default: false },
        severeAnxiety:      { type: Boolean, default: false },
        severeStress:       { type: Boolean, default: false },
        highRiskAlcohol:    { type: Boolean, default: false },   // AUDIT
        requiresUrgentCare: { type: Boolean, default: false },
    },

    // Personalised recommendations generated at result time
    resultMeta: {
        recommended:          { type: String },   // primary recommendation text
        doctorWarning:        { type: String },   // doctor visit warning (always present if score > mild)
        selfCareActions:      [{ type: String }], // 3-5 concrete daily actions
        resources:            [resourceRefSchema], // personalised resource list
        copingStrategies:     [{ type: String }], // specific strategies for their score
        estimatedRecoveryTime:{ type: String },   // e.g. "4–8 weeks with consistent practice"
    },

    // Session progress plan — created alongside screening
    sessionPlan: {
        active:       { type: Boolean, default: false },
        startedAt:    { type: Date },
        targetWeeks:  { type: Number, default: 8 },
        goals:        [goalSchema],
        checkInDates: [{ type: Date }],  // when to re-screen
        overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    },

    // Compare to previous screening (trend)
    previousScreeningId: { type: Schema.Types.ObjectId, ref: "Screening", default: null },
    scoreDelta:           { type: Number, default: null },  // positive = worse, negative = improved
    trend:                { type: String, enum: ["improving", "stable", "worsening", "first"], default: "first" },

}, { timestamps: true });

screeningSchema.index({ user: 1, createdAt: -1 });
screeningSchema.index({ user: 1, type: 1, createdAt: -1 });

export const Screening = mongoose.model("Screening", screeningSchema);
