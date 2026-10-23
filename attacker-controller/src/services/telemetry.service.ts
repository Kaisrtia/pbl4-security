import type { TelemetryPayload, AttackTriggerTelemetryData, AttackResultTelemetryData } from '@pbl4/shared';

const GOD_VIEW_URL = process.env.GOD_VIEW_URL || 'http://localhost:4000/api/telemetry';

export async function sendAttackerTelemetry(
  eventType: 'ATTACK_TRIGGERED' | 'ATTACK_RESULT' | 'SECURITY_ALERT',
  severity: 'INFO' | 'WARNING' | 'CRITICAL',
  data: AttackTriggerTelemetryData | AttackResultTelemetryData | Record<string, unknown>
): Promise<void> {
  const payload: TelemetryPayload = {
    timestamp: new Date().toISOString(),
    source: 'ATTACKER_CONTROLLER',
    eventType,
    severity,
    data: data as Record<string, unknown>
  };

  try {
    await fetch(GOD_VIEW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    // Không làm sập controller nếu God-View Server chưa online
  }
}
