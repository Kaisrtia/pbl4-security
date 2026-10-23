import { LAB, boolean, exact, integer } from '../config.js';
import { processes } from '../services/process.service.js';
import { createLabWorker } from '../services/worker.service.js';

export async function toggleArpSpoof(
  enable: unknown,
  clientIp: unknown = LAB.client,
  serverIp: unknown = LAB.server,
  durationSec: unknown = 60
) {
  boolean(enable);
  exact(clientIp, LAB.client, 'clientIp');
  exact(serverIp, LAB.server, 'serverIp');

  if (!enable) {
    processes.stop('TCP_RST', 'ARP Spoofing stopped');
    return processes.stop('ARP_SPOOF');
  }

  const duration = integer(durationSec, 1, 300, 'durationSec');
  return processes.start('ARP_SPOOF', duration, {
    commands: [createLabWorker('arp', 8080)],
    onStop: () => {
      processes.stop('TCP_RST', 'ARP Spoofing stopped');
    }
  });
}
