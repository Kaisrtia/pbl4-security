import { LAB, exact } from '../config.js';
import { status } from '../services/telemetry.service.js';

export async function inspectTargetContract(targetIp: unknown = LAB.server) {
  exact(targetIp, LAB.server, 'targetIp');
  status('RECON', 'RUNNING', `[RECON] Đang kiểm tra ${LAB.healthUrl}`);

  try {
    const response = await fetch(LAB.healthUrl, {
      redirect: 'error',
      signal: AbortSignal.timeout(3000)
    });
    const body = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(`Target health check returned HTTP ${response.status}`);

    const result = {
      target: LAB.server,
      reachable: true,
      httpStatus: response.status,
      service: body.service,
      endpoints: ['POST /api/login', 'GET /api/resources'],
      transport: ['HTTP 8080', 'TCP 9000']
    };
    status('RECON', 'COMPLETED', '[RECON] Target Server phản hồi bình thường', result);
    return result;
  } catch (error) {
    status('RECON', 'FAILED', `[RECON] ${(error as Error).message}`);
    throw error;
  }
}
