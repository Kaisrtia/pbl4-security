import { Request, Response, NextFunction } from 'express';
import { sendTelemetryEnvelope } from '@pbl4/shared';
import type {
  AppAction,
  AppEventPayload,
  Severity,
  TelemetryEnvelope
} from '@pbl4/shared';

const GOD_VIEW_URL = process.env.GOD_VIEW_URL || 'http://172.20.0.99:4000/api/telemetry';
const SERVER_IP = process.env.SERVER_IP || '172.20.0.20';

export function telemetryMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Bỏ qua static files hoặc health check
  if (req.path.startsWith('/health') || req.path.startsWith('/dist') || req.path === '/' || req.path.endsWith('.html')) {
    return next();
  }

  res.on('finish', () => {
    const rawPayload = req.body && Object.keys(req.body).length > 0 ? req.body : undefined;
    const bodyStr = JSON.stringify(rawPayload || {});

    // Kiểm tra dấu hiệu SQL Injection
    const isSqlInjection = /('|--|\bOR\b|\bUNION\b|\bSELECT\b)/i.test(bodyStr);

    const action: AppAction = req.path === '/resources' ? 'RESOURCE_FETCH' : 'LOGIN_ATTEMPT';
    const severity: Severity = isSqlInjection ? 'DANGER' : 'NORMAL';
    const terminalLog = isSqlInjection
      ? `[SERVER] CẢNH BÁO SQL Injection tại ${req.method} ${req.originalUrl} (HTTP ${res.statusCode})`
      : `[SERVER] ${req.method} ${req.originalUrl} hoàn tất (HTTP ${res.statusCode})`;

    const payload: AppEventPayload = {
      action,
      target_ip: SERVER_IP,
      http_status: res.statusCode,
      terminal_log: terminalLog
    };

    const envelope: TelemetryEnvelope<AppEventPayload> = {
      timestamp: Date.now(),
      source_node: 'SERVER',
      source_ip: SERVER_IP,
      event_type: 'APP_EVENT',
      severity,
      payload
    };

    void sendTelemetryEnvelope(envelope, GOD_VIEW_URL);
  });

  next();
}
