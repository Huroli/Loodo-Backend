import mongoose from 'mongoose';

// Media modeli oluşturuluyor.
const mediaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: null },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    metadata: { type: [String], required: true },
    fileUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: null },
    tags: { type: [String], default: [] },
    price: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },
    comments: { type: [mongoose.Schema.Types.ObjectId], ref: 'Comment', default: [] },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
});

export default mongoose.model('Media', mediaSchema, 'media');