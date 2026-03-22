import Post from '../models/post.model.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

const AUTO_BAN_THRESHOLD  = 3;
const AUTO_FLAG_THRESHOLD = 3;
const MAX_MEDIA_PER_POST  = 4;

// ── helpers ───────────────────────────────────────────────────────────────────
const populatePost = (query) =>
    query
        .populate({ path: 'userId',             select: 'fullName name email username avatar profilePicture forumWarningCount isBannedFromForum' })
        .populate({ path: 'replies.userId',     select: 'fullName name email username avatar profilePicture' })
        .populate({ path: 'reports.reportedBy', select: 'fullName username' });

const transformPost = (postObj, requestingUserId = null, isAdmin = false) => {
    const isAnon = postObj.isAnonymous;
    const isSelf = requestingUserId && postObj.userId?._id?.toString() === requestingUserId.toString();

    if (isAnon && !isSelf && !isAdmin) {
        postObj.userId = { _id: postObj.userId?._id, fullName: 'Anonymous', name: 'Anonymous', username: 'anonymous', avatar: null, profilePicture: null };
    } else if (postObj.userId) {
        postObj.userId.name = postObj.userId.fullName;
        postObj.userId.profilePicture = postObj.userId.profilePicture || postObj.userId.avatar;
    }

    if (postObj.replies) {
        postObj.replies = postObj.replies
            .filter(r => isAdmin || !r.deletedAt)
            .map(r => {
                if (r.userId) {
                    r.userId.name = r.userId.fullName;
                    r.userId.profilePicture = r.userId.profilePicture || r.userId.avatar;
                }
                return r;
            });
    }

    if (!isAdmin) delete postObj.reports;
    return postObj;
};

/**
 * Parse boolean that may arrive as string "true"/"false" from FormData,
 * or as an actual boolean from JSON body.
 */
const parseBool = (val) => val === true || val === 'true';

const uploadToCloudinary = async (file) => {
    const isVideo = file.mimetype.startsWith('video/');
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: isVideo ? 'video' : 'image',
            folder: 'mindcare/forum',
            ...(isVideo && { eager: [{ width: 400, height: 300, crop: 'fill', format: 'jpg' }] }),
        });
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return {
            url:       result.secure_url,
            publicId:  result.public_id,
            type:      isVideo ? 'video' : 'image',
            thumbnail: isVideo && result.eager?.[0]?.secure_url ? result.eager[0].secure_url : null,
        };
    } catch (err) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        throw err;
    }
};

// ── CREATE POST ───────────────────────────────────────────────────────────────
export const createPost = async (req, res) => {
    const uploadedFiles = req.files || [];
    try {
        const { title, description, tags, category, userId, isAnonymous } = req.body;
        if (!userId) return res.status(400).json({ message: 'User ID is required' });
        if (!title?.trim() || !description?.trim())
            return res.status(400).json({ message: 'Title and description are required' });

        const author = await User.findById(userId);
        if (!author)                 return res.status(404).json({ message: 'User not found' });
        if (author.isBannedFromForum) return res.status(403).json({ message: 'You have been banned from the forum.' });

        if (uploadedFiles.length > MAX_MEDIA_PER_POST)
            return res.status(400).json({ message: `Maximum ${MAX_MEDIA_PER_POST} media files per post` });

        const mediaItems = uploadedFiles.length > 0
            ? await Promise.all(uploadedFiles.map(uploadToCloudinary))
            : [];

        const parsedTags = typeof tags === 'string'
            ? tags.split(',').map(t => t.trim()).filter(Boolean)
            : (Array.isArray(tags) ? tags : []);

        const newPost = await Post.create({
            title:       title.trim(),
            description: description.trim(),
            tags:        parsedTags,
            category,
            userId,
            isAnonymous: parseBool(isAnonymous),   // ← FIX: handles "false" string correctly
            media:       mediaItems,
        });

        const populated = await populatePost(Post.findById(newPost._id));
        res.status(201).json(transformPost(populated.toObject(), userId, false));

    } catch (err) {
        uploadedFiles.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        console.error('Error creating post:', err);
        res.status(500).json({ message: 'Error creating post', error: err.message });
    }
};

