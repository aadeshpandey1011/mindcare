// import { Router } from "express";
// import { 
//     loginUser, 
//     logoutUser, 
//     registerUser, 
//     refreshAccessToken, 
//     changeCurrentPassword, 
//     getCurrentUser, 
//     updateUserAvatar, 
//     updateUserCoverImage, 
//     getUserChannelProfile, 
//     getWatchHistory, 
//     updateAccountDetails
// } from "../controllers/user.controller.js";
// import {upload} from "../middlewares/multer.middleware.js"
// import { verifyJWT } from "../middlewares/auth.middleware.js";


// const router = Router()

// router.route("/register").post(
//     upload.fields([
//         {
//             name: "avatar",
//             maxCount: 1
//         }, 
//         {
//             name: "coverImage",
//             maxCount: 1
//         }
//     ]),
//     registerUser
//     )

// router.route("/login").post(loginUser)

// //secured routes
// router.route("/logout").post(verifyJWT,  logoutUser)
// router.route("/refresh-token").post(refreshAccessToken)
// router.route("/change-password").post(verifyJWT, changeCurrentPassword)
// router.route("/current-user").get(verifyJWT, getCurrentUser)
// router.route("/update-account").patch(verifyJWT, updateAccountDetails)

// router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
// router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

// router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
// router.route("/history").get(verifyJWT, getWatchHistory)

// export default router




















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
    getUserChannelProfile, 
    getWatchHistory, 
    updateAccountDetails,
    approveUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authoriseRoles.middleware.js"; // ✅ new import

import { forgotPassword, resetPassword } from "../controllers/user.controller.js";

const router = Router();

// ---------------------- PUBLIC ROUTES ----------------------
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);
// user.routes.js
// FOR ADMIN TO APPROVE USER
router.route("/approve/:id").patch(
  verifyJWT,
  authorizeRoles("admin"),
  approveUser
);


router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// ---------------------- PROTECTED ROUTES ----------------------
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);



router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);


export default router