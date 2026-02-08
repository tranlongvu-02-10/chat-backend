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

        await User.findByIdAndUpdate(socket.user.id, { online: true });
        io.emit('userOnline', { userId: socket.user.id });

        socket.on('joinChat', async ({ chatId, isGroup }) => {
            if (isGroup) {
                socket.join(`group_${chatId}`);
            } else {
                const otherUser = chatId;
                const room = [socket.user.id, otherUser].sort().join('_');
                socket.join(room);
            }
        });

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

        socket.on('typing', ({ chatId, isGroup }) => {
            if (isGroup) {
                socket.to(`group_${chatId}`).emit('userTyping', { userId: socket.user.id });
            } else {
                const room = [socket.user.id, chatId].sort().join('_');
                socket.to(room).emit('userTyping', { userId: socket.user.id });
            }
        });

        socket.on('disconnect', async () => {
            await User.findByIdAndUpdate(socket.user.id, { online: false });
            io.emit('userOffline', { userId: socket.user.id });
            console.log(`User disconnected: ${socket.user.id}`);
        });
    });
};

export default setupChatSocket;