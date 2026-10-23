import { sendHackerPacketEvent } from '../services/telemetry.service.js';

let isSynFloodRunning = false;
let synFloodInterval: NodeJS.Timeout | null = null;

export async function startSynFloodAttack(
  targetIp: string = '172.20.0.20',
  port: number = 8080,
  durationSec: number = 10
) {
  if (isSynFloodRunning) {
    return { status: 'already_running', message: 'SYN Flood is already active' };
  }

  isSynFloodRunning = true;
  console.log(`[SYN Flood] Bắt đầu SYN Flood (hping3 style) tới ${targetIp}:${port}`);

  const terminalLog = `[SYN-FLOOD] Running: hping3 -S -p ${port} --rand-source --interval u1000 ${targetIp}`;

  await sendHackerPacketEvent('SYN_FLOOD', 'FLOODING', terminalLog, {
    protocol: 'TCP',
    src: '172.20.0.66:RANDOM',
    dst: `${targetIp}:${port}`,
    flags: 'S',
    extracted_data: 'SYN Flood packet flood initiated'
  });

  synFloodInterval = setInterval(async () => {
    await sendHackerPacketEvent('SYN_FLOOD', 'FLOODING', `[SYN-FLOOD] Flooding target ${targetIp}:${port} with SYN packets (backlog exhausting)`, {
      protocol: 'TCP',
      src: '172.20.0.66:RANDOM',
      dst: `${targetIp}:${port}`,
      flags: 'S'
    });
  }, 1000);

  setTimeout(() => {
    stopSynFloodAttack();
  }, durationSec * 1000);

  return {
    status: 'started',
    mode: 'SYN_FLOOD',
    target: `${targetIp}:${port}`,
    durationSec
  };
}

export function stopSynFloodAttack() {
  if (synFloodInterval) {
    clearInterval(synFloodInterval);
    synFloodInterval = null;
  }
  isSynFloodRunning = false;
  console.log('[SYN Flood] Đã dừng tấn công SYN Flood');
}
