// routes/admin.routes.js
import express            from "express";
import { authorizeRoles } from "../middlewares/authoriseRoles.middleware.js";
import { verifyJWT }      from "../middlewares/auth.middleware.js";
import {
    getPendingUsers,
    approveUser,
    rejectUser,
    getAllUsers,
    getUserDetail,
    terminateUser,
    restoreUser,
    getAllPayments,
} from "../controllers/adminController.js";

const router = express.Router();
router.use(verifyJWT, authorizeRoles("admin"));

// ── Counsellor approval ───────────────────────────────────────────────────────
router.get("/pending-users",       getPendingUsers);
router.put("/approve/:id",         approveUser);
router.put("/reject/:id",          rejectUser);

// ── Full user management ──────────────────────────────────────────────────────
router.get("/users",               getAllUsers);
router.get("/users/:id",           getUserDetail);
router.delete("/users/:id/terminate", terminateUser);
router.put("/users/:id/restore",   restoreUser);

// ── Payment logs (admin view) ─────────────────────────────────────────────────
router.get("/payments",            getAllPayments);

export default router;
