import express from 'express';
import {
    createPost,
    getPostsByCategory,
    deletePost,
    toggleSupport,
    addReply,
    reportPost,
    adminDeletePost,
    adminDeleteReply,
    restorePost,
    dismissReports,
    warnUser,
    banUser,
    unbanUser,
} from '../controllers/post.controller.js';
import { verifyJWT }      from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/authoriseRoles.middleware.js';
import { uploadMedia }    from '../middlewares/multer.middleware.js';

const router = express.Router();
const admin  = [verifyJWT, authorizeRoles('admin')];

// ── User routes ───────────────────────────────────────────────────────────────
router.get('/posts',                              getPostsByCategory);
// createPost now accepts multipart/form-data with up to 4 media files
router.post('/posts',                             uploadMedia.array('media', 4), createPost);
router.delete('/posts/:postId',                   deletePost);
router.post('/posts/:postId/support',             toggleSupport);
router.post('/posts/:postId/reply',               addReply);
router.post('/posts/:postId/report',              reportPost);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.delete('/posts/:postId/admin',             ...admin, adminDeletePost);
router.post('/posts/:postId/restore',             ...admin, restorePost);
router.post('/posts/:postId/dismiss-reports',     ...admin, dismissReports);
router.post('/posts/:postId/warn',                ...admin, warnUser);
router.delete('/posts/:postId/replies/:replyId',  ...admin, adminDeleteReply);
router.post('/users/:userId/ban',                 ...admin, banUser);
router.post('/users/:userId/unban',               ...admin, unbanUser);

export default router;
