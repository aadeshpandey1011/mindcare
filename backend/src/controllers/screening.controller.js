import {Screening} from "../models/screening.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";

/**
 * severity mapping for PHQ-9 and GAD-7 is standard:
 * PHQ-9: 0-4 none, 5-9 mild, 10-14 moderate, 15-19 mod severe, 20-27 severe
 * GAD-7: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe
 */
function calcSeverity(type, score) {
  if (type === "PHQ9") {
    if (score <= 4) return "None";
    if (score <= 9) return "Mild";
    if (score <= 14) return "Moderate";
    if (score <= 19) return "Moderately severe";
    return "Severe";
  } else if (type === "GAD7") {
    if (score <= 4) return "Minimal";
    if (score <= 9) return "Mild";
    if (score <= 14) return "Moderate";
    return "Severe";
  } else {
    return "Unknown";
  }
}

export const createScreening = asyncHandler(async (req, res) => {
  const { type, answers } = req.body;
  if (!type || !answers || !Array.isArray(answers)) {
    throw new ApiError("Invalid payload: provide type and answers array", 400);
  }

  // validate answers scores 0..3
  let total = 0;
  for (const a of answers) {
    if (typeof a.score !== "number" || a.score < 0 || a.score > 3) {
      throw new ApiError("Each answer must have a numeric score 0-3", 400);
    }
    total += a.score;
  }

  const severity = calcSeverity(type, total);
  const screening = await Screening.create({
    user: req.user ? req.user._id : undefined,
    type,
    answers,
    totalScore: total,
    severity,
    resultMeta: {
      recommended:
        type === "PHQ9" && total >= 10
          ? "Consider contacting a counselor"
          : "Self-care recommended",
    },
  });

  res.status(201).json({
    success: true,
    data: {
      id: screening._id,
      totalScore: screening.totalScore,
      severity: screening.severity,
      resultMeta: screening.resultMeta,
    },
  });
});

export const getMyScreenings = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError("Not authenticated", 401);
  const items = await Screening.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ success: true, data: items });
});

export const getScreening = asyncHandler(async (req, res) => {
  const screening = await Screening.findById(req.params.id).populate(
    "user",
    "fullName email role"
  );
  if (!screening) throw new ApiError("Not found", 404);
  res.json({ success: true, data: screening });
});

