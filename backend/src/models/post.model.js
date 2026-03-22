import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
    url:        { type: String, required: true },
    publicId:   { type: String, required: true }, // Cloudinary public_id for deletion
    type:       { type: String, enum: ['image', 'video'], required: true },
    thumbnail:  { type: String },                 // video thumbnail URL from Cloudinary
}, { _id: false });

const replySchema = new mongoose.Schema({
    content:     { type: String, required: true },
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },
    deletedAt:   { type: Date, default: null },
    deletedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt:   { type: Date, default: Date.now },
});

const reportSchema = new mongoose.Schema({
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason:     { type: String, required: true },
    createdAt:  { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
    title:       { type: String, required: true },
    description: { type: String, required: true },
    tags:        [String],
    category:    { type: String, required: true },
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    isAnonymous: { type: Boolean, default: false },

    // ── Media attachments (images + videos) ───────────────────────────────
    media: { type: [mediaSchema], default: [] },

    supportCount: { type: Number, default: 0 },
    supportedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    replies:     [replySchema],

    reports:     [reportSchema],
    reportCount: { type: Number, default: 0 },
    isFlagged:   { type: Boolean, default: false },

    deletedAt:    { type: Date, default: null },
    deletedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deleteReason: { type: String, default: null },

}, { timestamps: true });

postSchema.index({ category: 1, deletedAt: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);
