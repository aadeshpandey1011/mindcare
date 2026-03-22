import { Router } from "express";
import {
    sendVerificationOtp,
    verifyPhoneOtp,
    getVerificationStatus,
    updatePhone,
} from "../controllers/verification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All verification routes require a valid JWT — user must be logged in
router.use(verifyJWT);

// GET  /api/v1/verify/status       → get current verification status (safe, masked)
router.get("/status", getVerificationStatus);

// POST /api/v1/verify/send-otp     → generate OTP and send SMS to registered phone
router.post("/send-otp", sendVerificationOtp);

// POST /api/v1/verify/verify-otp   → submit OTP code to complete verification
router.post("/verify-otp", verifyPhoneOtp);

// PATCH /api/v1/verify/update-phone → update phone number (resets verification)
router.patch("/update-phone", updatePhone);

export default router;
