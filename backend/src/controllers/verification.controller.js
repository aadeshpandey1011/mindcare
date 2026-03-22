import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }      from "../utils/ApiError.js";
import { ApiResponse }   from "../utils/ApiResponse.js";
import { User }          from "../models/user.model.js";
import {
    sendOtpSms,
    verifyOtpCode,
    normalisePhone,
    maskPhone,
} from "../utils/otpService.js";

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/verify/send-otp
// ─────────────────────────────────────────────────────────────────────────────
export const sendVerificationOtp = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("+phone");
    if (!user) throw new ApiError(404, "User not found");

    if (!user.phone) {
        throw new ApiError(400, "No phone number on this account. Update your profile first.");
    }

    await sendOtpSms(user.phone);

    return res.status(200).json(
        new ApiResponse(200, { phone: maskPhone(user.phone) },
        `OTP sent to ${maskPhone(user.phone)}. Enter the 6-digit code to verify.`)
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/verify/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPhoneOtp = asyncHandler(async (req, res) => {
    const { otp } = req.body;

    if (!otp || String(otp).replace(/\D/g, "").length !== 6) {
        throw new ApiError(400, "Please provide a valid 6-digit OTP.");
    }

    const user = await User.findById(req.user._id).select("+phone");
    if (!user) throw new ApiError(404, "User not found");
    if (!user.phone) throw new ApiError(400, "No phone number on this account.");

    const approved = await verifyOtpCode(user.phone, otp);
    if (!approved) throw new ApiError(400, "Incorrect or expired OTP. Please try again.");

    user.govtId = {
        ...(user.govtId?.toObject?.() ?? user.govtId ?? {}),
        phoneVerified: true,
        isVerified:    true,
        verifiedAt:    new Date(),
    };
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {
            isVerified:    true,
            phoneVerified: true,
            verifiedAt:    user.govtId.verifiedAt,
        }, "Phone verified successfully. Your identity is now confirmed.")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/verify/status
//
//  FIX: explicitly check each field is a non-empty string, not just truthy.
//  This prevents Mongoose subdocument defaults from causing false positives
//  on new Google users who have never set any govt ID.
// ─────────────────────────────────────────────────────────────────────────────
export const getVerificationStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select(
        "+phone +govtId.aadharNumber +govtId.panNumber govtId.isVerified govtId.phoneVerified govtId.verifiedAt"
    );
    if (!user) throw new ApiError(404, "User not found");

    const g = user.govtId ?? {};

    // Use explicit string length checks — never rely on truthy alone
    // This prevents Mongoose returning an empty subdocument that looks populated
    const hasAadhar = typeof g.aadharNumber === "string" && g.aadharNumber.trim().length === 12;
    const hasPan    = typeof g.panNumber    === "string" && g.panNumber.trim().length    === 10;
    const hasPhone  = typeof user.phone     === "string" && user.phone.trim().length     > 0;

    return res.status(200).json(
        new ApiResponse(200, {
            isVerified:    g.isVerified    === true,  // must be exactly true, not truthy
            phoneVerified: g.phoneVerified === true,
            verifiedAt:    g.verifiedAt    ?? null,
            hasPhone,
            hasAadhar,
            hasPan,
            phoneMasked:  hasPhone  ? maskPhone(user.phone)                                   : null,
            aadharMasked: hasAadhar ? "XXXX-XXXX-" + g.aadharNumber.trim().slice(-4)          : null,
            panMasked:    hasPan    ? g.panNumber.trim().slice(0, 3) + "**" + g.panNumber.trim().slice(5) : null,
        }, "Verification status fetched")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
//  PATCH /api/v1/verify/update-phone
// ─────────────────────────────────────────────────────────────────────────────
export const updatePhone = asyncHandler(async (req, res) => {
    const { phone } = req.body;
    if (!phone) throw new ApiError(400, "Phone number is required");

    const cleaned = String(phone).replace(/[\s\-().]/g, "");
    if (!/^\d{10}$/.test(cleaned) && !/^\+91\d{10}$/.test(cleaned) && !/^91\d{10}$/.test(cleaned)) {
        throw new ApiError(400, "Provide a valid 10-digit Indian mobile number.");
    }

    const existing = await User.findOne({ phone: cleaned, _id: { $ne: req.user._id } });
    if (existing) throw new ApiError(409, "This phone number is already registered.");

    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            phone:                  cleaned,
            "govtId.phoneVerified": false,
            "govtId.isVerified":    false,
            "govtId.verifiedAt":    null,
        },
    });

    return res.status(200).json(
        new ApiResponse(200, { phone: maskPhone(cleaned) },
        "Phone number updated. Please verify your new number.")
    );
});
