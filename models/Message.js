import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isGroup: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);