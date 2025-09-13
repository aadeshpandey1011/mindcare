// import { Router } from 'express';
// import {
//     getChannelStats,
//     getChannelVideos,
// } from "../controllers/dashboard.controller.js"
// import {verifyJWT} from "../middlewares/auth.middleware.js"

// const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router.route("/stats").get(getChannelStats);
// router.route("/videos").get(getChannelVideos);

// export default router






// routes/dashboard.routes.js
import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();
// router.get("/stats", verifyJWT, getDashboardStats);
router.get("/stats", verifyJWT, isAdmin, getDashboardStats);

export default router;
