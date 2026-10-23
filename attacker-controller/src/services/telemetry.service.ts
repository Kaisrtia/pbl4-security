import {
  sendTelemetryEnvelope,
  TelemetryEnvelope,
  PacketEventPayload,
  AttackMode,
  AttackAction
} from '@pbl4/shared';

const HACKER_IP = process.env.HACKER_IP || '172.20.0.66';
const GOD_VIEW_URL = process.env.GOD_VIEW_URL || 'http://172.20.0.99:4000/api/telemetry';

export async function sendHackerPacketEvent(
  attackMode: AttackMode,
  action: AttackAction,
  terminalLog: string,
  packetInfo: {
    protocol: 'HTTP' | 'TCP' | 'ARP' | string;
    src: string;
    dst: string;
    flags?: 'PA' | 'S' | 'R' | string;
    seq_num?: number;
    extracted_data?: string;
  }
): Promise<void> {
  const payload: PacketEventPayload = {
    attack_mode: attackMode,
    action,
    packet_info: packetInfo,
    terminal_log: terminalLog
  };

  const envelope: TelemetryEnvelope<PacketEventPayload> = {
    timestamp: Date.now(),
    source_node: 'HACKER',
    source_ip: HACKER_IP,
    event_type: 'PACKET_EVENT',
    severity: 'DANGER',
    payload
  };

  await sendTelemetryEnvelope(envelope, GOD_VIEW_URL);
}
