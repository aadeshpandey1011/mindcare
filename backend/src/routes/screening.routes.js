import { Router } from "express";
import { createScreening, getMyScreenings } from "../controllers/screening.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.post("/", verifyJWT, createScreening);
router.get("/me", verifyJWT, getMyScreenings);
export default router;

