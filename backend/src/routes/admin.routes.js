import { Router }        from "express";  
import { verifyJWT }      from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authoriseRoles.middleware.js";
import {
    getPendingUsers,
    approveUser,
    rejectUser,
    getAllUsers,
    getUserDetail,
    terminateUser,
    restoreUser,
    getAllPayments,
    getDisputes,
    resolveDispute,
    getPendingPayouts,
    markPayoutPaid,
} from "../controllers/adminController.js";

const router = Router();
router.use(verifyJWT, authorizeRoles("admin"));

// ── Counsellor approval ───────────────────────────────────────────────────────
router.get("/pending-users",              getPendingUsers);
router.put("/approve/:id",                approveUser);
router.put("/reject/:id",                 rejectUser);

// ── Full user management ──────────────────────────────────────────────────────
router.get("/users",                      getAllUsers);
router.get("/users/:id",                  getUserDetail);
router.delete("/users/:id/terminate",     terminateUser);
router.put("/users/:id/restore",          restoreUser);

// ── Payment logs ──────────────────────────────────────────────────────────────
router.get("/payments",                   getAllPayments);

// ── Payout management ─────────────────────────────────────────────────────────
router.get("/payouts",                        getPendingPayouts);
router.patch("/payouts/:bookingId/mark-paid", markPayoutPaid);

// ── Disputes ──────────────────────────────────────────────────────────────────
router.get("/disputes",                   getDisputes);
router.patch("/disputes/:bookingId/resolve", resolveDispute);

export default router;
