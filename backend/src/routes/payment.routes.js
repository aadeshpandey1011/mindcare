import { Router }       from "express";
import {
    createOrder,
    verifyPayment,
    cashfreeWebhook,
    initiateRefund,
    getPaymentHistory,
    getPaymentStats,
    getAuditLogs,
    getMyAuditLogs,
} from "../controllers/payment.controller.js";
import { verifyJWT }      from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authoriseRoles.middleware.js";

const router = Router();

// ── Webhook — NO auth (Cashfree signs with timestamp + secret) ────────────────
router.post("/webhook", cashfreeWebhook);

// ── All other routes require JWT ──────────────────────────────────────────────
router.use(verifyJWT);

// Student
router.post("/create-order",         createOrder);
router.post("/verify",               verifyPayment);
router.get("/history",               getPaymentHistory);
router.get("/my-audit",              getMyAuditLogs);
router.post("/refund/:bookingId",    initiateRefund);

// Admin only
router.get("/stats", authorizeRoles("admin"), getPaymentStats);
router.get("/audit", authorizeRoles("admin"), getAuditLogs);

export default router;
