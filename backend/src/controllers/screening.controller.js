import { Screening }   from "../models/screening.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }     from "../utils/ApiError.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import sendMail         from "../utils/mail.js";
import { User }         from "../models/user.model.js";

// ─────────────────────────────────────────────────────────────────────────────
//  SCORING TABLES
// ─────────────────────────────────────────────────────────────────────────────
const SCORE_TABLES = {
    PHQ9: {
        maxScore: 27,
        levels: [
            { max: 4,  label: "None–Minimal",      color: "green",  urgency: 0 },
            { max: 9,  label: "Mild",               color: "yellow", urgency: 1 },
            { max: 14, label: "Moderate",           color: "orange", urgency: 2 },
            { max: 19, label: "Moderately Severe",  color: "red",    urgency: 3 },
            { max: 27, label: "Severe",             color: "red",    urgency: 4 },
        ],
    },
    GAD7: {
        maxScore: 21,
        levels: [
            { max: 4,  label: "Minimal",  color: "green",  urgency: 0 },
            { max: 9,  label: "Mild",     color: "yellow", urgency: 1 },
            { max: 14, label: "Moderate", color: "orange", urgency: 2 },
            { max: 21, label: "Severe",   color: "red",    urgency: 3 },
        ],
    },
    PSS10: {
        maxScore: 40,
        levels: [
            { max: 13, label: "Low Stress",      color: "green",  urgency: 0 },
            { max: 26, label: "Moderate Stress", color: "yellow", urgency: 1 },
            { max: 40, label: "High Stress",     color: "red",    urgency: 2 },
        ],
    },
    WEMWBS: {
        maxScore: 70,
        // Higher = better for WEMWBS
        levels: [
            { max: 40, label: "Low Wellbeing",    color: "red",    urgency: 3 },
            { max: 52, label: "Moderate Wellbeing", color: "yellow", urgency: 1 },
            { max: 59, label: "Good Wellbeing",   color: "green",  urgency: 0 },
            { max: 70, label: "High Wellbeing",   color: "green",  urgency: 0 },
        ],
        higherIsBetter: true,
    },
    AUDIT: {
        maxScore: 40,
        levels: [
            { max: 7,  label: "Low Risk",      color: "green",  urgency: 0 },
            { max: 15, label: "Hazardous",     color: "yellow", urgency: 2 },
            { max: 19, label: "Harmful",       color: "orange", urgency: 3 },
            { max: 40, label: "Likely Dependence", color: "red", urgency: 4 },
        ],
    },
};

