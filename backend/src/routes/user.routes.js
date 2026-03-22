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
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authoriseRoles.middleware.js";

const router = Router();

// ─────────────────────────────────────────────────────────────
//  PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────
router.post(
    "/register",
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ─────────────────────────────────────────────────────────────
//  PROTECTED ROUTES  (any authenticated user)
// ─────────────────────────────────────────────────────────────
router.post("/logout", verifyJWT, logoutUser);
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.get("/current-user", verifyJWT, getCurrentUser);
router.get("/me", verifyJWT, getMe);

router.patch(
    "/update-account",
    verifyJWT,
    updateAccountDetails
);
router.patch("/avatar", verifyJWT, upload.single("avatar"), updateUserAvatar);
router.patch("/cover-image", verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// ── Government ID routes ──────────────────────────────────────
// GET  /api/v1/users/govt-id          → returns masked IDs for the logged-in user
router.get("/govt-id", verifyJWT, getGovtId);

// PATCH /api/v1/users/govt-id         → user updates their own Aadhar/PAN
router.patch("/govt-id", verifyJWT, updateGovtId);

// ─────────────────────────────────────────────────────────────
//  ADMIN-ONLY ROUTES
// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/users/approve/:id      → approve a pending user
router.patch("/approve/:id", verifyJWT, authorizeRoles("admin"), approveUser);

// PATCH /api/v1/users/verify-govt-id/:userId  → admin marks a user's ID as verified
router.patch(
    "/verify-govt-id/:userId",
    verifyJWT,
    authorizeRoles("admin"),
    verifyGovtId
);

export default router;
