import type {
  AttackAction,
  AttackMode,
  PacketInfo,
  Severity,
  TelemetryEnvelope
} from '@pbl4/shared';
import { LAB } from '../config.js';

export type Mode = AttackMode | 'SQL_INJECTION' | 'DOS_FLOOD' | 'RECON';
type Payload = Record<string, unknown>;

// God-View may be started after the controller, so telemetry delivery is isolated
// from attack lifecycle management and uses a small bounded queue.
const queue: TelemetryEnvelope<Payload>[] = [];
let draining = false;
let lastWarning = 0;

export function report(event: 'PACKET_EVENT' | 'ATTACK_STATUS', payload: Payload,
  severity: Severity = 'NORMAL'): void {
  const envelope: TelemetryEnvelope<Payload> = {
    timestamp: Date.now(),
    source_node: 'HACKER',
    source_ip: LAB.hacker,
    event_type: event,
    severity,
    payload
  };

  console.log(JSON.stringify(envelope));
  if (queue.length >= 100) queue.shift();
  queue.push(envelope);
  void drain();
}

async function drain(): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    while (queue.length) {
      const envelope = queue.shift();
      try {
        const response = await fetch(LAB.telemetry, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(envelope),
          signal: AbortSignal.timeout(1500)
        });
        await response.body?.cancel();
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (Date.now() - lastWarning > 10000) {
          console.error(`[telemetry] Delivery failed: ${(error as Error).message}`);
          lastWarning = Date.now();
        }
      }
    }
  } finally { draining = false; }
}

export function status(
  mode: Mode,
  state: string,
  log: string,
  details: Payload = {},
  severityOverride?: Severity
): void {
  const severity: Severity = severityOverride ?? (state === 'FAILED'
    ? 'WARNING'
    : state === 'RUNNING' ? 'DANGER' : 'NORMAL');
  report('ATTACK_STATUS', {
    attack_mode: mode,
    status: state,
    terminal_log: log,
    ...details
  }, severity);
}

export function packet(
  mode: AttackMode,
  action: AttackAction,
  info: PacketInfo,
  terminalLog?: string
): void {
  report('PACKET_EVENT', {
    attack_mode: mode,
    action,
    packet_info: info,
    terminal_log: terminalLog ?? `[${mode}] ${action}: ${info.src} -> ${info.dst}`
  }, 'DANGER');
}
