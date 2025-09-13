import Post from '../models/post.model.js';

export const createPost = async (req, res) => {
  try {
    const { title, description, tags, category, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const newPost = await Post.create({
      title,
      description,
      tags,
      category,
      userId
    });
    
    // Populate user data before returning
    const populatedPost = await Post.findById(newPost._id)
      .populate({
        path: 'userId',
        select: 'fullName name email username profilePicture'
      })
      .populate({
        path: 'replies.userId',
        select: 'fullName name email username profilePicture'
      });
    
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Error creating post', error: err.message });
  }
};

export const getPostsByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    
    const posts = await Post.find({ category })
      .populate({
        path: 'userId',
        select: 'fullName name email username profilePicture'
      })
      .populate({
        path: 'replies.userId',
        select: 'fullName name email username profilePicture'
      })
      .sort({ createdAt: -1 });
    
    // Transform the posts to ensure consistent naming
    const transformedPosts = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.userId) {
        // Map fullName to name for frontend consistency
        postObj.userId.name = postObj.userId.fullName;
        // Map avatar to profilePicture for frontend consistency
        postObj.userId.profilePicture = postObj.userId.avatar;
      }
      
      // Transform replies user data as well
      if (postObj.replies) {
        postObj.replies = postObj.replies.map(reply => {
          if (reply.userId) {
            reply.userId.name = reply.userId.fullName;
            reply.userId.profilePicture = reply.userId.avatar;
          }
          return reply;
        });
      }
      
      return postObj;
    });
    
    console.log('Posts with populated user:', JSON.stringify(transformedPosts, null, 2));
    res.status(200).json(transformedPosts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Error fetching posts', error: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if the user is the owner of the post
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    
    await Post.findByIdAndDelete(postId);
    
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Error deleting post', error: err.message });
  }
};

export const toggleSupport = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const hasSupported = post.supportedBy.includes(userId);
    
    if (hasSupported) {
      // Remove support
      post.supportedBy.pull(userId);
      post.supportCount = Math.max(0, post.supportCount - 1);
    } else {
      // Add support
      post.supportedBy.push(userId);
      post.supportCount += 1;
    }
    
    await post.save();
    
    const updatedPost = await Post.findById(postId)
      .populate({
        path: 'userId',
        select: 'fullName name email username profilePicture'
      })
      .populate({
        path: 'replies.userId',
        select: 'fullName name email username profilePicture'
      });
    
    res.status(200).json({
      supportCount: updatedPost.supportCount,
      hasSupported: !hasSupported,
      post: updatedPost
    });
  } catch (err) {
    console.error('Error toggling support:', err);
    res.status(500).json({ message: 'Error toggling support', error: err.message });
  }
};

export const addReply = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, userId } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ message: 'User ID and content are required' });
    }
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const newReply = {
      content,
      userId,
      createdAt: new Date()
    };
    
    post.replies.push(newReply);
    await post.save();
    
    const updatedPost = await Post.findById(postId)
      .populate({
        path: 'userId',
        select: 'fullName name email username profilePicture'
      })
      .populate({
        path: 'replies.userId',
        select: 'fullName name email username profilePicture'
      });
    
    res.status(200).json(updatedPost);
  } catch (err) {
    console.error('Error adding reply:', err);
    res.status(500).json({ message: 'Error adding reply', error: err.message });
  }
};