function getSeverity(type, score) {
    const table = SCORE_TABLES[type];
    if (!table) return { label: "Unknown", color: "gray", urgency: 0 };
    for (const level of table.levels) {
        if (score <= level.max) return level;
    }
    return table.levels[table.levels.length - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
//  PERSONALISED RESOURCE MAP
//  Maps (assessmentType, severityUrgency) → resource IDs (matches client RESOURCES)
// ─────────────────────────────────────────────────────────────────────────────
const RESOURCE_MAP = {
    PHQ9: {
        0: [{ id:"16", reason:"Exercise is as effective as antidepressants for mild symptoms" },
            { id:"44", reason:"Journaling reduces low mood and builds self-awareness" },
            { id:"41", reason:"A structured self-care plan prevents mild symptoms from deepening" }],
        1: [{ id:"18", reason:"Therapy in a Nutshell's depression series covers your symptom range" },
            { id:"12", reason:"Behavioural activation directly counters mild-moderate depression" },
            { id:"15", reason:"Guided meditation shown to reduce moderate depression symptoms" }],
        2: [{ id:"11", reason:"Andrew Solomon's TED Talk: you are not alone in this experience" },
            { id:"12", reason:"Behavioural activation worksheet for moderate depression" },
            { id:"13", reason:"Stanford podcast explains why this happens and how treatment works" }],
        3: [{ id:"11", reason:"Understanding what severe depression is reduces shame and isolation" },
            { id:"12", reason:"Behavioural activation is the recommended first step" },
            { id:"48", reason:"Crisis resources — please reach out for immediate support" }],
        4: [{ id:"48", reason:"Please reach out for crisis support right now" },
            { id:"49", reason:"iCall provides free professional support — please call today" },
            { id:"11", reason:"You are not alone — millions have recovered from severe depression" }],
    },
    GAD7: {
        0: [{ id:"1",  reason:"Understanding anxiety prevents mild symptoms from escalating" },
            { id:"39", reason:"Daily mindfulness practice keeps anxiety at bay" }],
        1: [{ id:"2",  reason:"4-7-8 breathing provides immediate relief for mild anxiety" },
            { id:"4",  reason:"CBT workbook is the first-line treatment for mild anxiety" },
            { id:"7",  reason:"Social anxiety guide if social situations are a trigger" }],
        2: [{ id:"3",  reason:"How anxiety works in the brain — understanding reduces fear of symptoms" },
            { id:"8",  reason:"Emma McAdam's therapy series covers your level of anxiety" },
            { id:"9",  reason:"DARE technique is highly effective at this level" }],
        3: [{ id:"8",  reason:"Therapy in a Nutshell anxiety series — watch all videos" },
            { id:"5",  reason:"UCLA guided meditation for severe anxiety — use daily" },
            { id:"48", reason:"Crisis support if anxiety is overwhelming your daily function" }],
    },
    PSS10: {
        0: [{ id:"22", reason:"Stress diary keeps low stress from building unnoticed" }],
        1: [{ id:"19", reason:"APA guide to understanding your stress response" },
            { id:"24", reason:"Progressive muscle relaxation reduces physical stress buildup" },
            { id:"26", reason:"Exam stress guide if academic pressure is the source" }],
        2: [{ id:"20", reason:"Kelly McGonigal: reframing your stress response changes its impact" },
            { id:"25", reason:"Huberman Lab physiological sigh — fastest stress relief" },
            { id:"23", reason:"WHO workplace stress guidelines if work is the trigger" }],
    },
    WEMWBS: {
        3: [{ id:"42", reason:"Brené Brown on vulnerability — the foundation of wellbeing" },
            { id:"34", reason:"How mindfulness literally changes the brain structure" },
            { id:"48", reason:"Low wellbeing can indicate depression — please seek support" }],
        1: [{ id:"47", reason:"Gratitude practice is the #1 evidence-based wellbeing booster" },
            { id:"46", reason:"Yoga with Adriene — movement directly improves mood" },
            { id:"41", reason:"Self-care wheel assessment identifies which areas need work" }],
        0: [{ id:"37", reason:"Headspace to maintain and deepen your wellbeing practice" }],
    },
    AUDIT: {
        0: [{ id:"45", reason:"Maintaining healthy habits around alcohol and digital use" }],
        2: [{ id:"23", reason:"Workplace stress and alcohol often co-occur" }],
        3: [{ id:"48", reason:"Crisis resources if alcohol use is affecting mental health" }],
        4: [{ id:"48", reason:"Please seek professional support for alcohol dependence" },
            { id:"49", reason:"iCall offers free professional counselling" }],
    },
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOCTOR WARNING MESSAGES (always shown for urgency >= 2)
// ─────────────────────────────────────────────────────────────────────────────
const DOCTOR_WARNINGS = {
    PHQ9: {
        1: "🩺 Mild symptoms can escalate. If these feelings persist beyond 2 weeks or worsen, please consult a doctor or mental health professional.",
        2: "⚠️ Moderate depression significantly affects quality of life. We strongly recommend discussing your results with a doctor or psychiatrist. This is not something to manage alone.",
        3: "🚨 Moderately severe depression requires professional evaluation. Please book an appointment with a doctor or psychiatrist as soon as possible. Self-help alone is not sufficient at this level.",
        4: "🆘 Severe depression is a serious medical condition. Please seek professional medical help immediately. If you are having thoughts of self-harm, call 9152987821 (iCall) right now.",
    },
    GAD7: {
        1: "🩺 Mild anxiety symptoms — if they persist, speaking with a doctor can prevent escalation.",
        2: "⚠️ Moderate anxiety significantly impacts daily life. A mental health professional can provide CBT, medication, or a combination — both are highly effective. Please consider booking an appointment.",
        3: "🚨 Severe anxiety often requires professional support. Please consult a doctor, psychiatrist, or licensed therapist. Untreated severe anxiety can worsen over time.",
    },
    PSS10: {
        2: "⚠️ High perceived stress is associated with increased risk of cardiovascular disease, immune dysfunction, and depression. Please consult a doctor if physical symptoms (headaches, chest tightness, insomnia) are present.",
    },
    WEMWBS: {
        3: "⚠️ Low wellbeing can be a sign of underlying depression or burnout. Please speak to a doctor or counsellor who can provide a proper assessment.",
        1: "🩺 Moderate wellbeing has room to improve. A single session with a counsellor can significantly accelerate progress.",
    },
    AUDIT: {
        2: "⚠️ Hazardous alcohol use increases risk of liver disease, depression, and accidents. Please speak to a doctor about your drinking patterns.",
        3: "🚨 Harmful alcohol use requires medical evaluation. Please consult a doctor — there are highly effective treatments available.",
        4: "🆘 This score suggests alcohol dependence, which is a medical condition. Please seek immediate help from a doctor or addiction specialist. Do not stop drinking abruptly without medical supervision.",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
//  SESSION GOALS — generated based on high-scoring questions
// ─────────────────────────────────────────────────────────────────────────────
function generateGoals(type, answers, severity) {
    const goals = [];
    const urgency = severity.urgency;
    if (urgency === 0) return [];

    if (type === "PHQ9") {
        const q = answers.reduce((a, c) => ({ ...a, [c.questionId]: c.score }), {});
        if ((q["Q3"] || 0) >= 2) goals.push({ area: "Sleep",          description: "Improve sleep quality using CBT-i techniques", targetWeeks: 4 });
        if ((q["Q1"] || 0) >= 2) goals.push({ area: "Engagement",     description: "Schedule one enjoyable activity per day", targetWeeks: 3 });
        if ((q["Q4"] || 0) >= 2) goals.push({ area: "Energy",         description: "Incorporate daily 20-minute walks", targetWeeks: 4 });
        if ((q["Q6"] || 0) >= 2) goals.push({ area: "Self-Esteem",    description: "Practice daily self-compassion journaling", targetWeeks: 6 });
        if ((q["Q9"] || 0) >= 1) goals.push({ area: "Safety",         description: "Create a personal safety plan with a trusted person", targetWeeks: 1 });
        if (urgency >= 2)        goals.push({ area: "Professional Support", description: "Book a session with a counsellor or doctor", targetWeeks: 2 });
    }
    if (type === "GAD7") {
        const q = answers.reduce((a, c) => ({ ...a, [c.questionId]: c.score }), {});
        if ((q["Q1"] || 0) >= 2) goals.push({ area: "Grounding",      description: "Practice 5-4-3-2-1 grounding exercise daily", targetWeeks: 3 });
        if ((q["Q4"] || 0) >= 2) goals.push({ area: "Relaxation",     description: "10-min progressive muscle relaxation before bed", targetWeeks: 4 });
        if ((q["Q2"] || 0) >= 2) goals.push({ area: "Worry Control",  description: "Scheduled worry time — contain worrying to 15 min/day", targetWeeks: 3 });
        if (urgency >= 2)        goals.push({ area: "Professional Support", description: "Book a CBT session with a licensed therapist", targetWeeks: 2 });
    }
    if (type === "PSS10") {
        if (urgency >= 1) goals.push({ area: "Stress Awareness",  description: "Keep a 2-week stress diary to identify top triggers", targetWeeks: 2 });
        if (urgency >= 2) goals.push({ area: "Stress Reduction",  description: "Daily 5-min box breathing and weekly exercise", targetWeeks: 4 });
    }
    if (type === "WEMWBS") {
        if (urgency >= 1) goals.push({ area: "Positive Activities", description: "Identify and schedule 3 activities that bring joy", targetWeeks: 3 });
        if (urgency >= 3) goals.push({ area: "Professional Support", description: "Speak to a counsellor about low wellbeing", targetWeeks: 2 });
    }

    return goals.slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
//  COPING STRATEGIES — specific to score level
// ─────────────────────────────────────────────────────────────────────────────
const COPING_STRATEGIES = {
    PHQ9: {
        0: ["Maintain daily movement", "Regular sleep schedule", "Stay socially connected"],
        1: ["Behavioural activation: schedule 1 pleasant activity daily", "Exercise 30 min, 3×/week", "Journaling before bed"],
        2: ["Daily behavioural activation schedule", "Contact a counsellor for CBT sessions", "Inform one trusted person about how you're feeling"],
        3: ["Immediate counsellor or doctor appointment", "Engage a support person daily", "Use the MindCare safety plan tool", "Avoid isolation completely"],
        4: ["Seek emergency support now", "Call iCall: 9152987821", "Go to nearest hospital if in crisis"],
    },
    GAD7: {
        0: ["Daily mindfulness 5 min", "Limit caffeine and news"],
        1: ["4-7-8 breathing at first sign of anxiety", "Worry journaling: write, then close notebook", "Limit news to 15 min/day"],
        2: ["Scheduled worry time (15 min/day)", "Exposure hierarchy — face avoided situations gradually", "Weekly CBT worksheet"],
        3: ["Book CBT with licensed therapist", "Daily relaxation practice", "Identify and tell trusted person about severity"],
    },
    PSS10: {
        0: ["Weekly review of stressors", "Regular physical exercise"],
        1: ["Identify top 3 stressors and one action per stressor", "Daily 5-min box breathing", "Protect sleep"],
        2: ["Immediate workload reduction if possible", "Daily physical exercise", "Consult doctor if physical symptoms present"],
    },
};

function getCopingStrategies(type, urgency) {
    const map = COPING_STRATEGIES[type];
    if (!map) return ["Practice mindfulness", "Exercise regularly", "Maintain social connections"];
    return map[urgency] || map[0] || [];
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE SCREENING
//  POST /api/v1/screenings
//  Body: { type, answers: [{ questionId, score }] }
// ─────────────────────────────────────────────────────────────────────────────
export const createScreening = asyncHandler(async (req, res) => {
    const { type, answers } = req.body;

    if (!type || !answers || !Array.isArray(answers) || answers.length === 0)
        throw new ApiError(400, "Provide type and answers array");

    if (!SCORE_TABLES[type])
        throw new ApiError(400, `Unknown assessment type. Use: ${Object.keys(SCORE_TABLES).join(", ")}`);

    // Validate and sum
    let total = 0;
    for (const a of answers) {
        if (typeof a.score !== "number" || a.score < 0 || a.score > 5)
            throw new ApiError(400, `Invalid score for question ${a.questionId}. Must be 0–5.`);
        total += a.score;
    }

    const maxScore = SCORE_TABLES[type].maxScore;
    const sevLevel = getSeverity(type, total);
    const urgency  = sevLevel.urgency;

    // ── Risk flags ────────────────────────────────────────────────────────────
    const flags = {
        suicidalIdeation:   type === "PHQ9"  && answers.find(a => a.questionId === "Q9" && a.score >= 1) ? true : false,
        severeDepression:   type === "PHQ9"  && urgency >= 4,
        severeAnxiety:      type === "GAD7"  && urgency >= 3,
        severeStress:       type === "PSS10" && urgency >= 2,
        highRiskAlcohol:    type === "AUDIT" && urgency >= 3,
        requiresUrgentCare: urgency >= 3 || (type === "PHQ9" && answers.find(a => a.questionId === "Q9" && a.score >= 2)),
    };

    // ── Trend vs previous screening ───────────────────────────────────────────
    let trend = "first";
    let scoreDelta = null;
    let previousScreeningId = null;

    if (req.user) {
        const prev = await Screening.findOne({ user: req.user._id, type }).sort({ createdAt: -1 });
        if (prev) {
            previousScreeningId = prev._id;
            const isWEMWBS = type === "WEMWBS";
            scoreDelta  = isWEMWBS ? prev.totalScore - total : total - prev.totalScore;
            // For WEMWBS higher = better, so positive delta means improvement
            // For all others, lower = better
            if      (Math.abs(scoreDelta) <= 2) trend = "stable";
            else if (scoreDelta < 0)            trend = isWEMWBS ? "worsening" : "improving";
            else                                trend = isWEMWBS ? "improving" : "worsening";
        }
    }

    // ── Personalised resources ────────────────────────────────────────────────
    const resourceRefs = (RESOURCE_MAP[type]?.[urgency] || []).slice(0, 4);

    // ── Goals ─────────────────────────────────────────────────────────────────
    const goals = generateGoals(type, answers, sevLevel);

    // ── Coping strategies ─────────────────────────────────────────────────────
    const copingStrategies = getCopingStrategies(type, urgency);

    // ── Doctor warning ────────────────────────────────────────────────────────
    const doctorWarning = DOCTOR_WARNINGS[type]?.[urgency] || null;

    // ── Self-care actions ─────────────────────────────────────────────────────
    const selfCareMap = {
        PHQ9:   ["Take a 20-min walk today", "Text one person you trust", "Write down 3 things you notice around you", "Set one small achievable goal for tomorrow"],
        GAD7:   ["Do one box-breathing session now (4-4-4-4)", "Write your worries in a notebook then close it", "Watch one calming YouTube video", "Prepare your space for good sleep tonight"],
        PSS10:  ["Identify your #1 stressor and one thing you control", "Step away from screens for 30 min", "Drink water and eat a balanced meal", "Call or text someone you feel safe with"],
        WEMWBS: ["List 3 things that made you smile this week", "Plan one enjoyable activity for tomorrow", "Contact a friend you haven't spoken to recently"],
        AUDIT:  ["Track your units this week honestly", "Identify one alcohol-free social activity", "Talk to your doctor — it's a medical matter, not a moral one"],
    };
    const selfCareActions = selfCareMap[type] || [];

    // ── Estimated recovery ────────────────────────────────────────────────────
    const recoveryMap = {
        0: "You're doing well — maintain your habits",
        1: "4–6 weeks of consistent self-care typically resolves mild symptoms",
        2: "6–12 weeks with professional support and consistent practice",
        3: "Professional treatment typically shows significant improvement in 8–16 weeks",
        4: "Immediate professional help required — recovery is fully possible with treatment",
    };
    const estimatedRecoveryTime = recoveryMap[urgency] || "";

    // ── Build recommended text ────────────────────────────────────────────────
    const recommendedText = urgency >= 3
        ? `Your score indicates ${sevLevel.label.toLowerCase()} symptoms. Professional mental health support is strongly recommended. Please contact a doctor, psychiatrist, or counsellor as soon as possible.`
        : urgency >= 2
            ? `Your score indicates ${sevLevel.label.toLowerCase()} symptoms. We recommend discussing your results with a mental health professional and using the resources and goals below to build a recovery plan.`
            : urgency >= 1
                ? `Your score indicates ${sevLevel.label.toLowerCase()} symptoms. Regular self-care, the resources below, and checking in with a counsellor if symptoms persist will help you improve.`
                : `Your score is in the ${sevLevel.label.toLowerCase()} range. Keep up your current healthy habits and use the resources below to maintain your wellbeing.`;

    // ── Create record ─────────────────────────────────────────────────────────
    const screeningData = {
        type,
        answers,
        totalScore: total,
        maxScore,
        severity: sevLevel.label,
        flags,
        trend,
        scoreDelta,
        previousScreeningId,
        resultMeta: {
            recommended:           recommendedText,
            doctorWarning,
            selfCareActions,
            resources:             resourceRefs,
            copingStrategies,
            estimatedRecoveryTime,
        },
        sessionPlan: {
            active:       goals.length > 0,
            startedAt:    goals.length > 0 ? new Date() : null,
            targetWeeks:  urgency >= 3 ? 12 : urgency >= 2 ? 8 : 4,
            goals,
            checkInDates: goals.length > 0 ? [
                new Date(Date.now() + 7  * 86400000),  // 1 week
                new Date(Date.now() + 21 * 86400000),  // 3 weeks
                new Date(Date.now() + 42 * 86400000),  // 6 weeks
            ] : [],
        },
    };

    if (req.user) screeningData.user = req.user._id;

    const screening = await Screening.create(screeningData);

    // ── Alert admin if high risk ──────────────────────────────────────────────
    if (flags.requiresUrgentCare && req.user) {
        const adminUser = await User.findOne({ role: "admin" }).select("email fullName");
        if (adminUser) {
            await sendMail({
                to:      adminUser.email,
                subject: `⚠️ High-Risk Screening Alert — MindCare`,
                html: `<div style="font-family:Arial,sans-serif;max-width:600px;padding:20px">
                  <div style="background:#ef4444;border-radius:12px;padding:20px;color:#fff;text-align:center;margin-bottom:20px">
                    <h1 style="margin:0">⚠️ High-Risk Screening Alert</h1>
                  </div>
                  <p>A user has completed a screening with a high-risk score:</p>
                  <ul>
                    <li><strong>Assessment:</strong> ${type}</li>
                    <li><strong>Score:</strong> ${total}/${maxScore} (${sevLevel.label})</li>
                    <li><strong>Suicidal ideation flagged:</strong> ${flags.suicidalIdeation ? "YES 🚨" : "No"}</li>
                    <li><strong>User ID:</strong> ${req.user._id}</li>
                  </ul>
                  <p>Please review the user's profile and consider proactive outreach.</p>
                </div>`,
            }).catch(e => console.error("[Mail] Admin alert:", e.message));
        }
    }

    return res.status(201).json(new ApiResponse(201, {
        id:            screening._id,
        totalScore:    total,
        maxScore,
        severity:      sevLevel.label,
        urgency:       sevLevel.urgency,
        color:         sevLevel.color,
        flags,
        trend,
        scoreDelta,
        resultMeta:    screening.resultMeta,
        sessionPlan:   screening.sessionPlan,
    }, "Screening completed"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET MY SCREENINGS (history + trends)
//  GET /api/v1/screenings/me
// ─────────────────────────────────────────────────────────────────────────────
export const getMyScreenings = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const items = await Screening.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    // Build trend data per type
    const byType = {};
    for (const s of items) {
        if (!byType[s.type]) byType[s.type] = [];
        byType[s.type].push({
            id:         s._id,
            score:      s.totalScore,
            maxScore:   s.maxScore,
            severity:   s.severity,
            trend:      s.trend,
            scoreDelta: s.scoreDelta,
            createdAt:  s.createdAt,
        });
    }

    return res.json(new ApiResponse(200, { screenings: items, byType }, "Screenings fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET SINGLE SCREENING
// ─────────────────────────────────────────────────────────────────────────────
export const getScreening = asyncHandler(async (req, res) => {
    const screening = await Screening.findById(req.params.id).populate("user", "fullName email role");
    if (!screening) throw new ApiError(404, "Screening not found");

    const uid = req.user?._id?.toString();
    if (screening.user?._id.toString() !== uid && req.user?.role !== "admin")
        throw new ApiError(403, "Access denied");

    return res.json(new ApiResponse(200, screening, "Screening fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE GOAL PROGRESS
//  PATCH /api/v1/screenings/:id/goals/:goalId
//  Body: { progress (0-100), notes?, completed? }
// ─────────────────────────────────────────────────────────────────────────────
export const updateGoalProgress = asyncHandler(async (req, res) => {
    const { progress, notes, completed } = req.body;
    const screening = await Screening.findOne({ _id: req.params.id, user: req.user._id });
    if (!screening) throw new ApiError(404, "Screening not found");

    const goal = screening.sessionPlan.goals.id(req.params.goalId);
    if (!goal) throw new ApiError(404, "Goal not found");

    if (progress !== undefined) goal.progress = Math.max(0, Math.min(100, Number(progress)));
    if (notes     !== undefined) goal.notes     = notes;
    if (completed !== undefined) {
        goal.completed   = completed;
        goal.completedAt = completed ? new Date() : null;
        if (completed && goal.progress < 100) goal.progress = 100;
    }

    // Recompute overall plan progress
    const allGoals = screening.sessionPlan.goals;
    if (allGoals.length > 0) {
        screening.sessionPlan.overallProgress = Math.round(
            allGoals.reduce((s, g) => s + g.progress, 0) / allGoals.length
        );
    }

    await screening.save();
    return res.json(new ApiResponse(200, { goal, overallProgress: screening.sessionPlan.overallProgress }, "Goal updated"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN: ALL SCREENINGS (analytics)
//  GET /api/v1/screenings/admin?type=&severity=
// ─────────────────────────────────────────────────────────────────────────────
export const adminGetScreenings = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") throw new ApiError(403, "Admin only");

    const { type, severity, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type)     filter.type     = type;
    if (severity) filter.severity = severity;

    const skip = (page - 1) * limit;
    const [screenings, total, flaggedCount] = await Promise.all([
        Screening.find(filter).populate("user", "fullName email").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
        Screening.countDocuments(filter),
        Screening.countDocuments({ "flags.requiresUrgentCare": true }),
    ]);

    // Score distribution
    const distribution = await Screening.aggregate([
        { $match: type ? { type } : {} },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);

    return res.json(new ApiResponse(200, {
        screenings, total, flaggedCount, distribution,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    }, "Admin screenings fetched"));
});
