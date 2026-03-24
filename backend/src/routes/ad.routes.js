import { Router }        from "express";
import {
    getForumAds, getAdPlans, trackAdClick,
    createAdOrder, verifyAdPayment, adWebhook,
    getMyAd, toggleMyAd,
    adminGetAllAds, adminReviewAd,
} from "../controllers/ad.controller.js";
import {
    saveBankDetails, getBankDetails,
} from "../controllers/bank.controller.js";
import { verifyJWT }      from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authoriseRoles.middleware.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get ("/forum",           getForumAds);
router.get ("/plans",           getAdPlans);
router.post("/:adId/click",     trackAdClick);

// ── Cashfree webhook (no auth) ────────────────────────────────────────────────
router.post("/webhook",         adWebhook);

// ── Authenticated ─────────────────────────────────────────────────────────────
router.use(verifyJWT);

// Counsellor — ad payment flow
router.post ("/create-order",   authorizeRoles("counsellor"), createAdOrder);
router.post ("/verify-payment", authorizeRoles("counsellor"), verifyAdPayment);
router.get  ("/my-ad",          authorizeRoles("counsellor"), getMyAd);
router.patch("/my-ad/toggle",   authorizeRoles("counsellor"), toggleMyAd);

// Counsellor — bank details
router.post ("/bank-details",   authorizeRoles("counsellor"), saveBankDetails);
router.get  ("/bank-details",   authorizeRoles("counsellor"), getBankDetails);

// Admin
router.get  ("/admin/all",              authorizeRoles("admin"), adminGetAllAds);
router.patch("/admin/:adId/review",     authorizeRoles("admin"), adminReviewAd);

export default router;
