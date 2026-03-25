import { Router }      from "express";
import { verifyJWT }    from "../middlewares/auth.middleware.js";
import { optionalJWT }  from "../middlewares/optionalAuth.middleware.js";
import {
    createScreening,
    getMyScreenings,
    getScreening,
    updateGoalProgress,
    adminGetScreenings,
} from "../controllers/screening.controller.js";

const router = Router();

// ── POST / — works for guests AND logged-in users ─────────────────────────────
// optionalJWT sets req.user if a token is present, null otherwise.
// The controller checks req.user and attaches the userId only when authenticated.
// This is why history wasn't saving — the old route had verifyJWT AFTER the POST
// route declaration, so req.user was always undefined during POST.
router.post("/", optionalJWT, createScreening);

// ── All routes below require authentication ────────────────────────────────────
router.use(verifyJWT);
router.get("/me",                    getMyScreenings);
router.get("/admin",                 adminGetScreenings);
router.get("/:id",                   getScreening);
router.patch("/:id/goals/:goalId",   updateGoalProgress);

export default router;
