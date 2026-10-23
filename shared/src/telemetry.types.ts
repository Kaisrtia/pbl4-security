/**
 * CHUẨN HÓA JSON EVENT SCHEMA (HỢP ĐỒNG DỮ LIỆU MILESTONE 1 - TUẦN 1)
 * Trích xuất trực tiếp từ Mục 4 của Báo cáo - PBL4
 */

export type SourceNode = 'CLIENT' | 'SERVER' | 'HACKER';

export type EventType =
  | 'STATE_SNAPSHOT'
  | 'PACKET_EVENT'
  | 'ATTACK_STATUS'
  | 'APP_EVENT';

export type Severity = 'NORMAL' | 'WARNING' | 'DANGER';

export type AttackMode = 'ARP_SPOOF' | 'SYN_FLOOD' | 'TCP_RST';

export type AttackAction = 'INTERCEPTED' | 'INJECTED' | 'FLOODING';

export type AppAction =
  | 'LOGIN_ATTEMPT'
  | 'RESOURCE_FETCH'
  | 'CONNECTION_RESET'
  | 'REQUEST_TIMEOUT';

// 1. STATE_SNAPSHOT Payload (Trung T1-TV1 gửi định kỳ 1-2s)
export interface ArpEntry {
  ip: string;
  mac: string;
  is_spoofed: boolean;
}

export interface TcpConnection {
  local: string;
  remote: string;
  state: 'ESTABLISHED' | 'SYN_RECV' | 'TIME_WAIT' | 'LISTEN' | string;
}

export interface StateSnapshotPayload {
  os_config: {
    syn_cookies: number; // 0 hoặc 1
    ip_forward: number;  // 0 hoặc 1
  };
  arp_table: ArpEntry[];
  tcp_summary: {
    established_count: number;
    syn_recv_count: number;
    time_wait_count: number;
  };
  tcp_connections: TcpConnection[];
}

// 2. PACKET_EVENT & ATTACK_STATUS Payload (Trí T1-TV2 gửi từ Hacker)
export interface PacketInfo {
  protocol: 'HTTP' | 'TCP' | 'ARP' | string;
  src: string;
  dst: string;
  flags?: 'PA' | 'S' | 'R' | string;
  seq_num?: number;
  extracted_data?: string;
}

export interface PacketEventPayload {
  attack_mode: AttackMode;
  action: AttackAction;
  packet_info: PacketInfo;
  terminal_log: string;
}

// 3. APP_EVENT Payload (Client / Server gửi khi thao tác ứng dụng)
export interface AppEventPayload {
  action: AppAction;
  target_ip: string;
  http_status?: number;
  terminal_log: string;
}

// KHUNG ENVELOPE CHUNG BẮT BUỘC
export interface TelemetryEnvelope<T = unknown> {
  timestamp: number;
  source_node: SourceNode;
  source_ip: string;
  event_type: EventType;
  severity: Severity;
  payload: T;
}

/**
 * Hàm helper chuẩn dùng chung để gửi telemetry về God-View Server
 */
export async function sendTelemetryEnvelope<T>(
  envelope: TelemetryEnvelope<T>,
  godViewUrl: string = process.env.GOD_VIEW_URL || 'http://172.20.0.99:4000/api/telemetry'
): Promise<void> {
  try {
    await fetch(godViewUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope)
    });
  } catch (err) {
    // Không làm sập ứng dụng nếu God-View Server chưa online
  }
}
