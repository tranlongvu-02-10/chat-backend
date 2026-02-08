# Real-Time Chat Backend

Backend cho ứng dụng chat thời gian thực (1-1 và group chat) sử dụng **Node.js**, **Express**, **Socket.io**, **MongoDB** và **JWT** authentication.

Dự án hỗ trợ:
- Đăng ký / Đăng nhập người dùng
- Chat cá nhân (1-1) và chat nhóm
- Gửi/nhận tin nhắn realtime
- Trạng thái online/offline
- Typing indicator (đang gõ...)
- Lưu trữ lịch sử tin nhắn trong MongoDB

## Công nghệ sử dụng

- **Node.js** + **Express** (API server)
- **Socket.io** (real-time communication)
- **MongoDB** + **Mongoose** (database)
- **JWT** (jsonwebtoken) + **bcryptjs** (authentication & password hashing)
- **ES Modules** (`"type": "module"`)
- **dotenv** (quản lý biến môi trường)

## Cấu trúc dự án

```
chat-backend/
├── config/
│   └── db.js            # Kết nối MongoDB
├── controllers/
│   └── chatController.js  # Logic xử lý chat
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── models/
│   ├── User.js          # Model User
│   ├── Message.js       # Model Message
│   └── ChatRoom.js      # Model ChatRoom
├── routes/
│   └── chat.js          # API routes
├── server.js            # Điểm vào chính của ứng dụng
├── package.json
└── .env                 # Biến môi trường (không commit lên Git)
└── .env.example         # Mẫu biến môi trường

## Yêu cầu cài đặt

- Node.js >= 18.x
- MongoDB Atlas (hoặc MongoDB local)
