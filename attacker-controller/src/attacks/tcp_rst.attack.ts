import { LAB, ConflictError, exact, integer, labPort } from '../config.js';
import { processes } from '../services/process.service.js';
import { createLabWorker } from '../services/worker.service.js';

export async function runTcpRstInjection(
  clientIp: unknown = LAB.client,
  targetIp: unknown = LAB.server,
  port: unknown = 8080,
  durationSec: unknown = 10
) {
  exact(clientIp, LAB.client, 'clientIp');
  exact(targetIp, LAB.server, 'targetIp');
  const targetPort = labPort(port);
  const duration = integer(durationSec, 1, 30, 'durationSec');
  if (!processes.isRunning('ARP_SPOOF')) {
    throw new ConflictError('Start ARP Spoofing first so hacker_node can observe the TCP stream');
  }

  return processes.start('TCP_RST', duration, {
    commands: [createLabWorker('rst', targetPort)]
  });
}
