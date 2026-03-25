import { Router }   from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { ApiError }     from "../utils/ApiError.js";
import { Mood }         from "../models/mood.model.js";
import { Onboarding }   from "../models/onboarding.model.js";
import { JournalEntry } from "../models/journal.model.js";

const router = Router();
router.use(verifyJWT);

// ── Mood ─────────────────────────────────────────────────────────────────────

// POST /api/v1/wellness/mood
router.post("/mood", asyncHandler(async (req, res) => {
    const { mood, note } = req.body;
    if (!mood || mood < 1 || mood > 5) throw new ApiError(400, "Mood must be 1–5");

    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    const entry = await Mood.findOneAndUpdate(
        { userId: req.user._id, date: today },
        { mood: Number(mood), note: note?.trim() || "" },
        { upsert: true, new: true }
    );

    return res.status(200).json(new ApiResponse(200, entry, "Mood logged"));
}));

// GET /api/v1/wellness/mood — last 30 days
router.get("/mood", asyncHandler(async (req, res) => {
    const moods = await Mood.find({ userId: req.user._id })
        .sort({ date: -1 })
        .limit(30)
        .lean();

    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = moods.find(m => m.date === today);

    return res.json(new ApiResponse(200, { moods, todayMood: todayEntry?.mood ?? null }, "Mood history"));
}));

// ── Onboarding ────────────────────────────────────────────────────────────────

// GET /api/v1/wellness/onboarding — returns null if not completed
router.get("/onboarding", asyncHandler(async (req, res) => {
    const ob = await Onboarding.findOne({ userId: req.user._id }).lean();
    return res.json(new ApiResponse(200, ob || null, "Onboarding status"));
}));

// POST /api/v1/wellness/onboarding
router.post("/onboarding", asyncHandler(async (req, res) => {
    const { primaryConcern, severity, previousHelp, goals, preferredSupport } = req.body;

    const ob = await Onboarding.findOneAndUpdate(
        { userId: req.user._id },
        {
            primaryConcern: primaryConcern || "",
            severity:       severity       || "",
            previousHelp:   !!previousHelp,
            goals:          Array.isArray(goals) ? goals : [],
            preferredSupport: preferredSupport || "",
            completed:      true,
            completedAt:    new Date(),
        },
        { upsert: true, new: true }
    );

    return res.status(200).json(new ApiResponse(200, ob, "Onboarding saved"));
}));

// ── Journal ───────────────────────────────────────────────────────────────────

// GET /api/v1/wellness/journal
router.get("/journal", asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
        JournalEntry.find({ userId: req.user._id })
            .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        JournalEntry.countDocuments({ userId: req.user._id }),
    ]);
    return res.json(new ApiResponse(200, {
        entries,
        pagination: { page: Number(page), total, totalPages: Math.ceil(total / limit) },
    }, "Journal entries"));
}));

// POST /api/v1/wellness/journal
router.post("/journal", asyncHandler(async (req, res) => {
    const { title, body, mood, prompt, tags } = req.body;
    if (!body?.trim()) throw new ApiError(400, "Body is required");

    const entry = await JournalEntry.create({
        userId: req.user._id,
        title:  title?.trim() || "",
        body:   body.trim(),
        mood:   mood ? Number(mood) : null,
        prompt: prompt || "",
        tags:   Array.isArray(tags) ? tags.slice(0, 5) : [],
    });

    return res.status(201).json(new ApiResponse(201, entry, "Entry saved"));
}));

// PATCH /api/v1/wellness/journal/:id
router.patch("/journal/:id", asyncHandler(async (req, res) => {
    const { title, body, mood, tags } = req.body;
    const entry = await JournalEntry.findOne({ _id: req.params.id, userId: req.user._id });
    if (!entry) throw new ApiError(404, "Entry not found");

    if (title !== undefined) entry.title = title.trim();
    if (body  !== undefined) entry.body  = body.trim();
    if (mood  !== undefined) entry.mood  = mood ? Number(mood) : null;
    if (tags  !== undefined) entry.tags  = tags.slice(0, 5);

    await entry.save();
    return res.json(new ApiResponse(200, entry, "Entry updated"));
}));

// DELETE /api/v1/wellness/journal/:id
router.delete("/journal/:id", asyncHandler(async (req, res) => {
    await JournalEntry.deleteOne({ _id: req.params.id, userId: req.user._id });
    return res.json(new ApiResponse(200, {}, "Entry deleted"));
}));

export default router;
