import { LAB, exact, integer, labPort } from '../config.js';
import { processes } from '../services/process.service.js';
import { createSynWorker } from '../services/worker.service.js';

export async function startSynFloodAttack(
  targetIp: unknown = LAB.server,
  port: unknown = 8080,
  durationSec: unknown = 10,
  packetsPerSec: unknown = 100
) {
  exact(targetIp, LAB.server, 'targetIp');
  const targetPort = labPort(port);
  const duration = integer(durationSec, 1, 30, 'durationSec');
  const rate = integer(packetsPerSec, 1, 1000, 'packetsPerSec');

  return processes.start('SYN_FLOOD', duration, {
    commands: [createSynWorker(targetPort, rate)]
  });
}
