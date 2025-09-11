import mongoose, { Schema } from "mongoose";

const answerSchema = new Schema({
  questionId: String,
  score: Number
});

const screeningSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["PHQ9", "GAD7"], required: true },
  answers: [answerSchema],
  totalScore: Number,
  severity: String,
  createdAt: { type: Date, default: Date.now }
});

export const Screening = mongoose.model("Screening", screeningSchema);

