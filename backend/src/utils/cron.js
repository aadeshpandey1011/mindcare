/**
 * cron.js — all background jobs for MindCare
 *
 * Jobs:
 *  1. Auto-complete sessions     — every hour at :00
 *  2. Expire unpaid bookings     — every hour at :30
 *  3. Resource of the Week email — every Monday at 9 AM
 */

import cron from "node-cron";
import { Booking }  from "../models/booking.model.js";
import { Payment }  from "../models/payment.model.js";
import { User }     from "../models/user.model.js";
import { autoCompleteExpiredSessions } from "../controllers/booking.controller.js";
import { logAudit } from "../utils/auditLog.js";
import sendMail     from "../utils/mail.js";

const PAYMENT_EXPIRY_HOURS = 24;

// ── Hardcoded weekly picks (rotate by week number) ─────────────────────────
const WEEKLY_PICKS = [
    { id: "2",  title: "4-7-8 Breathing for Anxiety Relief",        category: "Anxiety",      url: "https://www.youtube.com/watch?v=gz4G31LGyog",          type: "Video",   emoji: "🎬" },
    { id: "17", title: "Mindfulness for Beginners: A 7-Day Programme", category: "Mindfulness", url: "https://www.mindful.org/meditation/mindfulness-getting-started/", type: "Article", emoji: "📖" },
    { id: "13", title: "Why We Sleep — Key Insights for Students",   category: "Sleep",        url: "https://www.sleepfoundation.org/mental-health",        type: "Article", emoji: "🌙" },
    { id: "9",  title: "The Science of Stress",                      category: "Stress",       url: "https://www.apa.org/topics/stress",                    type: "Article", emoji: "📖" },
    { id: "20", title: "5-Senses Grounding Exercise",                category: "Mindfulness",  url: "https://www.therapistaid.com/therapy-worksheet/5-senses-worksheet", type: "Tool", emoji: "🛠️" },
    { id: "7",  title: "The Noonday Demon — Andrew Solomon TED Talk", category: "Depression",  url: "https://www.ted.com/talks/andrew_solomon_depression_the_secret_we_share", type: "Video", emoji: "🎬" },
    { id: "21", title: "The Self-Care Wheel",                        category: "Self-Care",    url: "https://www.therapistaid.com/therapy-worksheet/self-care-assessment", type: "Article", emoji: "📖" },
    { id: "10", title: "5-Minute Stress Reset — Box Breathing",      category: "Stress",       url: "https://www.youtube.com/watch?v=tEmt1Znux58",          type: "Audio",   emoji: "🎧" },
];

const getWeeklyPick = () => {
    const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return WEEKLY_PICKS[week % WEEKLY_PICKS.length];
};

// ─────────────────────────────────────────────────────────────────────────────
//  JOB 1: auto-complete expired session_done bookings
// ─────────────────────────────────────────────────────────────────────────────
const runAutoComplete = async () => {
    console.log("[Cron] Running auto-complete check...");
    try {
        const count = await autoCompleteExpiredSessions();
        if (count > 0) console.log(`[Cron] Auto-completed ${count} session(s).`);
    } catch (err) {
        console.error("[Cron] Auto-complete error:", err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  JOB 2: expire unpaid (payment_pending) bookings
// ─────────────────────────────────────────────────────────────────────────────
const runExpireUnpaid = async () => {
    const cutoff = new Date(Date.now() - PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);
    const stale  = await Booking.find({ status: "payment_pending", createdAt: { $lte: cutoff } });

    if (stale.length === 0) return;
    console.log(`[Cron] Expiring ${stale.length} unpaid booking(s)...`);

    for (const b of stale) {
        try {
            b.status             = "cancelled";
            b.cancellationReason = `Auto-cancelled: payment not completed within ${PAYMENT_EXPIRY_HOURS}h`;
            await b.save();
            if (b.paymentId) {
                await Payment.findByIdAndUpdate(b.paymentId, {
                    status: "failed", failureReason: "Payment not completed — booking auto-expired",
                });
            }
            logAudit(null, "BOOKING_EXPIRED_UNPAID", {
                resourceType: "Booking", resourceId: b._id,
                metadata: { expiredAfterHours: PAYMENT_EXPIRY_HOURS },
            });
        } catch (e) {
            console.error(`[Cron] Expire booking ${b._id}:`, e.message);
        }
    }
    console.log(`[Cron] Expired ${stale.length} unpaid bookings.`);
};

// ─────────────────────────────────────────────────────────────────────────────
//  JOB 3: Resource of the Week — every Monday 9 AM
// ─────────────────────────────────────────────────────────────────────────────
const sendResourceOfWeek = async () => {
    console.log("[Cron] Sending Resource of the Week emails...");
    try {
        const pick = getWeeklyPick();
        // Get all active students and counsellors
        const users = await User.find({
            isApproved: true,
            role:       { $in: ["student", "counsellor"] },
        }).select("fullName email role").lean();

        let sent = 0;
        for (const u of users) {
            try {
                await sendMail({
                    to:      u.email,
                    subject: `📚 This Week's Mental Health Resource — MindCare`,
                    html: resourceOfWeekEmailHtml(u, pick),
                });
                sent++;
            } catch (e) { /* skip bad addresses silently */ }
        }
        console.log(`[Cron] Resource of the Week sent to ${sent} users. Pick: ${pick.title}`);
    } catch (err) {
        console.error("[Cron] Resource of week error:", err.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  START ALL JOBS
// ─────────────────────────────────────────────────────────────────────────────
export const startCronJobs = () => {
    // Job 1 — auto-complete sessions (every hour, :00)
    cron.schedule("0 * * * *", runAutoComplete);

    // Job 2 — expire unpaid bookings (every hour, :30)
    cron.schedule("30 * * * *", runExpireUnpaid);

    // Job 3 — Resource of the Week (every Monday at 9:00 AM)
    cron.schedule("0 9 * * 1", sendResourceOfWeek);

    console.log("[Cron] All jobs started: auto-complete (hourly), unpaid expiry (hourly), resource-of-week (Mon 9 AM)");
};

// ─────────────────────────────────────────────────────────────────────────────
//  EMAIL TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
const resourceOfWeekEmailHtml = (user, pick) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
    <p style="color:#e0e7ff;margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.1em">📚 Resource of the Week</p>
    <h1 style="color:#fff;margin:0;font-size:24px;line-height:1.3">${pick.title}</h1>
    <p style="color:#c7d2fe;margin:12px 0 0;font-size:14px">${pick.category} · ${pick.emoji} ${pick.type}</p>
  </div>

  <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e7eb">
    <p style="margin:0 0 6px;color:#374151">Hi <strong>${user.fullName}</strong>,</p>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6">
      Your weekly mental health resource is ready. Taking just a few minutes to engage with quality content can make a meaningful difference in how you feel. Here's this week's pick:
    </p>
    <div style="margin:20px 0;text-align:center">
      <a href="${pick.url}" style="display:inline-block;background:#6366f1;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
        ${pick.emoji} Open Resource →
      </a>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
      Or view all resources in the <a href="${process.env.FRONTEND_URL}/resources" style="color:#6366f1;text-decoration:none;font-weight:600">MindCare Resource Hub</a>
    </p>
  </div>

  <p style="color:#d1d5db;font-size:11px;text-align:center;margin:0">
    You're receiving this because you have an active MindCare account.
    <br/>© 2025 MindCare. <a href="${process.env.FRONTEND_URL}" style="color:#9ca3af">Visit Platform</a>
  </p>
</div>`;
