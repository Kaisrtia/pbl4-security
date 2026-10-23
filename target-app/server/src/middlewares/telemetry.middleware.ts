import { Request, Response, NextFunction } from 'express';
import { reportToGodView } from '@pbl4/shared';
import type { ScenarioType, StatusType } from '@pbl4/shared';

export function telemetryMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Bỏ qua static files hoặc health check
  if (req.path.startsWith('/health') || req.path.startsWith('/dist') || req.path === '/' || req.path.endsWith('.html')) {
    return next();
  }

  res.on('finish', async () => {
    const rawPayload = req.body && Object.keys(req.body).length > 0 ? req.body : undefined;
    const bodyStr = JSON.stringify(rawPayload || {});

    // Kiểm tra dấu hiệu SQL Injection
    const isSqlInjection = /('|--|\bOR\b|\bUNION\b|\bSELECT\b)/i.test(bodyStr);

    let scenario: ScenarioType = 'NORMAL_LOGIN';
    let status: StatusType = 'INFO';
    let summary = `Giao tiếp bình thường: ${req.method} ${req.originalUrl}`;

    if (isSqlInjection) {
      scenario = 'SQL_INJECTION';
      status = 'DANGER';
      summary = `CẢNH BÁO: Phát hiện payload SQL Injection trong yêu cầu tới ${req.originalUrl}`;
    }

    // Lấy câu lệnh SQL thực tế (nếu được route gán vào res.locals.executedSql)
    const sqlExecution = (res.locals.executedSql as string) || (isSqlInjection ? 'Nối chuỗi SQL không an toàn' : 'Truy vấn thông thường');

    await reportToGodView(
      'SERVER',
      'CLIENT_TO_SERVER',
      status,
      summary,
      scenario,
      {
        http_method: req.method,
        endpoint: req.originalUrl,
        raw_payload: rawPayload,
        server_internal_execution: sqlExecution
      }
    );
  });

  next();
}
