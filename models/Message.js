import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' }, // nếu là group chat
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // nếu là 1-1 chat
    isGroup: { type: Boolean, default: false },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // đã đọc
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);