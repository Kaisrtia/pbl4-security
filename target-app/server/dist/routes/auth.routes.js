import { Router } from 'express';
import { db } from '../database/db.js';
export const authRouter = Router();
// Bộ nhớ lưu session tạm
export const activeSessions = new Set();
/**
 * POST /api/login
 * Nhận: { username, password }
 * Trả về: Token / Session
 * LƯU Ý BẢO MẬT: Chứa lỗ hổng SQL Injection có chủ đích theo yêu cầu PBL4
 */
authRouter.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        // CỐ TÌNH ĐỂ LỖ HỔNG: Nối chuỗi trực tiếp thay vì dùng parameterized query (?, ?)
        const rawQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
        console.log(`[SQL EXEC] Executing: ${rawQuery}`);
        const user = db.prepare(rawQuery).get();
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Tạo token giả lập session
        const sessionToken = `session_${user.username}_${Date.now()}`;
        activeSessions.add(sessionToken);
        return res.json({
            message: 'Login successful',
            token: sessionToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Database error',
            details: error.message
        });
    }
});
//# sourceMappingURL=auth.routes.js.map