import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    updateAccountDetails,
    approveUser,
    forgotPassword,
    resetPassword,
    getMe,
    updateGovtId,
    getGovtId,
    verifyGovtId,
} from "../controllers/user.controller.js";
import { User }            from "../models/user.model.js";
import { upload }          from "../middlewares/multer.middleware.js";
import { verifyJWT }       from "../middlewares/auth.middleware.js";
import { authorizeRoles }  from "../middlewares/authoriseRoles.middleware.js";

const router = Router();

// ─────────────────────────────────────────────────────────────
//  PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────
router.post(
    "/register",
    upload.fields([
        { name: "avatar",      maxCount: 1 },
        { name: "coverImage",  maxCount: 1 },
    ]),
    registerUser
);

router.post("/login",                       loginUser);
router.post("/refresh-token",               refreshAccessToken);
router.post("/forgot-password",             forgotPassword);
router.post("/reset-password/:token",       resetPassword);

// ─────────────────────────────────────────────────────────────
//  PROTECTED ROUTES  (any authenticated user)
// ─────────────────────────────────────────────────────────────
router.post  ("/logout",          verifyJWT, logoutUser);
router.post  ("/change-password", verifyJWT, changeCurrentPassword);
router.get   ("/current-user",    verifyJWT, getCurrentUser);
router.get   ("/me",              verifyJWT, getMe);
router.patch ("/update-account",  verifyJWT, updateAccountDetails);
router.patch ("/avatar",          verifyJWT, upload.single("avatar"),      updateUserAvatar);
router.patch ("/cover-image",     verifyJWT, upload.single("coverImage"),  updateUserCoverImage);

// ── Govt ID ───────────────────────────────────────────────────
router.get   ("/govt-id",  verifyJWT, getGovtId);
router.patch ("/govt-id",  verifyJWT, updateGovtId);

// ── Session fee (counsellor or admin) ─────────────────────────
// PATCH /api/v1/users/session-fee   { sessionFee: Number }
// sessionFee = 0  → free sessions
// sessionFee = 299 → ₹299 per session
router.patch(
    "/session-fee",
    verifyJWT,
    authorizeRoles("counsellor", "admin"),
    async (req, res) => {
        try {
            const fee = Number(req.body.sessionFee);
            if (isNaN(fee) || fee < 0 || fee > 5000)
                return res.status(400).json({ success: false, message: "Fee must be between ₹0 and ₹5000" });

            const updated = await User.findByIdAndUpdate(
                req.user._id,
                { sessionFee: fee },
                { new: true, select: "fullName sessionFee" }
            );

            return res.status(200).json({
                success: true,
                data:    { sessionFee: updated.sessionFee },
                message: fee === 0 ? "Sessions set to free" : `Session fee updated to ₹${fee}`,
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────
//  ADMIN-ONLY ROUTES
// ─────────────────────────────────────────────────────────────
router.patch("/approve/:id",          verifyJWT, authorizeRoles("admin"), approveUser);
router.patch("/verify-govt-id/:userId", verifyJWT, authorizeRoles("admin"), verifyGovtId);

export default router;
