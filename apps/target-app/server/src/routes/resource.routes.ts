import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';
import { activeSessions } from './auth.routes.js';

export const resourceRouter = Router();

/**
 * GET /api/resources
 * Trả về danh sách tài nguyên mật (khi đã đăng nhập)
 */
resourceRouter.get('/resources', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!activeSessions.has(token)) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired session token' });
  }

  try {
    const resources = db.prepare('SELECT id, title, secret_content, classification_level FROM resources').all();
    return res.json({
      message: 'Secure resources retrieved successfully',
      data: resources
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve resources', details: (error as Error).message });
  }
});
