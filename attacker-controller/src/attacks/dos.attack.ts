import { LAB, exact, integer, labPort } from '../config.js';
import { processes } from '../services/process.service.js';
import { status } from '../services/telemetry.service.js';
import { createLabWorker } from '../services/worker.service.js';

export async function startSynFloodAttack(
  targetIp: unknown = LAB.server,
  port: unknown = 8080,
  durationSec: unknown = 10,
  packetsPerSec: unknown = 100
) {
  exact(targetIp, LAB.server, 'targetIp');
  const targetPort = labPort(port);
  const duration = integer(durationSec, 1, 30, 'durationSec');
  const rate = integer(packetsPerSec, 1, 1000, 'packetsPerSec');

  return processes.start('SYN_FLOOD', duration, {
    commands: [createLabWorker('syn', targetPort, rate)]
  });
}

export function stopSynFloodAttack() {
  return processes.stop('SYN_FLOOD');
}

export async function startHttpDosAttack(
  targetUrl: unknown = LAB.loginUrl,
  ratePerSec: unknown = 50,
  durationSec: unknown = 10
) {
  exact(targetUrl, LAB.loginUrl, 'targetUrl');
  const rate = integer(ratePerSec, 1, 50, 'ratePerSec');
  const duration = integer(durationSec, 1, 30, 'durationSec');
  const controller = new AbortController();
  let sent = 0;
  let succeeded = 0;
  let failed = 0;

  return processes.start('DOS_FLOOD', duration, {
    onTick: () => {
      const requests = Array.from({ length: rate }, async () => {
        sent += 1;
        try {
          const response = await fetch(LAB.loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'load-test-user', password: 'invalid-password' }),
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(1500)])
          });
          await response.body?.cancel();
          succeeded += 1;
        } catch {
          failed += 1;
        }
      });

      void Promise.allSettled(requests).then(() => {
        if (!processes.isRunning('DOS_FLOOD')) return;
        status('DOS_FLOOD', 'RUNNING', `[HTTP-DOS] Đã gửi ${sent} request tới API đăng nhập`, {
          target: LAB.loginUrl,
          ratePerSec: rate,
          sent,
          succeeded,
          failed
        });
      });
    },
    onStop: () => controller.abort()
  });
}
