import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    // Lấy token từ header Authorization: Bearer <token>
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            msg: 'Không có token, truy cập bị từ chối'
        });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            msg: 'Token không hợp lệ'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, username }
        next();
    } catch (err) {
        console.error('Token error:', err.message);
        res.status(401).json({
            success: false,
            msg: 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
};

export default authMiddleware;