// ── GET POSTS BY CATEGORY ─────────────────────────────────────────────────────
export const getPostsByCategory = async (req, res) => {
    try {
        const { category, showDeleted } = req.query;
        if (!category) return res.status(400).json({ message: 'Category is required' });

        const filter = { category };
        if (!showDeleted) filter.deletedAt = null;

        const posts = await populatePost(Post.find(filter).sort({ createdAt: -1 }));
        const requestingUserId = req.query.userId || null;
        const isAdmin = req.query.isAdmin === 'true';

        res.status(200).json(posts.map(p => transformPost(p.toObject(), requestingUserId, isAdmin)));
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: 'Error fetching posts', error: err.message });
    }
};

// ── USER — soft-delete own post ───────────────────────────────────────────────
export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'User ID is required' });

        const post = await Post.findById(postId);
        if (!post)          return res.status(404).json({ message: 'Post not found' });
        if (post.deletedAt) return res.status(400).json({ message: 'Post already deleted' });
        if (post.userId.toString() !== userId)
            return res.status(403).json({ message: 'You can only delete your own posts' });

        post.deletedAt    = new Date();
        post.deletedBy    = userId;
        post.deleteReason = 'Deleted by author';
        await post.save();

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ message: 'Error deleting post', error: err.message });
    }
};

// ── ADMIN — soft-delete any post ──────────────────────────────────────────────
export const adminDeletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { reason } = req.body;
        const adminId    = req.user._id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.deletedAt    = new Date();
        post.deletedBy    = adminId;
        post.deleteReason = reason?.trim() || 'Removed by admin';
        await post.save();

        res.status(200).json({ message: 'Post removed by admin' });
    } catch (err) {
        console.error('Admin delete error:', err);
        res.status(500).json({ message: 'Error removing post', error: err.message });
    }
};

// ── ADMIN — restore post ──────────────────────────────────────────────────────
export const restorePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.deletedAt    = null;
        post.deletedBy    = null;
        post.deleteReason = null;
        await post.save();

        res.status(200).json({ message: 'Post restored' });
    } catch (err) {
        res.status(500).json({ message: 'Error restoring post', error: err.message });
    }
};

// ── USER — report post ────────────────────────────────────────────────────────
export const reportPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, reason } = req.body;

        if (!userId || !reason?.trim())
            return res.status(400).json({ message: 'User ID and reason are required' });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const alreadyReported = post.reports.some(r => r.reportedBy.toString() === userId);
        if (alreadyReported)
            return res.status(409).json({ message: 'You have already reported this post' });

        post.reports.push({ reportedBy: userId, reason: reason.trim() });
        post.reportCount = post.reports.length;
        if (post.reportCount >= AUTO_FLAG_THRESHOLD) post.isFlagged = true;

        await post.save();
        res.status(200).json({ message: 'Report submitted. Thank you for helping keep the forum safe.', reported: true, flagged: post.isFlagged });
    } catch (err) {
        console.error('Report error:', err);
        res.status(500).json({ message: 'Error reporting post', error: err.message });
    }
};

// ── ADMIN — warn user (auto-ban at threshold) ─────────────────────────────────
export const warnUser = async (req, res) => {
    try {
        const { postId } = req.params;
        const { reason } = req.body;
        const adminId    = req.user._id;

        if (!reason?.trim()) return res.status(400).json({ message: 'Warning reason is required' });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const targetUser = await User.findById(post.userId);
        if (!targetUser) return res.status(404).json({ message: 'Post author not found' });

        targetUser.forumWarnings.push({ reason: reason.trim(), postId, issuedBy: adminId });
        targetUser.forumWarningCount = targetUser.forumWarnings.length;

        let autoBanned = false;
        if (targetUser.forumWarningCount >= AUTO_BAN_THRESHOLD && !targetUser.isBannedFromForum) {
            targetUser.isBannedFromForum = true;
            targetUser.bannedAt          = new Date();
            targetUser.bannedBy          = adminId;
            targetUser.banReason         = `Auto-banned after ${AUTO_BAN_THRESHOLD} warnings`;
            autoBanned = true;
        }

        await targetUser.save({ validateBeforeSave: false });
        res.status(200).json({ message: autoBanned ? `Warning issued and user auto-banned after ${AUTO_BAN_THRESHOLD} warnings` : `Warning issued to ${targetUser.fullName}`, warningCount: targetUser.forumWarningCount, autoBanned });
    } catch (err) {
        console.error('Warn user error:', err);
        res.status(500).json({ message: 'Error issuing warning', error: err.message });
    }
};

