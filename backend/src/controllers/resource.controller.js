import { asyncHandler }  from "../utils/asyncHandler.js";
import { ApiError }       from "../utils/ApiError.js";
import { ApiResponse }    from "../utils/ApiResponse.js";
import {
    Bookmark,
    ResourceProgress,
    ResourceRating,
    ResourceRecommendation,
} from "../models/resource.models.js";
import { User } from "../models/user.model.js";
import sendMail  from "../utils/mail.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET MY RESOURCE DATA (bookmarks + progress + recommendations)
//  GET /api/v1/resources/my-data
// ─────────────────────────────────────────────────────────────────────────────
export const getMyResourceData = asyncHandler(async (req, res) => {
    const uid = req.user._id;

    const [bookmarks, progress, recommendations, ratings] = await Promise.all([
        Bookmark.find({ userId: uid }).select("resourceId createdAt").lean(),
        ResourceProgress.find({ userId: uid }).select("resourceId completed completedAt").lean(),
        req.user.role === "student"
            ? ResourceRecommendation.find({ studentId: uid })
                .populate("counsellorId", "fullName avatar specialization")
                .sort({ createdAt: -1 }).lean()
            : [],
        ResourceRating.find({ userId: uid }).select("resourceId rating comment createdAt").lean(),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        bookmarks:       bookmarks.map(b => ({ resourceId: b.resourceId, savedAt: b.createdAt })),
        completedIds:    progress.filter(p => p.completed).map(p => p.resourceId),
        recommendations: recommendations.map(r => ({
            id:           r._id,
            resourceId:   r.resourceId,
            note:         r.note,
            counsellor:   r.counsellorId,
            read:         r.read,
            recommendedAt: r.createdAt,
        })),
        ratings: Object.fromEntries(ratings.map(r => [r.resourceId, { rating: r.rating, comment: r.comment }])),
    }, "Resource data fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  TOGGLE BOOKMARK
//  POST /api/v1/resources/bookmark
//  Body: { resourceId }
// ─────────────────────────────────────────────────────────────────────────────
export const toggleBookmark = asyncHandler(async (req, res) => {
    const { resourceId } = req.body;
    if (!resourceId) throw new ApiError(400, "resourceId is required");

    const existing = await Bookmark.findOne({ userId: req.user._id, resourceId });
    if (existing) {
        await existing.deleteOne();
        return res.status(200).json(new ApiResponse(200, { saved: false, resourceId }, "Bookmark removed"));
    }

    await Bookmark.create({ userId: req.user._id, resourceId });
    return res.status(201).json(new ApiResponse(201, { saved: true, resourceId }, "Bookmark saved"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  TOGGLE PROGRESS (mark complete / incomplete)
//  POST /api/v1/resources/progress
//  Body: { resourceId, completed }
// ─────────────────────────────────────────────────────────────────────────────
export const updateProgress = asyncHandler(async (req, res) => {
    const { resourceId, completed } = req.body;
    if (!resourceId) throw new ApiError(400, "resourceId is required");

    const record = await ResourceProgress.findOneAndUpdate(
        { userId: req.user._id, resourceId },
        {
            completed,
            completedAt: completed ? new Date() : null,
        },
        { upsert: true, new: true }
    );

    return res.status(200).json(new ApiResponse(200, {
        resourceId,
        completed: record.completed,
        completedAt: record.completedAt,
    }, completed ? "Marked as completed" : "Marked as incomplete"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  RATE & COMMENT ON A RESOURCE
//  POST /api/v1/resources/rate
//  Body: { resourceId, rating (1-5), comment? }
// ─────────────────────────────────────────────────────────────────────────────
export const rateResource = asyncHandler(async (req, res) => {
    const { resourceId, rating, comment } = req.body;
    if (!resourceId) throw new ApiError(400, "resourceId required");
    if (!rating || rating < 1 || rating > 5) throw new ApiError(400, "Rating must be 1–5");

    const record = await ResourceRating.findOneAndUpdate(
        { userId: req.user._id, resourceId },
        { rating: Number(rating), comment: comment?.trim() || "" },
        { upsert: true, new: true }
    );

    // Compute updated average for this resource
    const agg = await ResourceRating.aggregate([
        { $match: { resourceId } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const avg   = agg[0]?.avg   || rating;
    const count = agg[0]?.count || 1;

    return res.status(200).json(new ApiResponse(200, {
        resourceId,
        myRating: record.rating,
        myComment: record.comment,
        avgRating: Math.round(avg * 10) / 10,
        ratingCount: count,
    }, "Rating saved"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET RATINGS FOR A RESOURCE (public aggregated)
//  GET /api/v1/resources/:resourceId/ratings
// ─────────────────────────────────────────────────────────────────────────────
export const getResourceRatings = asyncHandler(async (req, res) => {
    const { resourceId } = req.params;

    const [agg, comments] = await Promise.all([
        ResourceRating.aggregate([
            { $match: { resourceId } },
            { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]),
        ResourceRating.find({ resourceId, comment: { $ne: "" } })
            .populate("userId", "fullName avatar role")
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        avgRating:   Math.round((agg[0]?.avg || 0) * 10) / 10,
        ratingCount: agg[0]?.count || 0,
        comments:    comments.map(c => ({
            id:        c._id,
            user:      c.userId,
            rating:    c.rating,
            comment:   c.comment,
            createdAt: c.createdAt,
        })),
    }, "Ratings fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  COUNSELLOR: RECOMMEND RESOURCE TO STUDENT
//  POST /api/v1/resources/recommend
//  Body: { studentId, resourceId, note? }
// ─────────────────────────────────────────────────────────────────────────────
export const recommendResource = asyncHandler(async (req, res) => {
    if (req.user.role !== "counsellor" && req.user.role !== "admin")
        throw new ApiError(403, "Only counsellors can recommend resources");

    const { studentId, resourceId, note } = req.body;
    if (!studentId || !resourceId) throw new ApiError(400, "studentId and resourceId required");

    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) throw new ApiError(404, "Student not found");

    const rec = await ResourceRecommendation.create({
        counsellorId: req.user._id,
        studentId,
        resourceId,
        note: note?.trim() || "",
    });

    // Email student
    await sendMail({
        to:      student.email,
        subject: `📚 ${req.user.fullName} recommended a resource for you`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="color:#fff;margin:0">📚 Resource Recommendation</h1>
          </div>
          <p>Hi <strong>${student.fullName}</strong>,</p>
          <p>Your counsellor <strong>${req.user.fullName}</strong> has recommended a resource for you on the MindCare platform.</p>
          ${note ? `<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:14px;margin:16px 0"><p style="margin:0;color:#6d28d9"><strong>Note from your counsellor:</strong> ${note}</p></div>` : ""}
          <div style="text-align:center;margin:24px 0">
            <a href="${process.env.FRONTEND_URL}/resources" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">View Resource →</a>
          </div>
        </div>`,
    }).catch(e => console.error("[Mail]", e.message));

    return res.status(201).json(new ApiResponse(201, { id: rec._id, resourceId, studentId }, "Resource recommended successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  MARK RECOMMENDATION AS READ
//  PATCH /api/v1/resources/recommendations/:id/read
// ─────────────────────────────────────────────────────────────────────────────
export const markRecommendationRead = asyncHandler(async (req, res) => {
    const rec = await ResourceRecommendation.findOneAndUpdate(
        { _id: req.params.id, studentId: req.user._id },
        { read: true, readAt: new Date() },
        { new: true }
    );
    if (!rec) throw new ApiError(404, "Recommendation not found");
    return res.status(200).json(new ApiResponse(200, { id: rec._id, read: true }, "Marked as read"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN: GET ALL RESOURCE ANALYTICS
//  GET /api/v1/resources/admin/analytics
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminAnalytics = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Admin only");

    const [topSaved, topCompleted, topRated, recentComments] = await Promise.all([
        Bookmark.aggregate([
            { $group: { _id: "$resourceId", count: { $sum: 1 } } },
            { $sort: { count: -1 } }, { $limit: 10 },
        ]),
        ResourceProgress.aggregate([
            { $match: { completed: true } },
            { $group: { _id: "$resourceId", count: { $sum: 1 } } },
            { $sort: { count: -1 } }, { $limit: 10 },
        ]),
        ResourceRating.aggregate([
            { $group: { _id: "$resourceId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
            { $match: { count: { $gte: 2 } } },
            { $sort: { avg: -1 } }, { $limit: 10 },
        ]),
        ResourceRating.find({ comment: { $ne: "" } })
            .populate("userId", "fullName avatar")
            .sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        topSaved, topCompleted, topRated, recentComments,
    }, "Analytics fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN: GET + MANAGE RESOURCE COMMENTS (moderate)
//  DELETE /api/v1/resources/admin/comments/:id
// ─────────────────────────────────────────────────────────────────────────────
export const adminDeleteComment = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Admin only");
    const r = await ResourceRating.findByIdAndUpdate(req.params.id, { comment: "" }, { new: true });
    if (!r) throw new ApiError(404, "Comment not found");
    return res.status(200).json(new ApiResponse(200, {}, "Comment removed"));
});
