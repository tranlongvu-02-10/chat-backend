import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'https://your-frontend.com'],
        methods: ['GET', 'POST'],
    },
});

await connectDB();  // vì async, dùng await ở top-level (ESM hỗ trợ)

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Chat backend running:' }));

// Import routes
import authRoutes from './routes/authRoutes.js';
app.use('/api/auth', authRoutes);

import userRoutes from './routes/userRoutes.js';
app.use('/api/users', userRoutes);

// Socket logic
import setupChatSocket from './sockets/chatSocket.js';
setupChatSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
});