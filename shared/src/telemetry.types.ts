export type TelemetrySource = 'TARGET_SERVER' | 'ATTACKER_CONTROLLER';

export type TelemetryEventType =
  | 'HTTP_REQUEST'
  | 'ATTACK_TRIGGERED'
  | 'ATTACK_RESULT'
  | 'SECURITY_ALERT'
  | 'SYSTEM_METRIC';

export type TelemetrySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AttackType = 'SQL_INJECTION' | 'DOS' | 'MITM' | 'BRUTE_FORCE' | 'NONE';

export interface TelemetryPayload {
  timestamp: string;
  source: TelemetrySource;
  eventType: TelemetryEventType;
  severity: TelemetrySeverity;
  data: Record<string, unknown>;
}

export interface HttpRequestTelemetryData {
  method: string;
  endpoint: string;
  clientIp?: string;
  statusCode: number;
  durationMs: number;
  requestBody?: Record<string, unknown>;
  isSuspectAttack?: boolean;
  attackType?: AttackType;
  details?: string;
}

export interface AttackTriggerTelemetryData {
  attackType: AttackType;
  target: string;
  ratePerSecond?: number;
  status: 'STARTED' | 'STOPPED' | 'IN_PROGRESS';
  payloadExample?: string;
}

export interface AttackResultTelemetryData {
  attackType: AttackType;
  payload: string;
  success: boolean;
  capturedToken?: string;
  leakedData?: Record<string, unknown>;
}
