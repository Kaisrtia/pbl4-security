import { exec } from 'child_process';
import {
  sendTelemetryEnvelope,
  TelemetryEnvelope,
  StateSnapshotPayload,
  ArpEntry,
  TcpConnection
} from '@pbl4/shared';

const GOD_VIEW_URL = process.env.GOD_VIEW_URL || 'http://172.20.0.99:4000/api/telemetry';
const SERVER_IP = process.env.SERVER_IP || '172.20.0.20';

let mockSynCookies = 0;
let mockArpEntries: ArpEntry[] = [
  { ip: '172.20.0.10', mac: '02:42:ac:14:00:0a', is_spoofed: false },
  { ip: '172.20.0.66', mac: '02:42:ac:14:00:42', is_spoofed: false }
];

export function setSynCookiesConfig(val: number) {
  mockSynCookies = val;
}

export function setArpEntrySpoofed(isSpoofed: boolean) {
  mockArpEntries = mockArpEntries.map((e) => {
    if (e.ip === '172.20.0.10') {
      return {
        ...e,
        mac: isSpoofed ? '02:42:ac:14:00:42' : '02:42:ac:14:00:0a',
        is_spoofed: isSpoofed
      };
    }
    return e;
  });
}

/**
 * Định kỳ gửi STATE_SNAPSHOT về God-View Server (mỗi 2 giây)
 */
export function startOsAgent(intervalMs: number = 2000) {
  setInterval(async () => {
    const payload: StateSnapshotPayload = {
      os_config: {
        syn_cookies: mockSynCookies,
        ip_forward: 0
      },
      arp_table: mockArpEntries,
      tcp_summary: {
        established_count: 1,
        syn_recv_count: mockSynCookies === 1 ? 0 : 2,
        time_wait_count: 1
      },
      tcp_connections: [
        {
          local: '172.20.0.20:8080',
          remote: '172.20.0.10:54322',
          state: 'ESTABLISHED'
        }
      ]
    };

    const envelope: TelemetryEnvelope<StateSnapshotPayload> = {
      timestamp: Date.now(),
      source_node: 'SERVER',
      source_ip: SERVER_IP,
      event_type: 'STATE_SNAPSHOT',
      severity: mockArpEntries.some((e) => e.is_spoofed) ? 'DANGER' : 'NORMAL',
      payload
    };

    await sendTelemetryEnvelope(envelope, GOD_VIEW_URL);
  }, intervalMs);

  console.log(`[OS Agent] Đã khởi chạy chu kỳ đọc bảng mạng & sysctl (mỗi ${intervalMs / 1000}s) gửi về God-View.`);
}
