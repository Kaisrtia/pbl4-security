import { Request, Response, NextFunction } from 'express';
import type { TelemetryPayload, HttpRequestTelemetryData } from '@pbl4/shared';

const GOD_VIEW_URL = process.env.GOD_VIEW_URL || 'http://localhost:4000/api/telemetry';

export function telemetryMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', async () => {
    const durationMs = Date.now() - startTime;
    const bodyCopy = { ...req.body };
    const rawBodyStr = JSON.stringify(bodyCopy || {});

    // Phát hiện cơ bản dấu hiệu SQL Injection cho Telemetry
    const isSuspectSql = /('|--|\bOR\b|\bUNION\b|\bSELECT\b)/i.test(rawBodyStr);

    const telemetryData: HttpRequestTelemetryData = {
      method: req.method,
      endpoint: req.originalUrl,
      clientIp: req.ip || req.socket.remoteAddress,
      statusCode: res.statusCode,
      durationMs,
      requestBody: req.body,
      isSuspectAttack: isSuspectSql,
      attackType: isSuspectSql ? 'SQL_INJECTION' : 'NONE',
      details: isSuspectSql ? 'Phát hiện ký tự nghi ngờ SQL Injection trong Payload' : undefined
    };

    const payload: TelemetryPayload = {
      timestamp: new Date().toISOString(),
      source: 'TARGET_SERVER',
      eventType: isSuspectSql ? 'SECURITY_ALERT' : 'HTTP_REQUEST',
      severity: isSuspectSql ? 'WARNING' : 'INFO',
      data: telemetryData as unknown as Record<string, unknown>
    };

    try {
      await fetch(GOD_VIEW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // Bỏ qua lỗi nếu God-View Server chưa bật
    }
  });

  next();
}
