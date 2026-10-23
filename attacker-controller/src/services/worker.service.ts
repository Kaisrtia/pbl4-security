import { fileURLToPath } from 'node:url';
import { LAB } from '../config.js';
import type { CommandSpec } from './process.service.js';
import { packet, status } from './telemetry.service.js';

type WorkerMode = 'arp' | 'syn' | 'rst';

interface WorkerEvent {
  type: 'ready' | 'arp' | 'credentials' | 'progress' | 'rst' | 'error';
  message?: string;
  username?: string;
  password?: string;
  sent?: number;
  src?: string;
  dst?: string;
  sport?: number;
  dport?: number;
  seq?: number;
}

const workerPath = fileURLToPath(new URL('../../scripts/lab_attack.py', import.meta.url));

export function createLabWorker(mode: WorkerMode, port = 8080, rate = 100): CommandSpec {
  return {
    file: 'python3',
    args: [
      '-u', workerPath, mode,
      '--interface', LAB.iface,
      '--client', LAB.client,
      '--server', LAB.server,
      '--port', String(port),
      '--rate', String(rate)
    ],
    onLine(line) {
      const event = JSON.parse(line) as WorkerEvent;

      if (event.type === 'ready') {
        status(
          mode === 'arp' ? 'ARP_SPOOF' : mode === 'syn' ? 'SYN_FLOOD' : 'TCP_RST',
          'RUNNING',
          event.message ?? `[${mode}] worker ready`
        );
      } else if (event.type === 'arp') {
        packet('ARP_SPOOF', 'INTERCEPTED', {
          protocol: 'ARP',
          src: LAB.hacker,
          dst: `${LAB.client} <-> ${LAB.server}`,
          extracted_data: event.message
        }, event.message);
      } else if (event.type === 'credentials') {
        packet('ARP_SPOOF', 'INTERCEPTED', {
          protocol: 'HTTP',
          src: event.src ?? `${LAB.client}:unknown`,
          dst: event.dst ?? `${LAB.server}:8080`,
          flags: 'PA',
          extracted_data: `username=${event.username}&password=${event.password}`
        }, `[ARP-SPOOF] Bắt được thông tin đăng nhập từ ${event.src}: user=${event.username}`);
      } else if (event.type === 'progress') {
        status('SYN_FLOOD', 'RUNNING', `[SYN-FLOOD] Đã gửi ${event.sent ?? 0} gói SYN trong cyber_net`, {
          sentPackets: event.sent ?? 0,
          target: `${LAB.server}:${port}`,
          packetsPerSecond: rate
        });
      } else if (event.type === 'rst') {
        packet('TCP_RST', 'INJECTED', {
          protocol: 'TCP',
          src: event.src ?? `${LAB.client}:${event.sport ?? 'unknown'}`,
          dst: event.dst ?? `${LAB.server}:${event.dport ?? port}`,
          flags: 'R',
          seq_num: event.seq,
          extracted_data: 'RST packet injected into an observed lab connection'
        }, `[TCP-RST] Đã bơm RST vào kết nối ${event.src} -> ${event.dst}`);
      } else if (event.type === 'error') {
        throw new Error(event.message ?? 'Unknown worker error');
      }
    }
  };
}