// ── ADMIN — ban user ──────────────────────────────────────────────────────────
export const banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const adminId    = req.user._id;

        if (!reason?.trim()) return res.status(400).json({ message: 'Ban reason is required' });

        const targetUser = await User.findById(userId);
        if (!targetUser)                 return res.status(404).json({ message: 'User not found' });
        if (targetUser.role === 'admin') return res.status(403).json({ message: 'Cannot ban an admin' });

        targetUser.isBannedFromForum = true;
        targetUser.bannedAt          = new Date();
        targetUser.bannedBy          = adminId;
        targetUser.banReason         = reason.trim();
        await targetUser.save({ validateBeforeSave: false });

        res.status(200).json({ message: `${targetUser.fullName} has been banned from the forum` });
    } catch (err) {
        console.error('Ban user error:', err);
        res.status(500).json({ message: 'Error banning user', error: err.message });
    }
};

// ── ADMIN — unban user ────────────────────────────────────────────────────────
export const unbanUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const targetUser = await User.findById(userId);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        targetUser.isBannedFromForum = false;
        targetUser.bannedAt  = undefined;
        targetUser.bannedBy  = undefined;
        targetUser.banReason = undefined;
        await targetUser.save({ validateBeforeSave: false });

        res.status(200).json({ message: `${targetUser.fullName} has been unbanned` });
    } catch (err) {
        console.error('Unban error:', err);
        res.status(500).json({ message: 'Error unbanning user', error: err.message });
    }
};

// ── ADMIN — soft-delete reply ─────────────────────────────────────────────────
export const adminDeleteReply = async (req, res) => {
    try {
        const { postId, replyId } = req.params;
        const adminId             = req.user._id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const reply = post.replies.id(replyId);
        if (!reply) return res.status(404).json({ message: 'Reply not found' });

        reply.deletedAt = new Date();
        reply.deletedBy = adminId;
        await post.save();

        res.status(200).json({ message: 'Reply removed' });
    } catch (err) {
        console.error('Delete reply error:', err);
        res.status(500).json({ message: 'Error removing reply', error: err.message });
    }
};

// ── ADMIN — dismiss reports ───────────────────────────────────────────────────
export const dismissReports = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.isFlagged   = false;
        post.reports     = [];
        post.reportCount = 0;
        await post.save();

        res.status(200).json({ message: 'Reports dismissed' });
    } catch (err) {
        res.status(500).json({ message: 'Error dismissing reports', error: err.message });
    }
};

// ── toggleSupport ─────────────────────────────────────────────────────────────
export const toggleSupport = async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'User ID is required' });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const hasSupported = post.supportedBy.includes(userId);
        if (hasSupported) { post.supportedBy.pull(userId); post.supportCount = Math.max(0, post.supportCount - 1); }
        else              { post.supportedBy.push(userId); post.supportCount += 1; }
        await post.save();

        res.status(200).json({ supportCount: post.supportCount, hasSupported: !hasSupported });
    } catch (err) {
        console.error('Error toggling support:', err);
        res.status(500).json({ message: 'Error toggling support', error: err.message });
    }
};

// ── addReply ──────────────────────────────────────────────────────────────────
export const addReply = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, userId, isAnonymous } = req.body;
        if (!userId || !content) return res.status(400).json({ message: 'User ID and content are required' });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.replies.push({
            content,
            userId,
            isAnonymous: parseBool(isAnonymous),   // ← FIX: same string-safe parse
            createdAt: new Date(),
        });
        await post.save();

        const updated = await populatePost(Post.findById(postId));
        res.status(200).json(transformPost(updated.toObject(), userId, false));
    } catch (err) {
        console.error('Error adding reply:', err);
        res.status(500).json({ message: 'Error adding reply', error: err.message });
    }
};
