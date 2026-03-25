import { Router }        from "express";
import { verifyJWT }      from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authoriseRoles.middleware.js";
import {
    getMyResourceData,
    toggleBookmark,
    updateProgress,
    rateResource,
    getResourceRatings,
    recommendResource,
    markRecommendationRead,
    getAdminAnalytics,
    adminDeleteComment,
} from "../controllers/resource.controller.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/:resourceId/ratings", getResourceRatings);

// ── Authenticated ─────────────────────────────────────────────────────────────
router.use(verifyJWT);

router.get("/my-data",                             getMyResourceData);
router.post("/bookmark",                           toggleBookmark);
router.post("/progress",                           updateProgress);
router.post("/rate",                               rateResource);
router.patch("/recommendations/:id/read",          markRecommendationRead);

// Counsellor + admin
router.post("/recommend",  authorizeRoles("counsellor", "admin"), recommendResource);

// Admin only
router.get("/admin/analytics",                     authorizeRoles("admin"), getAdminAnalytics);
router.delete("/admin/comments/:id",               authorizeRoles("admin"), adminDeleteComment);

export default router;
