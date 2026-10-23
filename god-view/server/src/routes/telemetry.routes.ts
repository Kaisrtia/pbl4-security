import { Router, Request, Response } from 'express';
import type { TelemetryPayload } from '@pbl4/shared';
import { broadcastTelemetry } from '../websocket/ws.server.js';

export const telemetryRouter = Router();

// Lưu giữ 200 telemetry gần nhất trong bộ nhớ để client mới vào xem lại
export const recentTelemetryLogs: TelemetryPayload[] = [];

/**
 * POST /api/telemetry
 * Nhận bản tin JSON từ TV1 (Target Server) và TV2 (Attacker Controller)
 */
telemetryRouter.post('/telemetry', (req: Request, res: Response) => {
  const payload = req.body as TelemetryPayload;

  if (!payload || !payload.source || !payload.eventType) {
    return res.status(400).json({ error: 'Invalid telemetry payload structure' });
  }

  // Gán timestamp nếu thiếu
  if (!payload.timestamp) {
    payload.timestamp = new Date().toISOString();
  }

  console.log(`[God-View Telemetry] Received from [${payload.source}] - [${payload.eventType}] (${payload.severity})`);

  // Lưu log
  recentTelemetryLogs.push(payload);
  if (recentTelemetryLogs.length > 200) {
    recentTelemetryLogs.shift();
  }

  // Đẩy thẳng qua WebSocket đến giao diện Web
  broadcastTelemetry(payload);

  return res.status(200).json({ status: 'received', timestamp: payload.timestamp });
});

/**
 * GET /api/telemetry/history
 * Lấy danh sách lịch sử telemetry
 */
telemetryRouter.get('/telemetry/history', (req: Request, res: Response) => {
  res.json({ total: recentTelemetryLogs.length, logs: recentTelemetryLogs });
});
