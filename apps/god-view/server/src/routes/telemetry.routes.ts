import { Router, Request, Response } from 'express';
import type { TelemetryEnvelope } from '@pbl4/shared';
import { broadcastTelemetry } from '../websocket/ws.server.js';

export const telemetryRouter = Router();

export const recentTelemetryLogs: TelemetryEnvelope[] = [];

/**
 * POST /api/telemetry
 * Nhận bản tin JSON từ Trung (T1-TV1) và Trí (T1-TV2) gửi về
 */
telemetryRouter.post('/telemetry', (req: Request, res: Response) => {
  const envelope = req.body as TelemetryEnvelope;

  if (!envelope || !envelope.source_node || !envelope.event_type) {
    return res.status(400).json({ error: 'Invalid telemetry envelope format' });
  }

  if (!envelope.timestamp) {
    envelope.timestamp = Date.now();
  }

  console.log(`[God-View Telemetry] [${envelope.source_node} - ${envelope.source_ip}] -> ${envelope.event_type} (${envelope.severity})`);

  recentTelemetryLogs.push(envelope);
  if (recentTelemetryLogs.length > 200) {
    recentTelemetryLogs.shift();
  }

  // Phát WebSocket lên giao diện với định dạng { event: "GOD_VIEW_UPDATE", data: envelope }
  broadcastTelemetry(envelope);

  return res.status(200).json({ status: 'received', timestamp: envelope.timestamp });
});

/**
 * GET /api/telemetry/history
 */
telemetryRouter.get('/telemetry/history', (req: Request, res: Response) => {
  res.json({ total: recentTelemetryLogs.length, logs: recentTelemetryLogs });
});
