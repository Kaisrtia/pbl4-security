import readline from 'node:readline';
import { startSynFloodAttack } from './attacks/syn_flood.attack.js';
import { processes } from './services/process.service.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question: string) => new Promise<string>(resolve => rl.question(question, resolve));

console.log('=== PBL4 - ATTACKER CONTROLLER CỦA TRÍ ===');
console.log('Bộ chạy SYN Flood cũ: chỉ Target Server 172.20.0.20 trong cyber_net; chưa hỗ trợ LAN/hotspot.');

function printMenu() {
  console.log('\n1. Chạy TCP SYN Flood trong lab Docker cũ');
  console.log('2. Xem kịch bản đang chạy');
  console.log('3. Dừng tất cả kịch bản');
  console.log('4. Thoát');
}

async function menu(): Promise<void> {
  printMenu();
  const choice = (await ask('Chọn thao tác (1-4): ')).trim();

  try {
    if (choice === '1') {
      console.log(await startSynFloodAttack());
    } else if (choice === '2') {
      console.table(processes.snapshot());
    } else if (choice === '3') {
      processes.stopAll();
      console.log('Đã dừng tất cả kịch bản.');
    } else if (choice === '4') {
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
