// Fixed addresses of the isolated PBL4 Docker lab. Attack routes never accept
// an arbitrary destination, which prevents the controller from leaving cyber_net.
export const LAB = {
  server: '172.20.0.20',
  hacker: '172.20.0.66',
  iface: 'eth0',
  telemetry: 'http://172.20.0.99:4000/api/telemetry'
} as const;
export class InputError extends Error {}
export class ConflictError extends Error {}
export function exact(value: unknown, expected: string, name: string): string {
  if (value !== expected) throw new InputError(`${name} must be ${expected} (PBL4 lab)`);
  return expected;
}
export function integer(value: unknown, min: number, max: number, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    throw new InputError(`${name} must be an integer from ${min} to ${max}`);
  return value;
}
export function labPort(value: unknown): number {
  if (value !== 8080 && value !== 9000) throw new InputError('port must be 8080 or 9000');
  return value;
}
