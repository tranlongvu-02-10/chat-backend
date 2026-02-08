import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import User from '../models/User.js';
import ChatRoom from '../models/ChatRoom.js';

const setupChatSocket = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.user.id} - ${socket.user.username}`);

        // Cập nhật trạng thái online
        await User.findByIdAndUpdate(socket.user.id, { online: true });
        io.emit('userOnline', { userId: socket.user.id });

        // Join phòng chat (1-1 hoặc group) - giữ nguyên
        socket.on('joinChat', async ({ chatId, isGroup }) => {
            if (isGroup) {
                socket.join(`group_${chatId}`);
            } else {
                const otherUser = chatId;
                const room = [socket.user.id, otherUser].sort().join('_');
                socket.join(room);
            }
        });

        // Gửi tin nhắn - giữ nguyên
        socket.on('sendMessage', async ({ content, receiverId, chatRoomId, isGroup }) => {
            try {
                const messageData = {
                    sender: socket.user.id,
                    content,
                    timestamp: new Date(),
                };

                if (isGroup) {
                    messageData.chatRoom = chatRoomId;
                    messageData.isGroup = true;
                } else {
                    messageData.receiver = receiverId;
                }

                const message = await Message.create(messageData);

                if (isGroup) {
                    io.to(`group_${chatRoomId}`).emit('receiveMessage', {
                        ...message._doc,
                        senderName: socket.user.username,
                    });
                } else {
                    const room = [socket.user.id, receiverId].sort().join('_');
                    io.to(room).emit('receiveMessage', {
                        ...message._doc,
                        senderName: socket.user.username,
                    });
                }
            } catch (err) {
                console.error(err);
            }
        });

        // Typing indicator - giữ nguyên
        socket.on('typing', ({ chatId, isGroup }) => {
            if (isGroup) {
                socket.to(`group_${chatId}`).emit('userTyping', { userId: socket.user.id });
            } else {
                const room = [socket.user.id, chatId].sort().join('_');
                socket.to(room).emit('userTyping', { userId: socket.user.id });
            }
        });

        // ĐÁNH DẤU ĐÃ ĐỌC
        socket.on('markMessagesRead', async ({ chatId, isGroup }) => {
            try {
                const currentUserId = socket.user.id;

                if (!chatId || isGroup === undefined) {
                    return socket.emit('error', { msg: 'Thiếu chatId hoặc isGroup' });
                }

                const query = {};

                if (isGroup) {
                    query.chatRoom = chatId;
                    query.isGroup = true;
                } else {
                    query.$or = [
                        { sender: currentUserId, receiver: chatId },
                        { sender: chatId, receiver: currentUserId }
                    ];
                    query.isGroup = false;
                }

                // Tìm các tin nhắn chưa được user này đọc
                const unreadMessages = await Message.find({
                    ...query,
                    readBy: { $nin: [currentUserId] }
                });

                if (unreadMessages.length === 0) {
                    return socket.emit('messagesRead', { chatId, count: 0 });
                }

                // Đánh dấu đã đọc cho tất cả tin nhắn chưa đọc
                await Message.updateMany(
                    { _id: { $in: unreadMessages.map(m => m._id) } },
                    { $addToSet: { readBy: currentUserId } }
                );

                // Emit sự kiện đã đọc cho toàn bộ phòng chat
                const room = isGroup ? `group_${chatId}` : [socket.user.id, chatId].sort().join('_');
                io.to(room).emit('messagesRead', {
                    chatId,
                    userId: currentUserId,
                    count: unreadMessages.length
                });

                // Phản hồi lại cho chính user đó
                socket.emit('messagesRead', { chatId, count: unreadMessages.length });
            } catch (err) {
                console.error('Error marking messages read:', err);
                socket.emit('error', { msg: 'Lỗi khi đánh dấu đã đọc' });
            }
        });

        // Ngắt kết nối - giữ nguyên
        socket.on('disconnect', async () => {
            await User.findByIdAndUpdate(socket.user.id, { online: false });
            io.emit('userOffline', { userId: socket.user.id });
            console.log(`User disconnected: ${socket.user.id}`);
        });
    });
};

export default setupChatSocket;