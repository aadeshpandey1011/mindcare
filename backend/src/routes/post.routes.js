import express from 'express';
import { 
  createPost, 
  getPostsByCategory, 
  deletePost, 
  toggleSupport, 
  addReply 
} from '../controllers/post.controller.js';

const router = express.Router();

router.post('/posts', createPost);
router.get('/posts', getPostsByCategory);
router.delete('/posts/:postId', deletePost);
router.post('/posts/:postId/support', toggleSupport);
router.post('/posts/:postId/reply', addReply);

export default router;