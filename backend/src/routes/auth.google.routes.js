import { Router } from "express";
import passport   from "../utils/googleAuth.js";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Step 1: redirect user to Google's consent screen ──────────────────────
// GET /api/v1/auth/google
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    })
);

// ── Step 2: Google redirects back here after user consents ────────────────
// GET /api/v1/auth/google/callback
router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${FRONTEND_URL}/login?error=google_failed`,
    }),
    (req, res) => {
        try {
            const user = req.user;

            // Generate our own JWT — same structure as normal login
            const accessToken  = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();

            // Save refresh token
            user.refreshToken = refreshToken;
            user.save({ validateBeforeSave: false }).catch(console.error);

            // Build safe user object (same shape as loginUser response)
            const safeUser = {
                id:         user._id,
                fullName:   user.fullName,
                email:      user.email,
                username:   user.username,
                avatar:     user.avatar,
                role:       user.role,
                isApproved: user.isApproved,
                authProvider: user.authProvider,
            };

            // Redirect to frontend with token in query string
            // Frontend reads this, stores in localStorage, then removes from URL
            const params = new URLSearchParams({
                token: accessToken,
                user:  JSON.stringify(safeUser),
            });

            return res.redirect(`${FRONTEND_URL}/auth/google/success?${params.toString()}`);
        } catch (err) {
            console.error("Google callback error:", err);
            return res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
        }
    }
);

export default router;
