import mongoose from 'mongoose';

// User modeli oluşturuluyor.
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    nickname: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    hashedPassword: { type: String, required: true },
    birthday: { type: Date, default: null },
    job: { type: String, default: null },
    interests: { type: [String], default: [] },
    uploads: { type: [mongoose.Schema.Types.ObjectId], ref: 'Media', default: [] },
    purchases: { type: [mongoose.Schema.Types.ObjectId], ref: 'Purchase', default: [] },
    likedMedia: { type: [mongoose.Schema.Types.ObjectId], ref: 'Media', default: [] },
    savedMedia: { type: [mongoose.Schema.Types.ObjectId], ref: 'Media', default: [] },
    searchHistory: { type: [String], default: [] },
    avatarUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    status: { type: String, default: 'active' },
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
});

export default mongoose.model('User', userSchema, 'users');