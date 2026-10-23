import { sendHackerPacketEvent } from '../services/telemetry.service.js';

let isArpSpoofActive = false;

export async function toggleArpSpoof(
  enable: boolean,
  clientIp: string = '172.20.0.10',
  serverIp: string = '172.20.0.20'
) {
  if (enable) {
    isArpSpoofActive = true;
    console.log(`[ARP Spoof] Bắt đầu ARP Poisoning: arpspoof -i eth0 -t ${clientIp} -r ${serverIp}`);

    const terminalLog = `[ARP-SPOOF] Executed: arpspoof -i eth0 -t ${clientIp} -r ${serverIp} (Poisoned ARP Cache)`;

    await sendHackerPacketEvent('ARP_SPOOF', 'INTERCEPTED', terminalLog, {
      protocol: 'ARP',
      src: '172.20.0.66',
      dst: clientIp,
      extracted_data: `Claimed MAC of ${serverIp} is 02:42:ac:14:00:42`
    });

    // Giả lập bắt được gói tin HTTP POST /api/login khi người dùng đăng nhập
    setTimeout(async () => {
      if (!isArpSpoofActive) return;
      await sendHackerPacketEvent('ARP_SPOOF', 'INTERCEPTED', `[ARP-SPOOF] Sniffed credentials from ${clientIp} -> user=hanhnguyen&pass=secret123`, {
        protocol: 'HTTP',
        src: `${clientIp}:54322`,
        dst: `${serverIp}:8080`,
        flags: 'PA',
        extracted_data: 'POST /api/login -> user=hanhnguyen&pass=secret123'
      });
    }, 2000);

    return { active: true, mode: 'ARP_SPOOF', message: 'ARP Spoofing activated' };
  } else {
    isArpSpoofActive = false;
    console.log('[ARP Spoof] Đã dừng ARP Spoofing');
    return { active: false, mode: 'ARP_SPOOF', message: 'ARP Spoofing deactivated' };
  }
}
