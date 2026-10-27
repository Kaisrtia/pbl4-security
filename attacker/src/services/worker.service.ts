import { fileURLToPath } from 'node:url';
import { LAB } from '../config.js';
import type { CommandSpec } from './process.service.js';
import { status } from './telemetry.service.js';

interface WorkerEvent {
  type: 'ready' | 'progress' | 'error';
  message?: string;
  sent?: number;
}

const workerPath = fileURLToPath(new URL('../../scripts/syn_flood.py', import.meta.url));

export function createSynWorker(port = 8080, rate = 100): CommandSpec {
  return {
    file: 'python3',
    args: [
      '-u', workerPath,
      '--interface', LAB.iface,
      '--server', LAB.server,
      '--port', String(port),
      '--rate', String(rate)
    ],
    onLine(line) {
      const event = JSON.parse(line) as WorkerEvent;

      if (event.type === 'ready') {
        status(
          'SYN_FLOOD',
          'RUNNING',
          event.message ?? '[SYN-FLOOD] worker ready'
        );
      } else if (event.type === 'progress') {
        status('SYN_FLOOD', 'RUNNING', `[SYN-FLOOD] Đã gửi ${event.sent ?? 0} gói SYN trong cyber_net`, {
          sentPackets: event.sent ?? 0,
          target: `${LAB.server}:${port}`,
          packetsPerSecond: rate
        });
      } else if (event.type === 'error') {
        throw new Error(event.message ?? 'Unknown worker error');
      }
    }
  };
}
