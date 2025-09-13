import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  content: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [String],
  category: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supportCount: { type: Number, default: 0 },
  supportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [replySchema]
}, { timestamps: true });

export default mongoose.model('Post', postSchema);