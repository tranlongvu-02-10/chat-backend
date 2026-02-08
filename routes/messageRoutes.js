import express from 'express';
import Message from '../models/Message.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/messages/:chatId
// :chatId có thể là userId (1-1) hoặc roomId (group)
// Query params:
// - isGroup: true/false (bắt buộc để biết loại chat)
// - page: số trang (default 1)
// - limit: số tin nhắn/trang (default 20)

router.get('/:chatId', authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { isGroup, page = 1, limit = 20 } = req.query;

        if (!isGroup) {
            return res.status(400).json({ success: false, msg: 'Thiếu tham số isGroup (true/false)' });
        }

        const isGroupChat = isGroup === 'true';
        const currentUserId = req.user.id;
        const query = {};

        if (isGroupChat) {
            // Group chat: tìm theo chatRoom
            query.chatRoom = chatId;
            query.isGroup = true;
        } else {
            // 1-1 chat: tìm tin nhắn giữa 2 người
            query.$or = [
                { sender: currentUserId, receiver: chatId },
                { sender: chatId, receiver: currentUserId }
            ];
            query.isGroup = false;
        }

        // Phân trang
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const perPage = parseInt(limit);

        // Lấy tin nhắn, populate sender để lấy username
        const messages = await Message.find(query)
            .populate('sender', 'username') // chỉ lấy username của người gửi
            .sort({ createdAt: -1 }) // mới nhất trước
            .skip(skip)
            .limit(perPage);

        // Đếm tổng tin nhắn để biết có trang tiếp theo
        const total = await Message.countDocuments(query);

        // Đánh dấu đã đọc
        res.json({
            success: true,
            data: messages,
            pagination: {
                total,
                page: parseInt(page),
                limit: perPage,
                totalPages: Math.ceil(total / perPage),
            }
        });
    } catch (err) {
        console.error('Error getting messages:', err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
});

// POST /api/messages/mark-read
// Đánh dấu tất cả tin nhắn chưa đọc trong phòng chat là đã đọc bởi user
router.post('/mark-read', authMiddleware, async (req, res) => {
    try {
        const { chatId, isGroup } = req.body;
        const currentUserId = req.user.id;

        if (!chatId || isGroup === undefined) {
            return res.status(400).json({ success: false, msg: 'Thiếu chatId hoặc isGroup' });
        }

        const query = {};

        if (isGroup === true) {
            query.chatRoom = chatId;
            query.isGroup = true;
        } else {
            query.$or = [
                { sender: currentUserId, receiver: chatId },
                { sender: chatId, receiver: currentUserId }
            ];
            query.isGroup = false;
        }

        // Tìm tất cả tin nhắn chưa được currentUser đọc
        const unreadMessages = await Message.find({
            ...query,
            readBy: { $nin: [currentUserId] } // chưa có user này trong readBy
        });

        if (unreadMessages.length === 0) {
            return res.json({ success: true, msg: 'Không có tin nhắn chưa đọc' });
        }

        // Đánh dấu đã đọc
        await Message.updateMany(
            { _id: { $in: unreadMessages.map(m => m._id) } },
            { $addToSet: { readBy: currentUserId } }
        );

        res.json({
            success: true,
            msg: `Đã đánh dấu ${unreadMessages.length} tin nhắn là đã đọc`,
            count: unreadMessages.length
        });
    } catch (err) {
        console.error('Error marking messages as read:', err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
});

export default router;