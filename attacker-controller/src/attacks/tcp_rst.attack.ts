import { sendHackerPacketEvent } from '../services/telemetry.service.js';

export async function runTcpRstInjection(
  clientIp: string = '172.20.0.10',
  targetIp: string = '172.20.0.20',
  port: number = 8080
) {
  console.log(`[TCP RST Attack] Bơm gói tin TCP RST giả mạo vào luồng kết nối giữa ${clientIp} và ${targetIp}:${port}`);

  const terminalLog = `[TCP-RST] Injected forged RST packet into connection ${clientIp} <-> ${targetIp}:${port} (seq=19482731)`;

  await sendHackerPacketEvent('TCP_RST', 'INJECTED', terminalLog, {
    protocol: 'TCP',
    src: `${clientIp}:54322`,
    dst: `${targetIp}:${port}`,
    flags: 'R',
    seq_num: 19482731,
    extracted_data: 'TCP connection forcefully terminated by injected RST packet'
  });

  return {
    status: 'injected',
    mode: 'TCP_RST',
    message: `Injected forged TCP RST packet into ${clientIp} <-> ${targetIp}:${port}`
  };
}
