import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isGroup: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('ChatRoom', chatRoomSchema);