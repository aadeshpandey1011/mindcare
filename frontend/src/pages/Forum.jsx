import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPosts, createPost, deletePost, toggleSupport, addReply } from '../api/forumApi';

const Forum = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState('Stress');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', description: '', tags: '' });
  const [loading, setLoading] = useState(false);
  const [replyInputs, setReplyInputs] = useState({});
  const [showReplies, setShowReplies] = useState({});

  const categories = [
    { name: 'Stress', icon: '😰', color: 'from-red-400 to-pink-500' },
    { name: 'Exams', icon: '📚', color: 'from-blue-400 to-indigo-500' },
    { name: 'Sleep', icon: '😴', color: 'from-purple-400 to-blue-500' },
    { name: 'Relationships', icon: '💝', color: 'from-pink-400 to-rose-500' }
  ];

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await getPosts(category);
      console.log('Fetched posts:', res.data);
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!newPost.title || !newPost.description) {
      alert('Title and Description are required');
      return;
    }

    if (!user || !user.id) {
      alert('You must be logged in to create a post');
      return;
    }

    const payload = {
      title: newPost.title,
      description: newPost.description,
      tags: newPost.tags.split(',').map((tag) => tag.trim()).filter(tag => tag),
      category,
      userId: user.id || user.id,
    };

    try {
      setLoading(true);
      await createPost(payload);
      setNewPost({ title: '', description: '', tags: '' });
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!user || !user._id) {
      alert('You must be logged in to delete a post');
      return;
    }

    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId, user._id);
        fetchPosts(); // Refresh posts
      } catch (err) {
        console.error('Error deleting post:', err);
        alert('Failed to delete post. You can only delete your own posts.');
      }
    }
  };

  const handleSupport = async (postId) => {
    if (!user || !user._id) {
      alert('You must be logged in to support a post');
      return;
    }

    try {
      const res = await toggleSupport(postId, user._id);
      // Update the specific post in the posts array
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId
            ? { ...post, supportCount: res.data.supportCount, hasSupported: res.data.hasSupported }
            : post
        )
      );
    } catch (err) {
      console.error('Error toggling support:', err);
      alert('Failed to toggle support. Please try again.');
    }
  };

  const handleReplySubmit = async (postId) => {
    const replyContent = replyInputs[postId];
    if (!replyContent || !replyContent.trim()) {
      alert('Reply content is required');
      return;
    }

    if (!user || !user._id) {
      alert('You must be logged in to reply');
      return;
    }

    try {
      const res = await addReply(postId, replyContent.trim(), user._id);
      // Update the specific post with new reply
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? res.data : post
        )
      );
      // Clear the reply input
      setReplyInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Error adding reply:', err);
      alert('Failed to add reply. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUserDisplayName = (post) => {
    if (!post.userId) return 'Anonymous User';
    return post.userId.name || post.userId.fullName || post.userId.username || 'Anonymous User';
  };

  const getUserProfilePicture = (post) => {
    return post.userId?.profilePicture || null;
  };

  const renderUserAvatar = (post, size = 'w-14 h-14') => {
    const displayName = getUserDisplayName(post);
    const profilePicture = getUserProfilePicture(post);
    const currentCategory = categories.find(cat => cat.name === category);

    if (profilePicture) {
      return (
        <img
          src={profilePicture}
          alt={`${displayName}'s profile`}
          className={`${size} rounded-full object-cover shadow-lg border-2 border-white`}
        />
      );
    }

    return (
      <div className={`${size} rounded-full bg-gradient-to-br ${currentCategory.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
        {getInitials(displayName)}
      </div>
    );
  };

  const renderReplyAvatar = (reply, size = 'w-8 h-8') => {
    const displayName = reply.userId?.name || reply.userId?.fullName || reply.userId?.username || 'Anonymous User';
    const profilePicture = reply.userId?.profilePicture;
    const currentCategory = categories.find(cat => cat.name === category);

    if (profilePicture) {
      return (
        <img
          src={profilePicture}
          alt={`${displayName}'s profile`}
          className={`${size} rounded-full object-cover shadow-lg border-2 border-white`}
        />
      );
    }

    return (
      <div className={`${size} rounded-full bg-gradient-to-br ${currentCategory.color} flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
        {getInitials(displayName)}
      </div>
    );
  };

  const currentCategory = categories.find(cat => cat.name === category);
  const isPostOwner = (post) => user && user._id && post.userId && post.userId._id === user._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentCategory.color} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
              {currentCategory.icon}
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Peer Support Forum
              </h1>
              <p className="text-gray-600 mt-1">Connect, share, and support each other</p>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className={`group relative px-6 py-3 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  category === cat.name
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg shadow-black/20`
                    : 'bg-white/70 text-gray-700 hover:bg-white border border-gray-200 hover:shadow-md'
                }`}
                onClick={() => setCategory(cat.name)}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  {cat.name}
                </span>
                {category === cat.name && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Create New Post */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl mb-8 overflow-hidden">
          <div className={`h-1 bg-gradient-to-r ${currentCategory.color}`}></div>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.fullName}'s profile`}
                  className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {getInitials(user?.fullName)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Create a New Post</h2>
                <p className="text-gray-600">Share your thoughts with the community</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="What's on your mind?"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none text-lg"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
              </div>

              <div>
                <textarea
                  placeholder="Tell us more about it..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none h-32"
                  value={newPost.description}
                  onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Add tags (comma separated)"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                />
              </div>

              <div className="flex justify-end">
                <button
                  className={`px-8 py-4 bg-gradient-to-r ${currentCategory.color} text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none`}
                  onClick={handlePostSubmit}
                  disabled={loading}
                >
                  {loading ? 'Posting...' : 'Share Post'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/20 p-12 text-center">
              <div className="text-6xl mb-4">{currentCategory.icon}</div>
              <h3 className="text-2xl font-bold text-gray-600 mb-2">No posts yet</h3>
              <p className="text-gray-500">Be the first to share something about {category.toLowerCase()}!</p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post._id}
                className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="p-8">
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {renderUserAvatar(post)}
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                          {getUserDisplayName(post)}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-2 bg-gradient-to-r ${currentCategory.color} text-white rounded-full text-sm font-medium shadow-md`}>
                        {currentCategory.icon} {category}
                      </span>
                      {isPostOwner(post) && (
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete post"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {post.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm rounded-full border border-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                    <button 
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                      onClick={() => handleSupport(post._id)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="font-medium">Support ({post.supportCount || 0})</span>
                    </button>
                    <button 
                      className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                      onClick={() => setShowReplies(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium">Reply ({post.replies?.length || 0})</span>
                    </button>
                  </div>

                  {/* Reply Section */}
                  {showReplies[post._id] && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      {/* Reply Input */}
                      <div className="mb-4">
                        <div className="flex gap-3">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={`${user.fullName}'s profile`}
                              className="w-8 h-8 rounded-full object-cover shadow-lg border-2 border-white"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                              {getInitials(user?.fullName)}
                            </div>
                          )}
                          <div className="flex-1 flex gap-2">
                            <textarea
                              placeholder="Write a reply..."
                              className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none h-20"
                              value={replyInputs[post._id] || ''}
                              onChange={(e) => setReplyInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                            />
                            <button
                              onClick={() => handleReplySubmit(post._id)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 h-fit self-end"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Existing Replies */}
                      {post.replies && post.replies.length > 0 && (
                        <div className="space-y-4">
                          {post.replies.map((reply, idx) => (
                            <div key={idx} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                              {renderReplyAvatar(reply)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-800 text-sm">
                                    {reply.userId?.name || reply.userId?.fullName || reply.userId?.username || 'Anonymous User'}
                                  </h4>
                                  <span className="text-gray-500 text-xs">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 p-6 inline-block">
            <p className="text-gray-600 flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <span className="font-medium">Moderated by student volunteers</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;