import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/users
// Query params:
// - search: string (tìm theo username, không phân biệt hoa thường)
// - page: number (mặc định 1)
// - limit: number (mặc định 20)
// - onlineOnly: boolean (true = chỉ lấy user online)

router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, page = 1, limit = 20, onlineOnly } = req.query;

        // Xây dựng query
        const query = {};

        // Lọc theo username (search)
        if (search) {
            query.username = { $regex: search, $options: 'i' }; // case-insensitive
        }

        // Chỉ lấy user online nếu yêu cầu
        if (onlineOnly === 'true') {
            query.online = true;
        }

        // Phân trang
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const perPage = parseInt(limit);

        // Lấy danh sách users
        const users = await User.find(query)
            .select('username email online createdAt') // chỉ lấy các trường cần
            .sort({ online: -1, username: 1 }) // ưu tiên online lên đầu, sau đó sắp xếp alphabet
            .skip(skip)
            .limit(perPage);

        // Đếm tổng số để biết có trang tiếp theo không
        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                total,
                page: parseInt(page),
                limit: perPage,
                totalPages: Math.ceil(total / perPage),
            },
        });
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
});

export default router;