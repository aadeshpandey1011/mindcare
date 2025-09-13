// routes/admin.routes.js
import express from "express";
import { authorizeRoles } from "../middlewares/authoriseRoles.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getPendingUsers, approveUser } from "../controllers/adminController.js";

const router = express.Router();

router.use(verifyJWT, authorizeRoles("admin"));

router.get("/pending-users", getPendingUsers);
router.put("/approve/:id", approveUser);

export default router;
