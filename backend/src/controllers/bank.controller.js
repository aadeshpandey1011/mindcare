import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }      from "../utils/ApiError.js";
import { ApiResponse }   from "../utils/ApiResponse.js";
import { User }          from "../models/user.model.js";

// ─────────────────────────────────────────────────────────────────────────────
//  SAVE / UPDATE BANK DETAILS  (counsellor)
//  POST /api/v1/ads/bank-details
//  Body: { accountHolderName, accountNumber, ifscCode, bankName, accountType }
//
//  NOTE: In production, encrypt accountNumber before storing.
//  For this project we store plain text (acceptable for MVP).
// ─────────────────────────────────────────────────────────────────────────────
export const saveBankDetails = asyncHandler(async (req, res) => {
    if (req.user.role !== "counsellor")
        throw new ApiError(403, "Only counsellors can add bank details");

    const { accountHolderName, accountNumber, ifscCode, bankName, accountType, upiId } = req.body;

    if (!accountHolderName?.trim())
        throw new ApiError(400, "Account holder name is required");
    if (!accountNumber?.trim() || !/^\d{9,18}$/.test(accountNumber.replace(/\s/g, "")))
        throw new ApiError(400, "Valid account number (9–18 digits) is required");
    if (!ifscCode?.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase()))
        throw new ApiError(400, "Valid IFSC code is required (e.g. SBIN0001234)");
    if (!bankName?.trim())
        throw new ApiError(400, "Bank name is required");

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                "bankDetails.accountHolderName": accountHolderName.trim(),
                "bankDetails.accountNumber":     accountNumber.replace(/\s/g, ""),
                "bankDetails.ifscCode":          ifscCode.trim().toUpperCase(),
                "bankDetails.bankName":          bankName.trim(),
                "bankDetails.accountType":       accountType || "savings",
                "bankDetails.upiId":             upiId?.trim().toLowerCase() || "",
                "bankDetails.hasDetails":        true,
                "bankDetails.isVerified":        false,  // reset on update
                "bankDetails.verifiedAt":        null,
            },
        },
        { new: true, select: "fullName bankDetails.hasDetails bankDetails.isVerified bankDetails.bankName" }
    );

    return res.status(200).json(new ApiResponse(200, {
        hasDetails: true,
        isVerified: false,
        bankName:   user.bankDetails.bankName,
        message:    "Bank details saved. Our team will verify within 1–2 business days before releasing payouts.",
    }, "Bank details saved successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET BANK DETAILS  (counsellor — masked)
//  GET /api/v1/ads/bank-details
// ─────────────────────────────────────────────────────────────────────────────
export const getBankDetails = asyncHandler(async (req, res) => {
    if (req.user.role !== "counsellor")
        throw new ApiError(403, "Only counsellors can view bank details");

    const user = await User.findById(req.user._id)
        .select("+bankDetails.accountHolderName +bankDetails.accountNumber +bankDetails.ifscCode +bankDetails.bankName +bankDetails.upiId +bankDetails.accountType +bankDetails.isVerified +bankDetails.verifiedAt +bankDetails.hasDetails");

    if (!user.bankDetails?.hasDetails) {
        return res.status(200).json(new ApiResponse(200, { hasDetails: false }, "No bank details saved"));
    }

    const acct = user.bankDetails.accountNumber || "";
    const masked = acct.length > 4
        ? "X".repeat(acct.length - 4) + acct.slice(-4)
        : acct;

    return res.status(200).json(new ApiResponse(200, {
        hasDetails:          true,
        accountHolderName:   user.bankDetails.accountHolderName,
        accountNumberMasked: masked,
        ifscCode:            user.bankDetails.ifscCode,
        bankName:            user.bankDetails.bankName,
        accountType:         user.bankDetails.accountType,
        upiId:               user.bankDetails.upiId || "",
        isVerified:          user.bankDetails.isVerified,
        verifiedAt:          user.bankDetails.verifiedAt,
    }, "Bank details fetched"));
});
