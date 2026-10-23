/**
 * CHUẨN HÓA JSON EVENT SCHEMA (HỢP ĐỒNG DỮ LIỆU MILESTONE 1 - TUẦN 1)
 * Trích xuất trực tiếp từ Mục 4 của Báo cáo - PBL4
 */
export type SourceNode = 'CLIENT' | 'SERVER' | 'HACKER';
export type EventType = 'STATE_SNAPSHOT' | 'PACKET_EVENT' | 'ATTACK_STATUS' | 'APP_EVENT';
export type Severity = 'NORMAL' | 'WARNING' | 'DANGER';
export type AttackMode = 'ARP_SPOOF' | 'SYN_FLOOD' | 'TCP_RST';
export type AttackAction = 'INTERCEPTED' | 'INJECTED' | 'FLOODING';
export type AppAction = 'LOGIN_ATTEMPT' | 'RESOURCE_FETCH' | 'CONNECTION_RESET' | 'REQUEST_TIMEOUT';
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
        syn_cookies: number;
        ip_forward: number;
    };
    arp_table: ArpEntry[];
    tcp_summary: {
        established_count: number;
        syn_recv_count: number;
        time_wait_count: number;
    };
    tcp_connections: TcpConnection[];
}
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
export interface AppEventPayload {
    action: AppAction;
    target_ip: string;
    http_status?: number;
    terminal_log: string;
}
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
export declare function sendTelemetryEnvelope<T>(envelope: TelemetryEnvelope<T>, godViewUrl?: string): Promise<void>;
